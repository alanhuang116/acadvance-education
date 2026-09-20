# AcadVance Education — 官网

高端教育咨询品牌站。纯静态 HTML / CSS / JS，**零依赖、零构建**，双击 `index.html` 即可预览，可直接部署到任意静态托管。

**业务定位：只做学术履历提升（科研实习 / 公益实习 / 论文指导 / 长线培养 / 履历规划），不代办升学申请。** 全站文案、服务卡、边界声明、FAQ 都已按这个口径统一。

---

## 目录结构

```
.
├── index.html            首页
├── services.html         服务体系（五条业务线 + 三种委托形态 + 边界声明）
├── cases.html            成功案例（25 张可展开案例卡 + 109 条项目档案 + 118 条去向 + 3 篇深度复盘）
├── about.html            关于我们 / 工作原则 / 导师阵容 / 联系预约表单
├── assets/
│   ├── css/base.css      设计令牌、reset、排版、按钮、卡片
│   ├── css/site.css      导航、Hero、徽记墙、案例、表单、页脚
│   ├── js/i18n.js        中英双语引擎
│   ├── js/site.js        导航、滚动动效、计数、FAQ、筛选、表单
│   └── img/logos/        22 个院校徽记（**占位图形**，见第二节）
├── content/              数据文件（机构 / 导师 / 课题 / 去向 / 问答）
└── tools/
    ├── build.js          渲染器：content/ → 四个页面
    ├── check-site.js     自检
    ├── make-crests.js    徽记生成脚本
    └── serve.js          本地预览服务器（node tools/serve.js → :4321）
```

---

## 一、预约邮箱：显示地址 ≠ 收件地址

页面上显示的是品牌邮箱，链接实际指向真实收件箱：

| | 值 | 位置 |
|---|---|---|
| **显示** | `admissions@acadvanceeducation.com` | 链接文字、表单提示 |
| **实际收件** | `alanhuang116@gmail.com` | `href="mailto:…"`、表单 `data-mailto` |

访客在 [about.html](about.html) 填完表单点提交，浏览器会打开他的邮件客户端，正文已按「姓名 / 电话 / 邮箱 / 学段 / 需求 / 学生兴趣」排好版，收件人是 Gmail，他只需点发送。

**两点要注意：**

1. 邮件客户端打开后，访客会在收件人栏看到真实的 Gmail 地址；页面源码里也能搜到。纯静态站没法彻底隐藏。
2. 如果访客直接手打显示地址发信，那封信会退回——`admissions@acadvanceeducation.com` 目前并不存在。

**两个问题都靠同一件事解决：去域名注册商后台开一条邮件转发规则**，`admissions@acadvanceeducation.com → alanhuang116@gmail.com`（Cloudflare、阿里云、GoDaddy 都免费提供）。开通后，把 [about.html](about.html) 表单上的 `data-mailto` 也改成品牌邮箱，Gmail 地址就彻底不出现在站上了。

日后接后端（Formspree / 自建 API），给表单加 `data-endpoint="https://你的接口"` 即可优先走接口，`mailto` 自动降级为备用。

---

## 二、内容是数据驱动的：改 content/，跑 build

大体量内容不再手写在 HTML 里，而是放在 `content/` 下的数据文件，由 `tools/build.js` 渲染进页面：

| 文件 | 内容 | 条数 | 渲染到 |
|---|---|---|---|
| `content/institutions.js` | 机构总表（slug / 中英文名 / 地区 / 城市 / 徽记字母） | 59 | 徽记墙、去向墙、导师任职、「工作发生的地方」 |
| `content/mentors.js` | 导师（姓氏 / 机构 / 领域 / 带教习惯 / 课题类型 / 硬规矩 / 名额） | 26 | 关于页导师阵容，首页导师任教徽记 |
| `content/records.js` | 科研项目档案（课题 / 机构 / 方向 / 周期 / 方式 / 产出） | 109 | 案例页项目档案，首页学科矩阵计数 |
| `content/destinations.js` | 学员去向（机构 / 项目 / 学段 / 年份 / 备注） | 118 | 案例页录取记录，首页精选 24 + 大字带 + 去向徽记 |
| `content/faq.js` | 首页 11 条 + 服务页 6 条问答（加长版） | 17 | 两页 FAQ |
| `content/cases.js` | 成功案例（去向 / 背景 / 引言 / 三项数据 / 五段可展开档案） | 25 | 案例页案例卡与顶部数据条，关于页 CTA 计数 |

改完数据：

```bash
node tools/make-crests.js   # 加了新机构才需要：生成徽记
node tools/build.js         # 渲染进页面，自动算所有筛选计数和首页数字
node tools/check-site.js    # 自检
git add -A && git commit -m "…" && git push
```

页面里由 `<!-- @build:xxx -->` … `<!-- @/build:xxx -->` 圈出的区域会被重建覆盖，标记之外的手写内容不受影响。

### 属实 vs 示例

**属实**：前 5 位导师的姓氏与任职机构（黄 Emory / 杨 Florida / 赵 George Mason / 李 PolyU / 李 NUS）、去向前 6 条（Princeton ×2、Harvard Med 硕士、Berkeley、UW、Buffalo 全奖博士）、办公地点、联系邮箱。

