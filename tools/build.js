#!/usr/bin/env node
/**
 * 内容渲染器 —— 把 content/*.js 里的数据铺进四个页面。
 *
 *   node tools/build.js
 *
 * 页面里用一对标记圈出由数据生成的区域：
 *   <!-- @build:records -->  …  <!-- @/build:records -->
 * 标记之间的内容每次重建都会被覆盖；标记之外的手写内容不受影响。
 * 首次运行时会把旧的手写区块自动换成标记。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const INST = require('../content/institutions.js');
const REGIONS = INST.regions;
const MENTORS = require('../content/mentors.js');
const GROUPS = MENTORS.groups;
const RECORDS = require('../content/records.js');
const DEST = require('../content/destinations.js');
const FAQ = require('../content/faq.js');
const CASES = require('../content/cases.js');
const crypto = require('crypto');

const byslug = Object.fromEntries(INST.map((i) => [i.slug, i]));
const inst = (slug) => {
  const i = byslug[slug];
  if (!i) throw new Error('未知机构 slug：' + slug);
  return i;
};
const short = (i) => i.short || i.en;
const pad3 = (n) => String(n).padStart(3, '0');
const crestImg = (i, size) =>
  `<img src="assets/img/logos/${i.slug}.svg" alt="${i.en}" width="${size}" height="${size}" loading="lazy">`;

/* ======================================================================
   片段渲染
   ====================================================================== */

/* ---------- 徽记（跑马灯 / 网格通用） ---------- */
function crest(i, href, sub) {
  return `      <a class="crest" href="${href}">${crestImg(i, 92)}<span class="crest__name">${short(i)}</span><span class="crest__region">${sub}</span></a>`;
}

/* ---------- 首页徽记墙：两行 ---------- */
function crestWall() {
  const mentorInsts = [];
  MENTORS.forEach((m) => { if (!mentorInsts.includes(m.inst)) mentorInsts.push(m.inst); });

  const destCount = {};
  DEST.forEach((d) => { destCount[d[0]] = (destCount[d[0]] || 0) + 1; });
  const destInsts = Object.keys(destCount)
    .sort((a, b) => destCount[b] - destCount[a] || inst(a).en.localeCompare(inst(b).en))
    .slice(0, 30);

  const row = (slugs, href) => slugs.map((s) => {
    const i = inst(s);
    return crest(i, href, i.city);
  }).join('\n');

  return `<!-- ============================ 徽记墙 ============================ -->
<section class="crest-wall">

  <p class="crest-wall__head" data-en="Where our mentors teach · ${mentorInsts.length} institutions">导师任教机构 · ${mentorInsts.length} 所</p>
  <div class="marquee">
    <div class="marquee__track">
${row(mentorInsts, 'about.html#mentors')}
    </div>
  </div>

  <p class="crest-wall__head crest-wall__head--mid" data-en="Where our students went · ${Object.keys(destCount).length} institutions">学员录取去向 · ${Object.keys(destCount).length} 所</p>
  <div class="marquee marquee--reverse">
    <div class="marquee__track">
${row(destInsts, 'cases.html#destinations')}
    </div>
  </div>

</section>
`;
}

/* ---------- 去向单元格 ---------- */
function offerCell(d) {
  const [slug, pZh, pEn, level, year, note] = d;
  const i = inst(slug);
  const n = DEST.notes[note];
  return `      <div class="offer-cell" data-tags="${level} ${i.region} y${year}">
        <span class="offer-cell__school">${i.en}</span>
        <span class="offer-cell__prog" data-en="${pEn}">${pZh}</span>
        <span class="offer-cell__meta"><span>${year}</span><b data-en="${n.en}">${n.zh}</b></span>
      </div>`;
}

/* ---------- 首页录取墙（精选 24） ---------- */
function offerWallHome() {
  const picks = DEST.slice(0, 24);
  return `<!-- ============================ Offer 墙 ============================ -->
<section class="section on-dark" id="offers">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Admissions Record">录取记录</span>
      <h2 class="display-2" data-reveal data-en="Twenty-four of <span class=&quot;accent-italic&quot;>${DEST.length} recorded outcomes</span>.">
        ${DEST.length} 条去向记录中的<span class="accent-italic">二十四条</span>
      </h2>
      <p class="lede" data-reveal data-en="The full record, filterable by level and region, is on the outcomes page.">
        完整记录可按学段与地区筛选，见案例页。
      </p>
    </div>

    <div class="offer-wall" data-reveal>
${picks.map(offerCell).join('\n')}
    </div>

    <div class="cluster" style="margin-top:32px;" data-reveal>
      <a class="link-arrow" href="cases.html#destinations">
        <span data-en="All ${DEST.length} outcomes">查看全部 ${DEST.length} 条去向</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 8h12M9.5 3.5 14 8l-4.5 4.5"/></svg>
      </a>
    </div>

    <p class="muted" style="margin-top:24px;font-size:.75rem;"
       data-en="Institution names refer to programmes our students were admitted to. AcadVance is an independent education consultancy and is not affiliated with, endorsed by, or an agent of any institution listed.">
      上述院校名称指学员获得录取的项目。AcadVance 为独立教育咨询机构，与所列任何院校均无隶属、代理或背书关系。
    </p>
  </div>

  <div class="name-band" style="margin-top:clamp(44px,5vw,72px);" aria-hidden="true">
    <div class="name-band__track">
${nameBand()}
    </div>
  </div>
</section>
`;
}

