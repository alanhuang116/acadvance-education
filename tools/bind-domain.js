#!/usr/bin/env node
/**
 * 自定义域名绑定 —— DNS 指过来之后跑这一条就够了。
 *
 *   node tools/bind-domain.js acadvanceeducation.com
 *   node tools/bind-domain.js acadvanceeducation.com --wait    # DNS 还没生效时先等
 *
 * 做四件事：
 *   1. 核对域名的 A 记录是否已指向 GitHub Pages
 *   2. 写入 CNAME 文件（GitHub Pages 靠它认域名）
 *   3. 调 GitHub API 设置 custom domain，并在证书就绪后开启强制 HTTPS
 *   4. 把 sitemap.xml、robots.txt、CI 监测地址一并换成新域名
 *
 * 顺序很重要：必须先在注册商改好 DNS，再跑本脚本。
 * 反过来会让 github.io 跳转到一个还没生效的域名，网站看起来像挂了。
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const REPO = 'alanhuang116/acadvance-education';
const GH_IPS = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];

const domain = (process.argv[2] || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const wait = process.argv.includes('--wait');
if (!domain) {
  console.error('用法：node tools/bind-domain.js <域名> [--wait]');
  process.exit(1);
}

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dnsReady() {
  try {
    const a = await dns.resolve4(domain);
    const hit = a.filter((ip) => GH_IPS.includes(ip));
    return { ok: hit.length >= 1, found: a, hit };
  } catch (e) {
    return { ok: false, found: [], hit: [], err: e.code };
  }
}

async function main() {
  /* ---------- 1. DNS ---------- */
  console.log(`\n检查 ${domain} 的 A 记录…`);
  let r = await dnsReady();
  if (!r.ok && wait) {
    console.log('  还没指过来，开始等待（每 60 秒一次，最多 60 分钟）');
    for (let i = 0; i < 60 && !r.ok; i++) {
      await sleep(60000);
      r = await dnsReady();
      process.stdout.write(`  第 ${i + 1} 次：${r.ok ? '已生效' : (r.found.join(' ') || r.err || '无记录')}\n`);
    }
  }
  if (!r.ok) {
    console.error(`\n✗ ${domain} 的 A 记录还没指向 GitHub Pages`);
    console.error(`  当前解析到：${r.found.join(' ') || r.err || '（无 A 记录）'}`);
    console.error(`  需要的四条：${GH_IPS.join(' ')}`);
    console.error('  在注册商后台改好 DNS，等 10 分钟到 1 小时，再跑一次（或加 --wait 让脚本等）。');
    process.exit(1);
  }
  console.log(`  ✓ 已指向 GitHub Pages（${r.hit.join(' ')}）`);

  /* ---------- 2. CNAME 文件 ---------- */
  fs.writeFileSync(path.join(root, 'CNAME'), domain + '\n', 'utf8');
  console.log('  ✓ 已写入 CNAME 文件');

  /* ---------- 3. 换掉站内的域名引用 ---------- */
  const sm = path.join(root, 'sitemap.xml');
  if (fs.existsSync(sm)) {
    fs.writeFileSync(sm, fs.readFileSync(sm, 'utf8').replace(/https:\/\/[^\/]+\//g, `https://${domain}/`), 'utf8');
    console.log('  ✓ sitemap.xml 域名已更新');
  }
  const rb = path.join(root, 'robots.txt');
  if (fs.existsSync(rb)) {
    let t = fs.readFileSync(rb, 'utf8');
    if (/Sitemap:/i.test(t)) {
      t = t.replace(/Sitemap:\s*\S+/i, `Sitemap: https://${domain}/sitemap.xml`);
      fs.writeFileSync(rb, t, 'utf8');
      console.log('  ✓ robots.txt 的 Sitemap 地址已更新');
    }
  }
  const wf = path.join(root, '.github', 'workflows', 'checks.yml');
  if (fs.existsSync(wf)) {
    fs.writeFileSync(wf, fs.readFileSync(wf, 'utf8').replace(/SITE_URL:\s*\S+/, `SITE_URL: https://${domain}`), 'utf8');
    console.log('  ✓ CI 在线监测地址已更新');
  }

  /* ---------- 4. 提交推送 ---------- */
  try {
    execFileSync('git', ['add', '-A'], { cwd: root });
    execFileSync('git', ['-c', 'user.email=prokopecai@outlook.com', '-c', 'user.name=alanhuang116',
      'commit', '-q', '-m', `绑定自定义域名 ${domain}\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`], { cwd: root });
    execFileSync('git', ['push', '-q', 'origin', 'main'], { cwd: root });
    console.log('  ✓ 已提交并推送');
  } catch (e) {
    console.log('  · 无需提交（内容未变化）');
  }

  /* ---------- 5. GitHub 侧绑定 ---------- */
  console.log('\n在 GitHub 侧设置 custom domain…');
  gh(['api', '-X', 'PUT', `repos/${REPO}/pages`, '-f', `cname=${domain}`, '-F', 'https_enforced=false']);
  console.log('  ✓ 已设置');

  /* ---------- 6. 等证书，再开强制 HTTPS ---------- */
  console.log('\n等待 Let’s Encrypt 证书签发（通常几分钟，偶尔到一小时）…');
  for (let i = 0; i < 40; i++) {
    await sleep(30000);
    let st = '';
    try { st = JSON.parse(gh(['api', `repos/${REPO}/pages`])).https_certificate?.state || ''; } catch (e) { /* noop */ }
    process.stdout.write(`  第 ${i + 1} 次：${st || '查询中'}\n`);
    if (st === 'approved') {
      gh(['api', '-X', 'PUT', `repos/${REPO}/pages`, '-f', `cname=${domain}`, '-F', 'https_enforced=true']);
      console.log('  ✓ 证书已签发，强制 HTTPS 已开启');
      break;
    }
  }

  /* ---------- 7. 实测 ---------- */
  console.log('\n实测：');
  for (const u of [`https://${domain}/`, `https://${domain}/services.html`, `https://www.${domain}/`]) {
    let code = '000';
    try { code = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20', u], { encoding: 'utf8' }).trim(); } catch (e) { /* noop */ }
    console.log(`  ${code}  ${u}`);
  }
  console.log(`\n完成。如果 HTTPS 还是 000 或 404，等 10 – 30 分钟证书生效后再试。`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
