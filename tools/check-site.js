#!/usr/bin/env node
/**
 * 站点自检：本地随时可跑，CI 每次 push 也会跑。
 * 任何一项失败就以非零码退出，阻止把坏版本推上线。
 *
 *   node tools/check-site.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'services.html', 'cases.html', 'about.html'];
const scripts = ['assets/js/site.js', 'assets/js/i18n.js'];

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* ---------- 读入所有页面，收集各页 id ---------- */
const src = {};
const ids = {};
for (const p of pages) {
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { fail(`页面缺失：${p}`); continue; }
  src[p] = fs.readFileSync(f, 'utf8');
  ids[p] = new Set([...src[p].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

for (const p of Object.keys(src)) {
  const s = src[p];

  /* ---------- 1. 本地资源引用是否存在 ---------- */
  const refs = [...s.matchAll(/(?:src|href)="(?!https?:|mailto:|tel:|data:|#)([^"]+)"/g)].map((m) => m[1]);
  for (const raw of new Set(refs)) {
    const [file, hash] = raw.split('#');
    if (file && !fs.existsSync(path.join(root, file))) {
      fail(`${p}：引用了不存在的文件 → ${file}`);
      continue;
    }
    // 跨页锚点是否存在
    if (hash && file && ids[file]) {
      if (!ids[file].has(hash)) fail(`${p}：锚点失效 → ${file}#${hash}`);
    }
  }

  /* ---------- 2. 同页锚点 ---------- */
  for (const m of s.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (id && !ids[p].has(id)) fail(`${p}：同页锚点失效 → #${id}`);
  }

  /* ---------- 3. 块级标签配平 ---------- */
  const open = (s.match(/<(section|article|div|dl|ul|ol|form|header|footer|main|nav)\b/g) || []).length;
  const close = (s.match(/<\/(section|article|div|dl|ul|ol|form|header|footer|main|nav)>/g) || []).length;
  if (open !== close) fail(`${p}：块级标签不配平（开 ${open} / 闭 ${close}）`);

  /* ---------- 4. 图片必须有 alt ---------- */
  for (const m of s.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) fail(`${p}：<img> 缺少 alt → ${m[0].slice(0, 70)}`);
  }

  /* ---------- 5. 双语完整性 ---------- */
  if (!/data-lang-btn="en"/.test(s)) fail(`${p}：缺少英文切换按钮`);
  if (!/assets\/js\/i18n\.js/.test(s)) fail(`${p}：未引入 i18n.js`);
  // data-en 值里出现裸双引号会截断属性，i18n 切换后会丢内容
  for (const m of s.matchAll(/data-en="([^"]*)"/g)) {
    if (/(^|[^&])&(?!amp;|quot;|lt;|gt;|#|nbsp;|ldquo;|rdquo;)/.test(m[1])) {
      warn(`${p}：data-en 里有未转义的 & → ${m[1].slice(0, 50)}`);
    }
  }

  /* ---------- 6. 必备 meta ---------- */
  if (!/<meta name="description"/.test(s)) fail(`${p}：缺少 meta description`);
  if (!/<title>/.test(s)) fail(`${p}：缺少 <title>`);

  /* ---------- 7. 联系方式一致性 ---------- */
  if (/>mengjin0808@gmail\.com</.test(s)) {
    warn(`${p}：真实收件邮箱出现在页面可见文字中（应只出现在 href / data-mailto）`);
  }
}

/* ---------- 8. 案例筛选器数量与卡片是否对得上 ---------- */
if (src['cases.html']) {
  const s = src['cases.html'];
  const counts = {};
  for (const m of s.matchAll(/data-tags="([^"]*)"/g)) {
    for (const t of m[1].trim().split(/\s+/)) counts[t] = (counts[t] || 0) + 1;
  }
  const total = (s.match(/data-tags="/g) || []).length;
  for (const m of s.matchAll(/data-filter="([^"]+)"[\s\S]{0,220}?class="filter__count">(\d+)</g)) {
    const [, key, shown] = m;
    const actual = key === 'all' ? total : (counts[key] || 0);
    if (Number(shown) !== actual) {
      fail(`cases.html：筛选器「${key}」标了 ${shown}，实际有 ${actual} 张卡片`);
    }
  }
}

/* ---------- 9. JS 语法 ---------- */
for (const j of scripts) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, j)], { stdio: 'pipe' });
  } catch (e) {
    fail(`${j}：语法错误\n${String(e.stderr || e.message).trim()}`);
  }
}

/* ---------- 10. 收录状态自洽 ---------- */
const robots = fs.existsSync(path.join(root, 'robots.txt'))
  ? fs.readFileSync(path.join(root, 'robots.txt'), 'utf8') : '';
const blockedInHtml = pages.every((p) => src[p] && /name="robots"[^>]*noindex/.test(src[p]));
const blockedInRobots = /^\s*Disallow:\s*\/\s*$/m.test(robots);
if (blockedInHtml !== blockedInRobots) {
  fail('收录设置不一致：HTML 的 noindex 与 robots.txt 的 Disallow 必须同时开或同时关');
}

/* ---------- 输出 ---------- */
const say = (label, list, mark) => {
  if (!list.length) return;
  console.log(`\n${mark} ${label}（${list.length}）`);
  list.forEach((m) => console.log('   • ' + m));
};

say('警告', warnings, '⚠');
say('错误', errors, '✗');

if (!errors.length) {
  const status = blockedInHtml ? '暂不收录（noindex 生效中）' : '允许搜索引擎收录';
  console.log(`\n✓ 站点自检通过 — ${pages.length} 个页面，${status}`);
  if (warnings.length) console.log('  （有警告，但不阻断部署）');
}

process.exit(errors.length ? 1 : 0);