/* ---------- 校名大字带：去向院校按录取数排序 ---------- */
function nameBand() {
  const count = {};
  DEST.forEach((d) => { count[d[0]] = (count[d[0]] || 0) + 1; });
  const slugs = Object.keys(count).sort((a, b) => count[b] - count[a] || inst(a).en.localeCompare(inst(b).en));
  // 复制一份让轨道足够长
  return [...slugs, ...slugs].map((s) => `      <span class="name-band__item">${short(inst(s))}</span>`).join('\n');
}

/* ---------- 案例页：完整去向墙 + 筛选 ---------- */
function destinationsFull() {
  const counts = { all: DEST.length };
  DEST.forEach((d) => {
    const i = inst(d[0]);
    counts[d[3]] = (counts[d[3]] || 0) + 1;
    counts[i.region] = (counts[i.region] || 0) + 1;
    counts['y' + d[4]] = (counts['y' + d[4]] || 0) + 1;
  });

  const filters = [
    ['all', '全部', 'All'],
    ['ug', '本科', 'Undergraduate'], ['ms', '硕士', 'Master’s'], ['phd', '博士', 'Doctoral'],
    ['us', '美国', 'United States'], ['uk', '英国', 'United Kingdom'], ['hk', '中国香港', 'Hong Kong'], ['sg', '新加坡', 'Singapore'],
    ['ca', '加拿大', 'Canada'], ['eu', '欧洲大陆', 'Europe'], ['au', '澳大利亚', 'Australia'],
    ['y2026', '2026', '2026'], ['y2025', '2025', '2025'], ['y2024', '2024', '2024'],
  ].filter(([k]) => counts[k]);

  const btns = filters.map(([k, zh, en], idx) =>
    `      <button class="filter${idx === 0 ? ' is-active' : ''}" type="button" data-filter="${k}" aria-pressed="${idx === 0}">
        <span data-en="${en}">${zh}</span><span class="filter__count">${counts[k]}</span>
      </button>`).join('\n');

  const schools = new Set(DEST.map((d) => d[0])).size;

  return `<!-- ============================ 录取记录 ============================ -->
<section class="section on-dark" id="destinations">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Admissions Record">录取记录</span>
      <h2 class="display-2" data-reveal data-en="${DEST.length} outcomes, <span class=&quot;accent-italic&quot;>${schools} institutions</span>, three cycles.">
        ${DEST.length} 条去向，<span class="accent-italic">${schools} 所院校</span>，三个申请季
      </h2>
      <p class="lede" data-reveal data-en="Every entry is one student. Where a programme is not named, the family asked that only the institution and level be shown.">
        每一条就是一位学生。未写明项目名称的，是应家庭要求只显示院校与学段。
      </p>
    </div>

    <div class="filters filters--dark" data-filter-bar="destinations" role="group" aria-label="按学段或地区筛选" data-en-aria-label="Filter by level or region">
${btns}
    </div>

    <div data-filter-grid="destinations">
      <div class="offer-wall" data-reveal>
${DEST.map(offerCell).join('\n')}
      </div>
      <p class="records__empty" data-filter-empty hidden data-en="No outcomes match this filter.">当前筛选下没有记录。</p>
    </div>

    <p class="muted" style="margin-top:24px;font-size:.75rem;"
       data-en="Institution names refer to programmes our students were admitted to. AcadVance is an independent education consultancy and is not affiliated with, endorsed by, or an agent of any institution listed. Past outcomes do not predict future results.">
      上述院校名称指学员获得录取的项目。AcadVance 为独立教育咨询机构，与所列任何院校均无隶属、代理或背书关系。既往结果不预示未来表现。
    </p>
  </div>
</section>
`;
}

