# 部署与域名接入

## 当前状态

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/alanhuang116/acadvance-education （公开） |
| 临时网址 | https://alanhuang116.github.io/acadvance-education/ |
| 托管 | GitHub Pages（`main` 分支根目录，免费，自带 HTTPS） |
| 搜索引擎 | **暂不收录**（各页 `<meta name="robots" content="noindex">` + `robots.txt` 全站 Disallow） |

### 这个链接会一直有效

GitHub Pages 不是需要保活的服务器进程，是 CDN 上的静态文件。**只要仓库还在、还是公开的、Pages 还开着，链接就永久可用**，不会过期、不会因为没人访问而休眠，也不花钱。

会让它挂掉的只有三件事：

1. 仓库被删除，或被改成 private（免费版 Pages 需要公开仓库）
2. Pages 在 Settings 里被手动关掉
3. GitHub 自身故障（罕见，见 https://www.githubstatus.com）

这三件事都不会自己发生。为防万一，已加自动监测（见下）。

### 更新网站

改完文件后：

```bash
node tools/check-site.js   # 先自检，有错会拦下来
git add -A
git commit -m "改了什么"
git push
```

推送后约 1 分钟自动重新部署，不需要任何额外操作。合作伙伴刷新页面就能看到新版本。

### 自动化闸门

仓库里配了 [`.github/workflows/checks.yml`](.github/workflows/checks.yml)，两条独立的链路：

| 触发 | 做什么 | 失败时 |
|---|---|---|
| 每次 `push` / PR | 跑 `tools/check-site.js` 十项自检 | Actions 标红，你会收到 GitHub 邮件 |
| 每 6 小时 + 手动 | 探测线上 4 个页面 + CSS/JS 是否返回 200 | **自动开一个带 `uptime` 标签的 issue**；恢复后自动评论并关闭 |

想立刻手动探一次：

```bash
gh workflow run checks.yml
gh run list --workflow=checks.yml --limit 1
```

`tools/check-site.js` 检查的十项：本地资源引用是否存在 · 跨页锚点 · 同页锚点 · 块级标签配平 · `<img>` 是否有 alt · 双语开关与 i18n.js 是否齐全 · 必备 meta · 真实邮箱有没有漏进可见文字 · 案例筛选器计数与卡片数是否一致 · JS 语法 · noindex 与 robots.txt 是否自洽。

> 绑定自定义域名后，记得把 `checks.yml` 里的 `SITE_URL` 改成新域名，否则监测的还是旧地址。

### 合作伙伴怎么提建议

链接直接发即可，不需要 GitHub 账号就能看。收集建议的两种方式：

- **他们有 GitHub**：让他们去 https://github.com/alanhuang116/acadvance-education/issues 开 issue，改动有迹可循
- **他们没有**：口头/微信收集后转给我，我改完 push，链接内容即时更新

每次改动都是一个 git commit，`git log --oneline` 能看全部历史，任何一版都能回退：

```bash
git log --oneline          # 看历史
git revert <commit-id>     # 撤掉某次改动（会生成一个新 commit，安全）
```

### 正式对外前，解除收录限制

1. 删掉四个 HTML 里那行 `<meta name="robots" content="noindex, nofollow">`
2. 把 `robots.txt` 换回：
   ```
   User-agent: *
   Allow: /

   Sitemap: https://你的域名/sitemap.xml
   ```
3. `sitemap.xml` 里的四条 `<loc>` 换成真实域名
4. `git push`

---

## 版本切换：v2 Cupertino ⇄ v1 Classic

现版本是 **v2「Cupertino」**：苹果式卡片化皮肤层，全部在 `assets/css/apple.css` 一个文件里，内容与数据管线与 v1 完全相同。

| 想要 | 做法 |
|---|---|
| 回到 v1 深墨蓝衬线版（保留所有新内容） | 把 `tools/build.js` 里 `ASSETS` 数组中的 `assets/css/apple.css` 删掉，四个 HTML 里那行 `<link … apple.css>` 也删掉，`node tools/build.js` 后 push |
| 回到打标签时的完整 v1 快照 | `git checkout v1-classic -- .` 然后 commit、push（会连内容一起回到当时状态） |
| 两版并存给伙伴对比 | 说一声，我可以把 v1 部署到 `/classic/` 子路径 |

