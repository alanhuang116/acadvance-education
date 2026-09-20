/**
 * 自毁 Service Worker —— 用来顶掉 GoDaddy Website Builder 留下的那一个。
 *
 * 背景：域名曾短暂挂在 GoDaddy Website Builder 上，它在 acadvances.com 这个源
 * 注册了 /sw.js。Service Worker 绑定的是「源」而不是 IP，所以即使 DNS 已经
 * 指向 GitHub Pages，装过它的浏览器仍会从本地缓存里拿出旧的「Launching Soon」页面。
 *
 * 浏览器会在导航时重新拉取 /sw.js 检查更新。它拿到这一份（字节不同 → 判定为新版本）
 * 后会安装并激活，然后本文件做三件事：清空所有缓存、注销自己、刷新已打开的标签页。
 *
 * 等确认线上不再有人被旧缓存困住（几周后），可以把这个文件删掉。
 */

self.addEventListener('install', () => {
  // 不等旧 worker 退出，立刻进入 waiting → active
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. 清空该源下的全部 Cache Storage（GoDaddy 的页面壳就存在这里）
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* 某些隐私模式下不可用，忽略 */ }

    // 2. 注销自己
    try { await self.registration.unregister(); } catch (e) { /* noop */ }

    // 3. 让已经打开的标签页重新加载，直接拿到真正的站点
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { if ('navigate' in c) c.navigate(c.url); });
    } catch (e) { /* noop */ }
  })());
});

// 激活完成前如果还有请求经过，一律直连网络，不走任何缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