**示例（上线前替换）**：其余 21 位导师、其余 112 条去向、全部 109 条课题、案例页 19 张示例案例卡（前 6 张对应真实去向，但叙事为示例）与 3 篇深度复盘、首页 6 条评价、服务页一周实况、电话 `+1 (404) 000-0000`、页脚三个法务链接。

> **`赵教授 · George Mason University`** —— 你写的是「Georgia Mason」，美国没有这所学校，我按弗吉尼亚州的 **George Mason University** 填了。若指 Georgia State 或 Georgia Tech，把 `content/mentors.js` 里 `inst: 'george-mason'` 改成 `'georgia-state'` 或 `'georgia-tech'` 即可（两所都已在机构表里）。

---

## 三、院校徽记：法务须知（重要）

`assets/img/logos/` 下的徽记 **全部是原创占位图形**，不是任何学校的真实校徽。

真实校徽均为注册商标，未经授权在商业网站上使用存在侵权风险；**「合作院校」这类表述若无正式协议支撑，还可能构成虚假宣传**。因此本站：

- 徽记墙标题为「**导师任教机构 · 学员录取去向**」，不写「合作院校」；
- 首页只展示 10 所（5 所导师任教机构 + 5 所学员去向），服务页只展示 5 所导师任教机构——都是站得住脚的表述；
- 每页页脚都有免责声明，明确 AcadVance 与所列院校无隶属、赞助、背书或代理关系。

**拿到正式授权后**，把授权素材按同名文件覆盖即可，无需改动任何 HTML。当前在用的 10 个：

```
emory.svg  florida.svg  george-mason.svg  polyu.svg  nus.svg
princeton.svg  harvard.svg  berkeley.svg  washington.svg  buffalo.svg
```

另有 12 个备用（yale / mit / stanford / columbia / cornell / johns-hopkins / usc / hku / cuhk / hkust / cityu / ntu），随时可加回。要重新生成或调整占位风格：`node tools/make-crests.js`

---

## 四、中英双语怎么维护

中文直接写在 HTML 里（默认可见、SEO 友好、禁用 JS 也完整），英文以属性挂在同一元素上：

```html
<h2 data-en="A research portfolio that speaks for itself">让履历自己说话</h2>
<input placeholder="您的姓名" data-en-placeholder="Your name">
```

支持的属性：`data-en-placeholder`、`data-en-aria-label`、`data-en-title`、`data-en-alt`、`data-en-content`。

`data-en` 的值里可以写 HTML（内部双引号用 `&quot;` 转义），所以英文版也能保留金色斜体强调：

```html
data-en="Five disciplines, <span class=&quot;accent-italic&quot;>one trajectory</span>."
```

中英结构差异太大时，用两块并列，由 CSS 控制显隐：

```html
<div data-lang="zh">…中文版…</div>
<div data-lang="en">…English…</div>
```

语言选择记在 `localStorage`；`?lang=en` 参数可直接分享英文版链接。

---

## 五、部署

无需构建，把整个目录传上去即可。

```bash
npx vercel --prod                        # Vercel
npx netlify deploy --prod --dir .        # Netlify
# 阿里云 OSS / 腾讯云 COS：开启静态网站托管，默认首页设为 index.html
```

本地预览：双击 `index.html`，或起服务器（`node tools/serve.js` → http://localhost:4321）。

**中国大陆访问注意**：页面通过 Google Fonts 加载 Cormorant Garamond / Inter / 思源字体。两个选择：

1. 把 4 个 HTML 里的 `fonts.googleapis.com` 链接换成国内 CDN 镜像；
2. 直接删掉那两行 `<link>` —— `base.css` 的 `--font-display` / `--font-body` 都配了完整降级栈（Georgia / 宋体 / PingFang SC / 微软雅黑），删掉后排版依然成立，只是英文标题质感会弱一些。

---

## 六、设计系统速查

改配色只需动 `base.css` 顶部的 `:root` 令牌：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--ink-950` … `--ink-600` | `#05090F` → `#22374F` | 深色区块（Hero / 页脚 / CTA） |
| `--paper` / `--paper-2` | `#FBF9F4` / `#F5F0E6` | 浅色区块 |
| `--gold-100` … `--gold-700` | `#F6EEDA` → `#8A6B36` | 香槟金强调色 |
| `--grad-gold` | 四段式渐变 | 主按钮、数字、品牌标 |
| `--section-y` | `clamp(84px, 9.5vw, 152px)` | 区块垂直留白 |
| `--font-display` | Cormorant Garamond + 思源宋体 | 所有标题 |
| `--font-body` | Inter + PingFang SC | 正文 |

常用类：`.display-1`~`.display-4` 标题级别 · `.eyebrow` 小标签 · `.lede` 引言 · `.accent-italic` 金色斜体强调 · `.card` `.card--hover` `.card--crown` 卡片 · `.pill` 徽章 · `.on-dark` 深色区块 · `.grid--3-2` 五项内容的 3+2 布局 · `.stats--3` 三栏数据条 · `[data-reveal]` 滚动进场（自动阶梯延迟）· `[data-count="50"]` 数字滚动。

无障碍与降级均已处理：`prefers-reduced-motion` 下关闭全部动效；禁用 JS 时页面为完整中文静态站。
