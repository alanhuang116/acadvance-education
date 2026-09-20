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
          var addr = MAILTO || 'alanhuang116@gmail.com';
          var shown = SHOWN || addr;
          say(zh ? '提交失败，请稍后重试，或直接邮件至 <a href="mailto:' + addr + '">' + shown + '</a>。'
                 : 'Submission failed. Please retry, or email <a href="mailto:' + addr + '">' + shown + '</a>.');
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  }

  /* ---------- 卡片透视倾斜 ----------
     悬停卡片随鼠标位置微微倾斜，并带一道随之移动的高光。
     触屏与「减少动态」偏好下不启用。
  --------------------------------------------------------------- */
  function tilt() {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var cards = $('.card--hover');
    if (!cards.length) return;

    var MAX = 5; // 最大倾斜角（度）

    cards.forEach(function (el) {
      el.classList.add('tilt');
      var rect = null;

      el.addEventListener('mouseenter', function () {
        rect = el.getBoundingClientRect();
        el.classList.add('is-tilting');
      });

      el.addEventListener('mousemove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;   // 0 – 1
        var py = (e.clientY - rect.top) / rect.height;
        el.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.style.setProperty('--ty', '-5px');
      });

      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--ty', '0');
        rect = null;
      });
    });
  }

  /* ---------- 案例档案展开 ----------
     点「展开档案」在卡内展开五段记录；宽屏下展开的卡占满一行、左右分栏。
  --------------------------------------------------------------- */
  function caseArchive() {
    $('.case__toggle').forEach(function (btn) {
      var card = btn.closest('.case');
      if (!card) return;
      btn.addEventListener('click', function () {
        var open = !card.classList.contains('is-open');
        card.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        if (open) {
          // 展开后把卡片顶到视口内
          var top = card.getBoundingClientRect().top;
          if (top < 90) window.scrollBy({ top: top - 110, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    });
  }

  /* ---------- Hero 视差：背景层随滚动以不同速度移动 ---------- */
  function parallax() {
    if (reduced) return;
    var glow = $('.hero__glow');
    var crests = $('.hero__crests img');
    var aside = $('.hero__aside');
    if (!glow && !crests.length && !aside) return;

    var ticking = false;
    function frame() {
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) { ticking = false; return; }
      if (glow) glow.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
      crests.forEach(function (el, i) {
        el.style.setProperty('--py', (y * (0.08 + i * 0.05)).toFixed(1) + 'px');
      });
      if (aside) aside.style.transform = 'translate3d(0,' + (y * -0.06).toFixed(1) + 'px,0)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* ---------- 分段式筛选器：白色滑块跟着激活项走 ---------- */
  function segmented() {
    $('.filters').forEach(function (bar) {
      var thumb = document.createElement('span');
      thumb.className = 'filters__thumb';
      thumb.setAttribute('aria-hidden', 'true');
      bar.insertBefore(thumb, bar.firstChild);

      function move() {
        var active = $('.filter.is-active', bar);
        if (!active) return;
        var b = bar.getBoundingClientRect();
        var a = active.getBoundingClientRect();
        thumb.style.width = a.width + 'px';
        thumb.style.height = a.height + 'px';
        thumb.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px)';
        bar.classList.add('has-thumb');
      }
      // 先让初始定位不带动画
      thumb.style.transition = 'none';
      move();
      requestAnimationFrame(function () { thumb.style.transition = ''; });

      $('.filter', bar).forEach(function (btn) {
        btn.addEventListener('click', function () { requestAnimationFrame(move); });
      });
      window.addEventListener('resize', move);
      document.addEventListener('acadvance:langchange', function () { setTimeout(move, 30); });
    });
  }

  /* ---------- 方法论流程：滚动堆叠，被压住的卡片逐渐缩小变淡 ---------- */
  function stackFlow() {
    var steps = $('.flow__step');
    if (steps.length < 2 || reduced) return;
    var ticking = false;
    function frame() {
      steps.forEach(function (el, i) {
        var next = steps[i + 1];
        if (!next) { el.style.setProperty('--stack-scale', '1'); el.style.setProperty('--stack-opacity', '1'); return; }
        var r = el.getBoundingClientRect();
        var n = next.getBoundingClientRect();
        // 下一张顶部离本张顶部越近，本张缩得越多
        var p = Math.min(Math.max((r.top + r.height - n.top) / r.height, 0), 1);
        el.style.setProperty('--stack-scale', (1 - p * 0.06).toFixed(3));
        el.style.setProperty('--stack-opacity', (1 - p * 0.35).toFixed(3));
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
  }

  /* ---------- 磁吸按钮：主按钮微微朝指针偏移 ---------- */
  function magnetic() {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $('.btn--gold').forEach(function (btn) {
      var rect = null, STRENGTH = 0.22;
      btn.addEventListener('mouseenter', function () { rect = btn.getBoundingClientRect(); });
      btn.addEventListener('mousemove', function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) * STRENGTH;
        var dy = (e.clientY - (rect.top + rect.height / 2)) * STRENGTH;
        btn.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + (dy - 2).toFixed(1) + 'px) scale(1.03)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; rect = null; });
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
    faq(); filters(); scrollUi(); form(); activeNav(); tilt(); caseArchive(); parallax(); segmented(); stackFlow(); magnetic();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