---

## 一、买域名（GoDaddy / Namecheap）

推荐 **Namecheap**：`.com` 首年约 $10、续费约 $15，**自带免费邮件转发**——正好用来把 `admissions@acadvanceeducation.com` 转到你的 Gmail。GoDaddy 首年常有 $1 促销，但续费贵不少，且邮件转发要另外买。

买之前先查 `acadvanceeducation.com` 是否还在（网站文案里已按这个域名写）。若被占用，备选：`acadvance.education`、`acadvance-edu.com`、`acadvanceeducation.org`。

**结账时把所有加购项全部取消**——SSL 证书、网站建设、邮箱套餐、SEO 服务一个都不需要。唯一值得留的是 **Domain Privacy（WHOIS 隐私保护）**，Namecheap 免费送，GoDaddy 收费但建议加，否则你的姓名地址电话会公开可查。

---

## 二、把域名指向网站

买完后进域名管理后台的 **DNS / 域名解析**，删掉注册商默认塞的停放页记录（通常是一条指向 parkingpage 的 A 或 CNAME），然后加下面 5 条：

| 类型 | 主机记录 | 值 | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 自动 |
| A | `@` | `185.199.109.153` | 自动 |
| A | `@` | `185.199.110.153` | 自动 |
| A | `@` | `185.199.111.153` | 自动 |
| CNAME | `www` | `alanhuang116.github.io` | 自动 |

> 主机记录填 `@` 表示根域名。Namecheap 后台叫 **Advanced DNS**，GoDaddy 叫 **DNS 管理**。CNAME 的值末尾**不要**加 `/acadvance-education`，只填到 `.github.io` 为止。

---

## 三、在 GitHub 侧绑定域名

DNS 填完等 10 分钟到 1 小时生效，然后告诉我域名，我用一条命令绑定；或者你自己操作：

仓库 → **Settings** → **Pages** → **Custom domain** 填 `acadvanceeducation.com` → Save。
等它下方出现 ✅ DNS check successful，再勾选 **Enforce HTTPS**（证书签发需要几分钟到几小时，勾不上就等等再来）。

绑定后 `https://alanhuang116.github.io/acadvance-education/` 会自动跳转到新域名。

---

## 四、邮件转发（重要）

网站上显示的是 `admissions@acadvanceeducation.com`，但这个邮箱现在**并不存在**——访客照着手打发信会退回。买完域名务必配一条转发：

**Namecheap**：域名管理 → Domain 标签页 → 下方 **Redirect Email** → 加一条
`admissions` → `alanhuang116@gmail.com`

**GoDaddy**：没有免费转发，用 Cloudflare Email Routing 代替——把域名 NS 改到 Cloudflare（免费），在 Email → Email Routing 里加同样的转发规则。

配好之后，把 [about.html](about.html) 表单上的这一行

```html
data-mailto="alanhuang116@gmail.com"
```

改成

```html
data-mailto="admissions@acadvanceeducation.com"
```

这样 Gmail 地址就彻底不出现在网站源码里了，而信照样收得到。

---

## 五、上线前检查清单

- [ ] 换掉 25 张案例卡的学生背景、周期、产出数字与五段档案，以及 3 篇深度复盘
- [ ] 核对 26 位导师：前 5 位姓氏与机构属实但研究方向为推测，其余 21 位为示例
- [ ] 确认 `赵教授` 是 **George Mason University** 还是 Georgia State / Georgia Tech
- [ ] 换掉首页 6 条家庭评价
- [ ] 填真实电话（现为 `+1 (404) 000-0000`）
- [ ] 页脚三个法务链接补上真实页面（隐私政策 / 服务条款 / 学术诚信政策）
- [ ] 顶部公告条按当季更新
- [ ] 配好邮件转发，并把表单 `data-mailto` 改成品牌邮箱
- [ ] 拿到院校 logo 授权后覆盖 `assets/img/logos/` 同名文件
- [ ] 删除 noindex、恢复 robots.txt、更新 sitemap 域名
