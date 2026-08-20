# 部署与域名接入

## 当前状态

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/alanhuang116/acadvance-education （公开） |
| 临时网址 | https://alanhuang116.github.io/acadvance-education/ |
| 托管 | GitHub Pages（`main` 分支根目录，免费，自带 HTTPS） |
| 搜索引擎 | **暂不收录**（各页 `<meta name="robots" content="noindex">` + `robots.txt` 全站 Disallow） |

### 更新网站

改完文件后：

```bash
git add -A
git commit -m "改了什么"
git push
```

推送后约 1 分钟自动重新部署，不需要任何额外操作。

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
`admissions` → `mengjin0808@gmail.com`

**GoDaddy**：没有免费转发，用 Cloudflare Email Routing 代替——把域名 NS 改到 Cloudflare（免费），在 Email → Email Routing 里加同样的转发规则。

配好之后，把 [about.html](about.html) 表单上的这一行

```html
data-mailto="mengjin0808@gmail.com"
```

改成

```html
data-mailto="admissions@acadvanceeducation.com"
```

这样 Gmail 地址就彻底不出现在网站源码里了，而信照样收得到。

---

## 五、上线前检查清单

- [ ] 换掉 6 个案例的学生背景、周期、产出数字，以及两篇深度复盘
- [ ] 换掉 5 位导师的真实研究方向与简介（现为按各校强势学科推测）
- [ ] 确认 `赵教授` 是 **George Mason University** 还是 Georgia State / Georgia Tech
- [ ] 换掉首页 3 条家庭评价
- [ ] 填真实电话（现为 `+1 (404) 000-0000`）
- [ ] 页脚三个法务链接补上真实页面（隐私政策 / 服务条款 / 学术诚信政策）
- [ ] 顶部公告条按当季更新
- [ ] 配好邮件转发，并把表单 `data-mailto` 改成品牌邮箱
- [ ] 拿到院校 logo 授权后覆盖 `assets/img/logos/` 同名文件
- [ ] 删除 noindex、恢复 robots.txt、更新 sitemap 域名
