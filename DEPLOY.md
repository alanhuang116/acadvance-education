# 部署与域名接入

## 当前状态

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/alanhuang116/acadvance-education （公开） |
| 正式域名 | acadvances.com（GoDaddy，待 DNS 指向后绑定） |
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

## 一、域名：acadvances.com（GoDaddy）

已于 2026-09 在 GoDaddy 注册，含 Microsoft 365 Email Essentials 一年。域名服务器为 `ns39/ns40.domaincontrol.com`。

站内所有品牌邮箱已改为 `admissions@acadvances.com`；表单实际收件箱仍是 `alanhuang116@gmail.com`，等 M365 邮箱开通后可切过去（见第四节）。

---

## 二、在 GoDaddy 改 DNS（你来操作，约 3 分钟）

登录 GoDaddy → **My Products** → 找到 `acadvances.com` → 右侧 **DNS** → **Manage DNS**。

### 1. 删掉两条停放记录

| Type | Name | 当前值 | 操作 |
|---|---|---|---|
| A | `@` | `13.248.243.5` 之类的 Parked 地址 | **删除** |
| CNAME | `www` | `acadvances.com` 或 Parked | **删除** |

> GoDaddy 有时把停放显示为 "Forwarding"，那就到 **Forwarding** 区块把域名转发也一并关掉，否则会覆盖 A 记录。

### 2. 新增五条

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 1 Hour |
| A | `@` | `185.199.109.153` | 1 Hour |
| A | `@` | `185.199.110.153` | 1 Hour |
| A | `@` | `185.199.111.153` | 1 Hour |
| CNAME | `www` | `alanhuang116.github.io` | 1 Hour |

> GoDaddy 的 CNAME 值末尾会自动补点，填 `alanhuang116.github.io` 即可，**不要**加 `/acadvance-education`。

### 3. 绝对不要动的记录

Microsoft 365 邮箱会自己加这些，删掉邮箱就废了：

- **MX** → `…mail.protection.outlook.com`
- **CNAME** `autodiscover` → `autodiscover.outlook.com`
- **TXT** `@` → `v=spf1 include:spf.protection.outlook.com -all`
- **TXT/CNAME** 以 `_dmarc` / `selector1._domainkey` / `selector2._domainkey` 开头的

改 A 和 CNAME(www) 不影响邮件收发，这两类记录互不干扰。

---

## 三、我来绑定（你改完 DNS 说一声）

```bash
node tools/bind-domain.js acadvances.com --wait
```

脚本会自己等 DNS 生效，然后：核对 A 记录 → 写 CNAME 文件 → 更新 sitemap / robots / CI 监测地址 → 调 GitHub API 设 custom domain → 等 Let's Encrypt 证书签发后开启强制 HTTPS → 实测三个地址。

**顺序不能反**：必须先改 DNS 再绑定。反过来 github.io 会跳转到一个还没解析到 GitHub 的域名，网站看起来像挂了。

绑定完成后 `https://alanhuang116.github.io/acadvance-education/` 会自动跳到 `https://acadvances.com/`。

---

## 四、Microsoft 365 邮箱

购买时附带的 Email Essentials 需要单独走一次设置：GoDaddy → **My Products** → **Email & Office** → **Set up**，建一个邮箱，建议就用 `admissions@acadvances.com`（网站上显示的就是这个）。

设置过程中 GoDaddy 会自动往 DNS 里写 MX / SPF / autodiscover 等记录，不用手动加。

**邮箱能收信之后**，把 `content/site.js` 里这一行

```js
email: 'alanhuang116@gmail.com',
```

改成

```js
email: 'admissions@acadvances.com',
```

然后 `node tools/build.js && node tools/check-site.js` 再 push。这样个人 Gmail 就彻底不出现在网站源码里了，预约信直接进品牌邮箱。

> 自检脚本会核对表单的 `data-mailto` 与 `content/site.js` 一致，改漏了会报错拦下。

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