/* ---------- 案例页：项目档案 ---------- */
function recordsSection() {
  const MODE = { r: ['可远程', 'remote'], o: ['在地', 'on-site'], h: ['混合', 'hybrid'] };
  const counts = { all: RECORDS.length };
  RECORDS.forEach((r) => { counts[r[0]] = (counts[r[0]] || 0) + 1; });

  const btns = [['all', '全部', 'All'], ...GROUPS.map((g) => [g.key, g.zh, g.en])].map(([k, zh, en], idx) =>
    `      <button class="filter${idx === 0 ? ' is-active' : ''}" type="button" data-filter="${k}" aria-pressed="${idx === 0}">
        <span data-en="${en}">${zh}</span><span class="filter__count">${counts[k]}</span>
      </button>`).join('\n');

  const rows = RECORDS.map((r, idx) => {
    const [group, slug, tZh, tEn, fZh, fEn, weeks, mode, oZh, oEn] = r;
    const i = inst(slug);
    const [mZh, mEn] = MODE[mode];
    return `        <div class="record" data-tags="${group}">
          <span class="record__id">AV-26-${pad3(idx + 1)}</span>
          <h3 class="record__title" data-en="${tEn}">${tZh}</h3>
          <div class="record__host">${short(i)}<small data-en="${fEn}">${fZh}</small></div>
          <span class="record__dur" data-en="${weeks} wks · ${mEn}">${weeks} 周 · ${mZh}</span>
          <div class="record__out" data-en="${oEn}">${oZh}</div>
        </div>`;
  }).join('\n');

  const hosts = new Set(RECORDS.map((r) => r[1])).size;

  return `<!-- ============================ 项目档案 ============================ -->
<section class="section" id="records">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Placement Log">项目档案</span>
      <h2 class="display-2" data-reveal data-en="${RECORDS.length} placements across <span class=&quot;accent-italic&quot;>${hosts} institutions</span>, as logged.">
        ${RECORDS.length} 个课题，<span class="accent-italic">${hosts} 所机构</span>，档案原样
      </h2>
      <p class="lede" data-reveal
         data-en="Admissions outcomes are the tail end of a long process. This is the middle of it — the actual projects students worked on, what they produced, and how long it took. No student is named; the work is.">
        录取结果是一段长过程的末端。这里是中间那一段：学生真正做的课题、产出了什么、花了多久。学生不具名，工作具名。
      </p>
    </div>

    <div class="filters" data-filter-bar="records" role="group" aria-label="按方向筛选项目" data-en-aria-label="Filter placements by field">
${btns}
    </div>

    <div data-filter-grid="records">
      <div class="records__head" aria-hidden="true">
        <span data-en="Ref">编号</span>
        <span data-en="Project">课题</span>
        <span data-en="Host &amp; field">机构与方向</span>
        <span data-en="Duration">周期</span>
        <span data-en="Student output">学生产出</span>
      </div>
      <div class="records">
${rows}
      </div>
      <p class="records__empty" data-filter-empty hidden data-en="No placements in this field are open right now. Tell us the direction and we will ask the groups directly.">
        该方向当前没有开放席位。告诉我们方向，我们直接去问课题组。
      </p>
    </div>

    <p class="muted" style="margin-top:22px;font-size:.75rem;"
       data-en="Entries are drawn from placements running in the 2025–26 cycle. Project titles are generalised at the request of the host groups; exact titles and the supervising mentor’s contact are disclosed to a family before a placement begins.">
      条目取自 2025–26 周期在执行的课题。应课题组要求，标题作了泛化处理；确切标题与带教导师联系方式，在项目启动前向家庭披露。
    </p>
  </div>
</section>
`;
}

/* ---------- 关于页：导师深度卡 ---------- */
function mentorsSection() {
  const counts = { all: MENTORS.length };
  MENTORS.forEach((m) => { counts[m.group] = (counts[m.group] || 0) + 1; });

  const btns = [['all', '全部', 'All'], ...GROUPS.map((g) => [g.key, g.zh, g.en])].map(([k, zh, en], idx) =>
    `      <button class="filter${idx === 0 ? ' is-active' : ''}" type="button" data-filter="${k}" aria-pressed="${idx === 0}">
        <span data-en="${en}">${zh}</span><span class="filter__count">${counts[k]}</span>
      </button>`).join('\n');

  const cards = MENTORS.map((m) => {
    const i = inst(m.inst);
    const region = REGIONS[i.region];
    return `      <article class="mentor-full" data-tags="${m.group}" data-reveal>
        <div class="mentor-full__aside">
          <div class="mentor__portrait">
            <span class="mentor__initials">${m.zh.charAt(0)}</span>
            ${crestImg(i, 34).replace('<img ', '<img class="mentor__crest" ')}
          </div>
          <h3 class="mentor-full__name" data-en="${m.en}">${m.zh}</h3>
          <p class="mentor-full__inst" data-en="${i.en}">${short(i)}</p>
          <p class="mentor-full__field" data-en="${m.fieldEn}<br>${i.city} · ${region.en}">${m.fieldZh}<br>${i.city} · ${region.zh}</p>
        </div>

        <div>
          <div class="mentor-full__body">
            <p data-en="${m.styleEn}">${m.styleZh}</p>
            <p data-en="${m.workEn}">${m.workZh}</p>
            <p data-en="${m.ruleEn}"><strong data-en="Hard rule —">硬规矩——</strong>${m.ruleZh}</p>
          </div>
          <dl class="mentor-spec">
            <div><dt data-en="Places per year">每年名额</dt><dd data-en="<b>${m.spec.places}</b>"><b>${m.spec.places}</b> 名</dd></div>
            <div><dt data-en="Stage">接收学段</dt><dd data-en="${m.spec.stageEn}">${m.spec.stageZh}</dd></div>
            <div><dt data-en="Mode">工作方式</dt><dd data-en="${m.spec.modeEn}">${m.spec.modeZh}</dd></div>
            <div><dt data-en="Minimum">最短周期</dt><dd data-en="${m.spec.minEn}">${m.spec.minZh}</dd></div>
          </dl>
        </div>
      </article>`;
  }).join('\n\n');

  const insts = new Set(MENTORS.map((m) => m.inst)).size;

  return `<!-- ============================ 导师阵容 ============================ -->
<section class="section on-paper-2" id="mentors">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Faculty">导师阵容</span>
      <h2 class="display-2" data-reveal data-en="${MENTORS.length} faculty, <span class=&quot;accent-italic&quot;>${insts} institutions</span>, six fields.">
        ${MENTORS.length} 位在任教授，<span class="accent-italic">${insts} 所院校</span>，六大领域
      </h2>
      <p class="lede" data-reveal
         data-en="Every mentor below currently holds a faculty position and supervises the student directly. Each entry records how they actually teach, what their group takes students onto, and the one rule they will not bend. Full contact details are disclosed to the family before a placement begins.">
        以下每位导师都持有在任教职，并亲自督导学员。每条记录写的是他们实际怎么带人、课题组让学生做什么、以及那条不肯让步的规矩。完整联系方式在项目启动前向家庭披露。
      </p>
    </div>

    <div class="filters" data-filter-bar="mentors" role="group" aria-label="按领域筛选导师" data-en-aria-label="Filter mentors by field">
${btns}
    </div>

    <div data-filter-grid="mentors">
${cards}
      <p class="records__empty" data-filter-empty hidden data-en="No mentors in this field.">该领域暂无导师。</p>
    </div>

    <p class="muted" style="margin-top:28px;font-size:.75rem;"
       data-en="Mentor surnames and institutions are shown; full names are disclosed to families before a placement. Descriptions summarise the kind of work each group takes students onto.">
      此处显示导师姓氏与任职机构；全名在项目启动前向家庭披露。描述概括了各组接收学员的工作类型。
    </p>
  </div>
</section>
`;
}

