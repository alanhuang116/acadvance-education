/* ==========================================================================
   AcadVance — 站点交互
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 导航：滚动实底 ---------- */
  function nav() {
    var el = $('.nav');
    if (!el) return;
    var solid = false;
    function tick() {
      var want = window.scrollY > 24;
      if (want !== solid) { solid = want; el.classList.toggle('is-solid', want); }
    }
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }

  /* ---------- 移动端菜单 ---------- */
  function burger() {
    var btn = $('.nav__burger');
    var menu = $('.nav__menu');
    if (!btn || !menu) return;

    function toggle(open) {
      btn.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    }

    btn.addEventListener('click', function () { toggle(!btn.classList.contains('is-open')); });
    $$('.nav__link', menu).forEach(function (a) {
      a.addEventListener('click', function () { toggle(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.classList.contains('is-open')) toggle(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && btn.classList.contains('is-open')) toggle(false);
    });
  }

  /* ---------- 滚动进场 ---------- */
  function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      // 同一容器内的兄弟节点自动阶梯延迟
      if (!el.style.getPropertyValue('--reveal-delay')) {
        var sibs = el.parentElement ? $$('[data-reveal]', el.parentElement) : [];
        var idx = sibs.indexOf(el);
        if (idx > 0 && idx < 8) el.style.setProperty('--reveal-delay', (idx * 85) + 'ms');
      }
      io.observe(el);
    });
  }

  /* ---------- 数字计数 ---------- */
  function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var decimals = (el.dataset.count.split('.')[1] || '').length;
      if (reduced || isNaN(target)) { el.textContent = el.dataset.count; return; }

      var dur = 1500, t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 徽记跑马灯 ----------
     动画按轨道自身宽度平移 100%，因此轨道必须先铺满容器，
     否则条目少时会出现空档。先在轨道内补足，再整条复制一份。
  --------------------------------------------------------------- */
  function marquee() {
    $$('.marquee').forEach(function (m) {
      var track = $('.marquee__track', m);
      if (!track || track.dataset.cloned) return;

      var seed = Array.prototype.slice.call(track.children);
      if (!seed.length) return;

      var guard = 0;
      while (track.scrollWidth < m.offsetWidth && guard++ < 12) {
        seed.forEach(function (el) {
          var fill = el.cloneNode(true);
          fill.setAttribute('aria-hidden', 'true');
          fill.setAttribute('tabindex', '-1');
          track.appendChild(fill);
        });
      }

      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('a', clone).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      m.appendChild(clone);
      track.dataset.cloned = '1';
    });
  }

  /* ---------- FAQ 手风琴 ---------- */
  function faq() {
    $$('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var open = item.classList.contains('is-open');
        // 单开模式
        var group = btn.closest('.faq');
        if (group) {
          $$('.faq__item.is-open', group).forEach(function (o) {
            o.classList.remove('is-open');
            var q = $('.faq__q', o);
            if (q) q.setAttribute('aria-expanded', 'false');
          });
        }
        if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- 筛选器 ----------
     同页可多组：data-filter-bar="键" 与 data-filter-grid="键" 配对。
     组内每个可筛选元素带 data-tags="标签1 标签2"，空态元素带 data-filter-empty。
  --------------------------------------------------------------- */
  function filters() {
    $$('[data-filter-bar]').forEach(function (bar) {
      var key = bar.getAttribute('data-filter-bar') || '';
      var grid = $('[data-filter-grid="' + key + '"]');
      if (!grid) return;

      var items = $$('[data-tags]', grid);
      var empty = $('[data-filter-empty]', grid);

      function apply(want) {
        var shown = 0;
        items.forEach(function (el) {
          var tags = (el.dataset.tags || '').split(/\s+/);
          var ok = want === 'all' || tags.indexOf(want) !== -1;
          el.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      }

      $$('.filter', bar).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $$('.filter', bar).forEach(function (o) {
            o.classList.remove('is-active');
            o.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
          apply(btn.dataset.filter);
        });
      });
    });
  }

  /* ---------- 回到顶部 + 阅读进度 ---------- */
  function scrollUi() {
    var top = $('.to-top');
    var bar = $('.progress');
    if (!top && !bar) return;

    function tick() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.scrollY / h : 0;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (top) top.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.7);
    }
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);

    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------- 咨询表单 ----------
     默认走 data-mailto：把填写内容整理成邮件，打开访客的邮件客户端发往指定邮箱。
     若填了 data-endpoint，则优先 POST JSON 到该接口（Formspree / 自建 API 等）。
  --------------------------------------------------------------- */
  function form() {
    var f = $('[data-consult-form]');
    if (!f) return;
    var status = $('.form__status', f);
    var ENDPOINT = f.dataset.endpoint || '';
    var MAILTO = f.dataset.mailto || '';               // 真实收件箱
    var SHOWN = f.dataset.mailtoDisplay || MAILTO;     // 对外展示地址

    // 下拉框取可读文本而非 value，邮件里才看得懂
    function readable(name) {
      var el = f.elements[name];
      if (!el) return '';
      if (el.tagName === 'SELECT') return el.options[el.selectedIndex].text.trim();
      return (el.value || '').trim();
    }

    function composeMail(zh) {
      var L = zh
        ? { subj: '学术评估预约', name: '姓名', phone: '电话', email: '邮箱',
            stage: '当前学段', goal: '主要需求', msg: '学生兴趣与背景', from: '来源：官网预约表单' }
        : { subj: 'Assessment Request', name: 'Name', phone: 'Phone', email: 'Email',
            stage: 'Stage', goal: 'Interest', msg: 'About the student', from: 'Source: website booking form' };

      var body = [
        L.name + '：' + readable('name'),
        L.phone + '：' + readable('phone'),
        L.email + '：' + readable('email'),
        L.stage + '：' + readable('stage'),
        L.goal + '：' + readable('goal'),
        '',
        L.msg + '：',
        readable('message') || '—',
        '',
        '— ' + L.from
      ].join('\r\n');

      return 'mailto:' + MAILTO
        + '?subject=' + encodeURIComponent('[' + L.subj + '] ' + readable('name'))
        + '&body=' + encodeURIComponent(body);
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;

      var btn = $('button[type=submit]', f);
      var zh = document.documentElement.getAttribute('lang') !== 'en';

      function say(msg) {
        if (!status) { window.alert(msg); return; }
        status.innerHTML = msg;
        status.hidden = false;
      }

      if (!ENDPOINT) {
        if (MAILTO) {
          window.location.href = composeMail(zh);
          say(zh
            ? '正在为您打开邮件客户端，请点击「发送」完成预约。若未自动打开，请直接邮件至 <a href="mailto:' + MAILTO + '">' + SHOWN + '</a>。'
            : 'Opening your mail client — please press Send to complete the request. If nothing opens, email <a href="mailto:' + MAILTO + '">' + SHOWN + '</a> directly.');
        } else {
          say(zh ? '已收到您的预约信息。顾问将在 1 个工作日内与您联系。'
                 : 'Received. An advisor will contact you within one business day.');
          f.reset();
        }
        return;
      }

      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = zh ? '提交中…' : 'Sending…'; }

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(f).entries()))
      })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          say(zh ? '预约已提交，顾问将在 1 个工作日内与您联系。' : 'Received. An advisor will contact you within one business day.');
          f.reset();
        })
        .catch(function () {
          var addr = MAILTO || 'mengjin0808@gmail.com';
          var shown = SHOWN || addr;
          say(zh ? '提交失败，请稍后重试，或直接邮件至 <a href="mailto:' + addr + '">' + shown + '</a>。'
                 : 'Submission failed. Please retry, or email <a href="mailto:' + addr + '">' + shown + '</a>.');
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  }

  /* ---------- 当前页导航高亮 ---------- */
  function activeNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    $$('.nav__link').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0];
      if (href && href === here) a.classList.add('is-active');
    });
  }

  function boot() {
    nav(); burger(); marquee(); reveal(); counters();
    faq(); filters(); scrollUi(); form(); activeNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
