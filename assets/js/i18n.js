/* ==========================================================================
   AcadVance — 双语引擎
   --------------------------------------------------------------------------
   用法：中文写在 HTML 里（默认可见、对 SEO 友好、无 JS 也完整），
   英文以属性形式挂在同一元素上。

     <h2 data-en="A Research Portfolio That Speaks for Itself">让履历自己说话</h2>

   属性同理（placeholder / aria-label / title / alt / content）：

     <input placeholder="您的姓名" data-en-placeholder="Your name">

   大段结构差异过大时，用两块并列，由 CSS 控制显隐：

     <div data-lang="zh">…中文版…</div>
     <div data-lang="en">…English…</div>
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'acadvance.lang';
  var LANGS = { zh: 'zh-CN', en: 'en' };
  var root = document.documentElement;

  /* 首次切换前，把中文原文缓存进 data-zh，之后可无损来回切 */
  function cacheZh() {
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML.trim();
    });
    ['placeholder', 'aria-label', 'title', 'alt', 'content'].forEach(function (attr) {
      var key = 'data-en-' + attr;
      document.querySelectorAll('[' + key + ']').forEach(function (el) {
        var store = 'data-zh-' + attr;
        if (!el.hasAttribute(store)) el.setAttribute(store, el.getAttribute(attr) || '');
      });
    });
  }

  function apply(lang) {
    var en = lang === 'en';

    document.querySelectorAll('[data-en]').forEach(function (el) {
      var next = en ? el.dataset.en : el.dataset.zh;
      if (next !== undefined && el.innerHTML.trim() !== next) el.innerHTML = next;
    });

    ['placeholder', 'aria-label', 'title', 'alt', 'content'].forEach(function (attr) {
      document.querySelectorAll('[data-en-' + attr + ']').forEach(function (el) {
        var next = en ? el.getAttribute('data-en-' + attr) : el.getAttribute('data-zh-' + attr);
        if (next !== null) el.setAttribute(attr, next);
      });
    });

    root.setAttribute('lang', en ? LANGS.en : LANGS.zh);

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var on = btn.dataset.langBtn === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    try { localStorage.setItem(KEY, lang); } catch (e) { /* 隐私模式：忽略 */ }

    document.dispatchEvent(new CustomEvent('acadvance:langchange', { detail: { lang: lang } }));
  }

  function init() {
    cacheZh();

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* noop */ }

    // URL 参数优先：?lang=en 便于对外分享英文版
    var q = new URLSearchParams(location.search).get('lang');
    var initial = (q === 'en' || q === 'zh') ? q
                : (saved === 'en' || saved === 'zh') ? saved
                : 'zh';

    if (initial !== 'zh') apply(initial);
    else apply('zh');

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () { apply(btn.dataset.langBtn); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