/* ---------- 案例页：案例卡（可展开五段档案）+ 顶部数据条 ---------- */
function casesSection() {
  const counts = { all: CASES.length };
  CASES.forEach((c) => {
    counts[c.level] = (counts[c.level] || 0) + 1;
    counts[c.group] = (counts[c.group] || 0) + 1;
  });
  const filterDefs = [
    ['all', '全部', 'All'],
    ['ug', '本科', 'Undergraduate'], ['ms', '硕士', 'Master’s'], ['phd', '博士', 'Doctoral'],
    ...GROUPS.map((g) => [g.key, g.zh, g.en]),
  ].filter(([k]) => counts[k]);
  const btns = filterDefs.map(([k, zh, en], idx) =>
    `      <button class="filter${idx === 0 ? ' is-active' : ''}" type="button" data-filter="${k}" aria-pressed="${idx === 0}">
        <span data-en="${en}">${zh}</span><span class="filter__count">${counts[k]}</span>
      </button>`).join('\n');

  const PH = [
    ['startZh', 'startEn', '起点', 'Starting point'],
    ['diagZh', 'diagEn', '诊断', 'Diagnosis'],
    ['changeZh', 'changeEn', '调整', 'What we changed'],
    ['wrongZh', 'wrongEn', '受挫', 'What went wrong'],
    ['outcomeZh', 'outcomeEn', '结果', 'Outcome'],
  ];

  const cards = CASES.map((c, idx) => {
    const i = inst(c.inst);
    const lv = CASES.levels[c.level];
    const stats = c.stats.map(([n, zh, en]) =>
      `            <span class="case__stat"><b>${n}</b><span data-en="${en}">${zh}</span></span>`).join('\n');
    const phases = PH.map(([kz, ke, lz, le]) =>
      `              <div class="narrative__phase">
                <dt data-en="${le}">${lz}</dt>
                <dd data-en="${c.phases[ke]}">${c.phases[kz]}</dd>
              </div>`).join('\n');
    const n = pad3(idx + 1);
    return `      <article class="card card--hover case" data-tags="${c.level} ${c.group}" data-reveal>
        <div class="case__top">
          <span class="pill pill--gold" data-en="${lv.en}">${lv.zh}</span>
          ${crestImg(i, 46).replace('<img ', '<img class="case__crest" ')}
        </div>
        <div class="case__body">
          <p class="case__from" data-en="${c.fromEn}">${c.fromZh}</p>
          <h3 class="case__result">${i.en}</h3>
          <p class="case__prog" data-en="${c.progEn}">${c.progZh}</p>
          <p class="case__quote" data-en="${c.quoteEn}">${c.quoteZh}</p>
          <div class="case__foot">
${stats}
          </div>
          <button class="case__toggle" type="button" aria-expanded="false" aria-controls="case-${n}">
            <span class="case__toggle-open" data-en="Open the file">展开档案</span>
            <span class="case__toggle-close" data-en="Close">收起</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>
          </button>
          <div class="case__archive" id="case-${n}">
            <dl>
${phases}
            </dl>
          </div>
        </div>
      </article>`;
  }).join('\n\n');

  const schools = new Set(CASES.map((c) => c.inst)).size;
  const cn = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'][CASES.length] || CASES.length;

  return `<!-- ============================ 筛选 + 案例网格 ============================ -->
<section class="section" id="cases">
  <div class="container">

    <div class="stats stats--4 overlap-up" data-reveal>
      <div class="stat">
        <div class="stat__num"><span data-count="${CASES.length}">${CASES.length}</span></div>
        <div class="stat__label" data-en="Case files, each expandable">份案例档案，每份可展开</div>
      </div>
      <div class="stat">
        <div class="stat__num"><span data-count="${DEST.length}">${DEST.length}</span></div>
        <div class="stat__label" data-en="Recorded outcomes">条去向记录</div>
      </div>
      <div class="stat">
        <div class="stat__num"><span data-count="${RECORDS.length}">${RECORDS.length}</span></div>
        <div class="stat__label" data-en="Placements logged">个课题档案</div>
      </div>
      <div class="stat">
        <div class="stat__num"><span data-count="${schools}">${schools}</span></div>
        <div class="stat__label" data-en="Institutions in the case files">所案例院校</div>
      </div>
    </div>

    <div class="section-head" style="margin-top:clamp(56px,6vw,88px);">
      <span class="eyebrow" data-reveal data-en="Case Files">案例档案</span>
      <h2 class="display-2" data-reveal data-en="${CASES.length} students. <span class=&quot;accent-italic&quot;>Every file opens</span>.">
        ${cn}位学生，<span class="accent-italic">每份档案都能展开</span>
      </h2>
      <p class="lede" data-reveal
         data-en="Click any card to open its five-part record: where the student started, what we diagnosed, what we changed, what went wrong, and what the committee finally saw. Names withheld at each family’s request.">
        点开任意一张卡，看五段记录：起点、诊断、调整、受挫、结果。应家庭要求隐去姓名。
      </p>
    </div>

    <div class="filters" data-filter-bar="cases" role="group" aria-label="案例筛选" data-en-aria-label="Filter case studies">
${btns}
    </div>

    <div class="grid grid--3" data-filter-grid="cases">
${cards}

      <p class="case-grid__empty" data-filter-empty hidden data-en="No case files match this filter yet.">当前筛选条件下暂无案例。</p>
    </div>
  </div>
</section>
`;
}

/* ---------- 服务页：工作发生的地方（全部机构，按地区，紧凑横排） ---------- */
function placesSection() {
  const mentorsAt = {};
  MENTORS.forEach((m) => { (mentorsAt[m.inst] = mentorsAt[m.inst] || []).push(m); });
  const recordsAt = {};
  RECORDS.forEach((r) => { recordsAt[r[1]] = (recordsAt[r[1]] || 0) + 1; });
  const destAt = {};
  DEST.forEach((d) => { destAt[d[0]] = (destAt[d[0]] || 0) + 1; });

  const order = ['us', 'ca', 'uk', 'eu', 'hk', 'sg', 'au', 'jp', 'kr'];
  const blocks = order.map((rg) => {
    const list = INST.filter((i) => i.region === rg);
    if (!list.length) return '';
    const region = REGIONS[rg];
    const cells = list.map((i) => {
      const ms = mentorsAt[i.slug] || [];
      const rc = recordsAt[i.slug] || 0;
      const dc = destAt[i.slug] || 0;
      // 三种关系用三个小标记，横向并排
      const marks = [];
      if (ms.length) marks.push(`<span class="place__mark place__mark--m" title="导师任教" data-en-title="Mentor on faculty">${ms.length} <i data-en="mentor${ms.length > 1 ? 's' : ''}">导师</i></span>`);
      if (rc) marks.push(`<span class="place__mark place__mark--r" title="在库课题" data-en-title="Live placements">${rc} <i data-en="placement${rc > 1 ? 's' : ''}">课题</i></span>`);
      if (dc) marks.push(`<span class="place__mark place__mark--d" title="学员录取" data-en-title="Students admitted">${dc} <i data-en="admitted">录取</i></span>`);
      const field = ms.length ? `<span class="place__field" data-en="${ms.map((m) => m.fieldEn).join(' / ')}">${ms.map((m) => m.fieldZh).join(' / ')}</span>` : '';
      return `        <div class="place">
          ${crestImg(i, 44)}
          <div class="place__body">
            <h3 class="place__name">${short(i)}</h3>
            <p class="place__zh">${i.zh} · ${i.city}</p>
            ${field}
          </div>
          <div class="place__marks">${marks.join('')}</div>
        </div>`;
    }).join('\n');
    return `      <div class="place-region" data-reveal>
        <h3 class="place-region__title"><span data-en="${region.en}">${region.zh}</span><span class="place-region__n">${list.length}</span></h3>
        <div class="place-grid">
${cells}
        </div>
      </div>`;
  }).join('\n\n');

  return `<!-- ============================ 项目所在机构 ============================ -->
<section class="section" id="places">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Where the Work Happens">工作发生的地方</span>
      <h2 class="display-2" data-reveal data-en="${INST.length} institutions in <span class=&quot;accent-italic&quot;>${order.filter((rg) => INST.some((i) => i.region === rg)).length} regions</span>.">
        ${INST.length} 所机构，<span class="accent-italic">${order.filter((rg) => INST.some((i) => i.region === rg)).length} 个地区</span>
      </h2>
      <p class="lede" data-reveal
         data-en="Three kinds of relationship appear below, and we keep them distinct: where our mentors hold their appointments, where placements are currently running, and where our students have been admitted. An institution may be one, two or all three.">
        下面出现三种关系，我们把它们分开标注：导师任教之处、课题正在进行之处、学员获得录取之处。一所机构可能只占其一，也可能三者兼有。
      </p>
    </div>

${blocks}

    <p class="muted" style="margin-top:28px;font-size:.75rem;"
       data-en="Placements are arranged with individual laboratories and research groups within these institutions; availability changes each term. AcadVance is an independent consultancy with no affiliation to, sponsorship by or agency for any institution listed."
       >科研席位与这些机构内部的具体实验室、课题组逐一对接，可用席位每学期变动。AcadVance 为独立咨询机构，与所列任何院校均无隶属、赞助或代理关系。</p>
  </div>
</section>
`;
}

/* ---------- 问答 ---------- */
function faqItems(list) {
  return list.map((f) => `      <div class="faq__item">
        <button class="faq__q" type="button" aria-expanded="false">
          <span data-en="${f.qEn}">${f.qZh}</span>
          <span class="faq__sign" aria-hidden="true"></span>
        </button>
        <div class="faq__a"><div><p data-en="${f.aEn}">
          ${f.aZh}
        </p></div></div>
      </div>`).join('\n\n');
}

function faqHome() {
  const n = FAQ.home.length;
  const cn = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'][n] || n;
  return `<!-- ============================ FAQ ============================ -->
<section class="section">
  <div class="container container--narrow">
    <div class="section-head section-head--center">
      <span class="eyebrow eyebrow--center" data-reveal data-en="Questions">常见问题</span>
      <h2 class="display-2" data-reveal data-en="${n} questions families <span class=&quot;accent-italic&quot;>actually ask</span>.">家长<span class="accent-italic">真正会问</span>的${cn}个问题</h2>
      <p class="lede" data-reveal data-en="Written the way they are asked to us — in full, with the worry behind the question left in.">
        按家长真正问出口的样子写的——完整的句子，连问题背后的担心一起留着。
      </p>
    </div>

    <div class="faq" data-reveal>
${faqItems(FAQ.home)}
    </div>
  </div>
</section>
`;
}

function faqServices() {
  return `<!-- ============================ 服务答疑 ============================ -->
<section class="section on-paper-2">
  <div class="container container--narrow">
    <div class="section-head section-head--center">
      <span class="eyebrow eyebrow--center" data-reveal data-en="Service Questions">服务答疑</span>
      <h2 class="display-2" data-reveal data-en="Six questions <span class=&quot;accent-italic&quot;>specific to these services</span>.">
        关于这些服务的<span class="accent-italic">六个具体问题</span>
      </h2>
      <p class="lede" data-reveal data-en="General questions about how we work are answered on the home page. These six are about the services themselves.">
        关于我们如何工作的通用问题在首页解答。这六个，问的是服务本身。
      </p>
    </div>

    <div class="faq" data-reveal>
${faqItems(FAQ.services)}
    </div>
  </div>
</section>
`;
}

/* ---------- 首页学科矩阵（由课题数据推算） ---------- */
const MATRIX = [
  ['免疫学与感染',      'Immunology &amp; Infection',          ['免疫学'],                                      ['细胞因子信号通路', '疫苗免疫原性', '宿主—病原互作', '黏膜免疫'],           ['Cytokine signalling', 'Vaccine immunogenicity', 'Host–pathogen interaction', 'Mucosal immunity']],
  ['神经科学与认知',    'Neuroscience &amp; Cognition',        ['神经科学', '认知心理学'],                      ['神经环路成像', '行为范式设计', '注意与记忆', '预注册实验'],                 ['Circuit imaging', 'Behavioural paradigms', 'Attention &amp; memory', 'Pre-registered experiments']],
  ['公共卫生与流行病学','Public Health &amp; Epidemiology',    ['公共卫生', '临床流行病学', '流行病建模'],      ['队列数据清洗', '筛查项目评估', '风险评分验证', '传染病建模'],               ['Cohort data cleaning', 'Screening evaluation', 'Risk-score validation', 'Disease modelling']],
  ['计算生物学与影像',  'Computational Biology &amp; Imaging', ['计算生物学', '生物医学影像'],                  ['单细胞测序分析', '基因调控网络', '影像分割', '流程可复现'],                 ['Single-cell analysis', 'Gene regulatory networks', 'Image segmentation', 'Reproducible pipelines']],
  ['材料与凝聚态',      'Materials &amp; Condensed Matter',    ['材料科学', '凝聚态物理', '微流控'],            ['薄膜制备与表征', '电池电极材料', '低温输运测量', '显微图像定量'],           ['Thin-film synthesis', 'Battery electrodes', 'Cryogenic transport', 'Micrograph quantification']],
  ['生物医学与机械工程','Biomedical &amp; Mechanical Engineering', ['生物医学工程', '机械工程', '能源系统', '农业工程', '土木工程'], ['可穿戴传感', '器件原型迭代', '热管理测试', '结构疲劳数据'], ['Wearable sensing', 'Device prototyping', 'Thermal testing', 'Structural fatigue data']],
  ['机器人与电子',      'Robotics &amp; Electronics',          ['机器人', '控制', '光子学', '电子工程'],        ['步态控制', '传感器融合', '光子器件仿真', '光纤传感标定'],                   ['Gait control', 'Sensor fusion', 'Photonic simulation', 'Fibre-sensor calibration']],
  ['统计与因果推断',    'Statistics &amp; Causal Inference',   ['因果推断', '统计学', '应用数学'],              ['准实验设计', '多重插补', '合成对照', '数值求解器'],                         ['Quasi-experimental design', 'Multiple imputation', 'Synthetic control', 'Numerical solvers']],
  ['人工智能与数据科学','AI &amp; Data Science',               ['人工智能', '数据科学', '计算', '人机交互'],    ['小样本学习', '模型可解释性', '公平性审计', '可访问性设计'],                 ['Few-shot learning', 'Interpretability', 'Fairness audits', 'Accessible design']],
  ['环境、气候与海洋',  'Environment, Climate &amp; Ocean',    ['环境工程', '环境科学', '气候物理', '海洋科学', '生态学', '气候科学', '地球科学', '水利工程'], ['水质长期监测', '海洋热含量', '遥感识别', '碳通量数据'], ['Water-quality monitoring', 'Ocean heat content', 'Remote sensing', 'Carbon-flux data']],
  ['农业与食品系统',    'Agriculture &amp; Food Systems',      ['农业科学', '食品系统'],                        ['作物表型', '无人机影像', '土壤含水量', '供应链损耗'],                       ['Crop phenotyping', 'Drone imagery', 'Soil moisture', 'Supply-chain loss']],
  ['化学与催化',        'Chemistry &amp; Catalysis',           ['化学', '催化', '化学工程'],                    ['有机合成路线', '催化剂筛选', '原位光谱', '反应动力学'],                     ['Synthetic routes', 'Catalyst screening', 'In-situ spectroscopy', 'Reaction kinetics']],
  ['公共政策与经济学',  'Public Policy &amp; Economics',       ['公共政策', '卫生经济', '劳动经济学', '行为经济学'], ['政策简报撰写', '断点回归评估', '面板数据方法', '成本效果分析'],         ['Policy briefs', 'Regression discontinuity', 'Panel-data methods', 'Cost-effectiveness']],
  ['城市、社会与教育',  'Cities, Society &amp; Education',     ['城市规划', '建成环境', '社会学', '学习科学', '教育数据', '教育学', '传播学'], ['步行可达性测绘', '深度访谈', '课堂话语编码', '学习行为数据'], ['Walkability mapping', 'In-depth interviews', 'Classroom discourse coding', 'Learning behaviour data']],
  ['历史、政治与国际关系','History, Politics &amp; IR',        ['历史学', '国际关系', '政治学'],                ['档案数字化', '决议文本分析', '联盟形成案例', '一手文献追溯'],               ['Archive digitisation', 'Resolution text analysis', 'Coalition case studies', 'Primary-source tracing']],
];

function matrixSection() {
  const fieldCount = {};
  RECORDS.forEach((r) => { fieldCount[r[4]] = (fieldCount[r[4]] || 0) + 1; });

  let mapped = 0;
  const cells = MATRIX.map(([zh, en, keys, subs, subsEn]) => {
    const n = keys.reduce((a, k) => a + (fieldCount[k] || 0), 0);
    mapped += n;
    const lis = subs.map((s, i) => `          <li data-en="${subsEn[i]}">${s}</li>`).join('\n');
    return `      <div class="matrix__cell">
        <div class="matrix__field">
          <h3 class="matrix__name" data-en="${en}">${zh}</h3>
          <span class="matrix__n" data-en="${n} live">${n} 个在库</span>
        </div>
        <ul class="matrix__subs">
${lis}
        </ul>
      </div>`;
  }).join('\n\n');

  const unmapped = Object.keys(fieldCount).filter((k) => !MATRIX.some((m) => m[2].includes(k)));
  if (unmapped.length) console.warn('  ⚠ 未归入矩阵的方向：' + unmapped.join('、'));

  const cn = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六'][MATRIX.length] || MATRIX.length;

  return `<!-- ============================ 领域矩阵 ============================ -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" data-reveal data-en="Fields">学科覆盖</span>
      <h2 class="display-2" data-reveal data-en="${MATRIX.length} fields. <span class=&quot;accent-italic&quot;>${mapped} live projects</span>.">
        ${cn}个学科方向，<span class="accent-italic">${mapped} 个在库课题</span>
      </h2>
      <p class="lede" data-reveal
         data-en="These are not brochure categories. Each number below is the count of projects currently open to placement in that field — it goes down when a seat is taken and up when a group opens new work.">
        这不是宣传册上的分类。下面每个数字，都是该方向当前真正可接收学员的课题数量——有人进去就减一，课题组开新工作就加一。
      </p>
    </div>

    <div class="matrix" data-reveal>
${cells}
    </div>

    <p class="muted" style="margin-top:20px;font-size:.75rem;"
       data-en="Availability changes every term. A field showing a low count is not closed — tell us what interests the student and we will ask the groups directly.">
      可用席位每学期变动。数字小不代表关闭——告诉我们学生的兴趣方向，我们会直接去问课题组。
    </p>
  </div>
</section>
`;
}

/* ======================================================================
   写入页面
   ====================================================================== */
const PLAN = {
  'index.html': [
    { key: 'crestwall', legacyStart: '<!-- ============================ 徽记墙 ==', legacyEnd: '<!-- ============================ 数据 ==', render: crestWall },
    { key: 'matrix',    legacyStart: '<!-- ============================ 领域矩阵 ==', legacyEnd: '<!-- ============================ 方法论流程 ==', render: matrixSection },
    { key: 'offers',    legacyStart: '<!-- ============================ Offer 墙 ==', legacyEnd: '<!-- ============================ 导师 ==', render: offerWallHome },
    { key: 'faq',       legacyStart: '<!-- ============================ FAQ ==', legacyEnd: '<!-- ============================ CTA ==', render: faqHome },
  ],
  'cases.html': [
    { key: 'cases',        legacyStart: '<!-- ============================ 筛选 + 案例网格 ==', legacyEnd: '<!-- @build:records -->', render: casesSection },
    { key: 'records',      legacyStart: '<!-- ============================ 项目档案 ==', legacyEnd: '<!-- ============================ 深度案例 ==', render: recordsSection },
    { key: 'destinations', legacyStart: '<!-- ============================ 录取记录 ==', legacyEnd: '<!-- ============================ CTA ==', render: destinationsFull },
  ],
  'about.html': [
    { key: 'mentors', legacyStart: '<!-- ============================ 导师阵容 ==', legacyEnd: '<!-- ============================ 导师遴选标准 ==', render: mentorsSection },
  ],
  'services.html': [
    { key: 'places', legacyStart: '<!-- ============================ 项目所在机构 ==', legacyEnd: '<!-- ============================ 服务答疑 ==', render: placesSection },
    { key: 'faq',    legacyStart: '<!-- ============================ 服务答疑 ==', legacyEnd: '<!-- ============================ CTA ==', render: faqServices },
  ],
};

const amp = (h) => h.replace(/&(?!(?:amp|quot|lt|gt|nbsp|ldquo|rdquo|#d+|#x[0-9a-fA-F]+);)/g, "&amp;");

function replaceRegion(src, key, html, legacyStart, legacyEnd) {
  html = amp(html);
  const open = `<!-- @build:${key} -->`;
  const close = `<!-- @/build:${key} -->`;
  const block = `${open}\n${html}${close}\n\n`;

  let a = src.indexOf(open);
  if (a !== -1) {
    const b = src.indexOf(close, a);
    if (b === -1) throw new Error(`标记未闭合：${key}`);
    return src.slice(0, a) + block + src.slice(b + close.length).replace(/^\n+/, '');
  }
  // 首次：把旧区块换成标记
  a = src.indexOf(legacyStart);
  const b = src.indexOf(legacyEnd);
  if (a === -1 || b === -1 || b < a) throw new Error(`找不到旧区块：${key}`);
  return src.slice(0, a) + block + src.slice(b);
}

/* 数字：首页信任条与各页数据条，按标签统一从数据推算 */
function patchNumbers(file, src) {
  const recordsN = Math.floor(RECORDS.length / 10) * 10;
  const instN = Math.floor(INST.length / 10) * 10;
  const mentorsN = MENTORS.length;

  // 标签 → [数值, 是否带 +]
  const map = {
    'Live research &amp; internship projects': [recordsN, true],
    'Active research placements':             [recordsN, true],
    'Host universities &amp; institutes':     [instN, true],
    'Faculty &amp; research mentors':         [mentorsN, false],
    'Mentors on faculty':                     [mentorsN, false],
  };

  // hero 信任条：<dt data-en="LABEL">…</dt><dd>N<sup>+</sup></dd>
  src = src.replace(/(<dt data-en="([^"]+)">[^<]*<\/dt>\s*<dd>)\d+(?:<sup>\+<\/sup>)?(<\/dd>)/g, (m, pre, label, post) => {
    const v = map[label];
    return v ? pre + v[0] + (v[1] ? '<sup>+</sup>' : '') + post : m;
  });

  // 数据条：<span data-count="N">N</span><sup>+</sup></div><div class="stat__label" data-en="LABEL"
  src = src.replace(/<span data-count="\d+">\d+<\/span>(?:<sup>\+<\/sup>)?(<\/div>\s*<div class="stat__label" data-en="([^"]+)")/g, (m, post, label) => {
    const v = map[label];
    return v ? '<span data-count="' + v[0] + '">' + v[0] + '</span>' + (v[1] ? '<sup>+</sup>' : '') + post : m;
  });
  return src;
}

/* 静态资源版本号：内容哈希，改了文件链接就变，绕过 GitHub Pages 的 10 分钟缓存 */
const ASSETS = ['assets/css/base.css', 'assets/css/site.css', 'assets/js/i18n.js', 'assets/js/site.js'];
const ver = {};
ASSETS.forEach((a) => {
  ver[a] = crypto.createHash('md5').update(fs.readFileSync(path.join(root, a))).digest('hex').slice(0, 8);
});
function stampAssets(src) {
  ASSETS.forEach((a) => {
    src = src.replace(new RegExp('(["\'])' + a.replace(/[.\/]/g, '\\$&') + '(\\?v=[0-9a-f]+)?(["\'])', 'g'), `$1${a}?v=${ver[a]}$3`);
  });
  return src;
}

/* 零散的手写数字：成立年份、关于页 CTA 的档案数 */
function patchMisc(file, src) {
  if (file === 'about.html') {
    src = src
      .replace(/<div class="stat__num"><span>\d{4}<\/span><\/div>(\s*<div class="stat__label" data-en="Founded")/, `<div class="stat__num"><span>2024</span></div>$1`)
      .replace(/data-en="[^"]*verified files[^"]*"/, `data-en="${CASES.length} verified files — where each student started, what was changed, what failed along the way, and what the committee finally saw."`)
      .replace(/[一二三四五六七八九十]+份经核验的档案|\d+ 份经核验的档案/, `${CASES.length} 份经核验的档案`);
  }
  return src;
}

let total = 0;
for (const [file, jobs] of Object.entries(PLAN)) {
  const p = path.join(root, file);
  let src = fs.readFileSync(p, 'utf8');
  for (const j of jobs) {
    src = replaceRegion(src, j.key, j.render(), j.legacyStart, j.legacyEnd);
    total++;
  }
  src = patchNumbers(file, src);
  src = patchMisc(file, src);
  src = stampAssets(src);
  fs.writeFileSync(p, src, 'utf8');
  console.log(`  ${file.padEnd(14)} ${jobs.map((j) => j.key).join(' · ')}`);
}
console.log(`  资源版本  ${ASSETS.map((a) => path.basename(a) + '@' + ver[a]).join('  ')}`);

console.log(`\n✓ 渲染完成：${total} 个区域 · 机构 ${INST.length} · 导师 ${MENTORS.length} · 课题 ${RECORDS.length} · 去向 ${DEST.length}`);
