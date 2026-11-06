/* TCS TwinX 3.0 UI: behaviour for the components. Plain JS, no build, no dependencies.
   Load once at the end of <body>: <script src="ui/twinx/ui/js/twinx.js"></script>
   Everything is opt-in through data attributes, so pages need no script of their own for:
     - the app shell menu bar   (#tx-sidebar, data-tx-nav-toggle, data-tx-nav-open, data-tx-nav-close)
     - the colour theme menu    (data-tx-theme-open)
     - tabs and segmented       (data-tx-tabs, data-tx-segmented)
     - dialogs                  (data-tx-open="dialog-id", data-tx-close)
   and it exposes window.TwinX: toast(), setTheme(), THEMES.
   Saved per browser in localStorage: "twinx-theme", "twinx-nav-pinned". */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY_THEME = 'twinx-theme', KEY_PIN = 'twinx-nav-pinned';
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ── themes: the five CXO palettes in tokens/tokens.css ─────────────────── */
  var THEMES = [
    { key: 'wallStreet', name: 'Wall Street Executive', desc: 'Cream, deep navy, champagne gold' },
    { key: 'onyx', name: 'Onyx Midnight', desc: 'Black onyx, warm champagne accents' },
    { key: 'porcelain', name: 'Porcelain', desc: 'Pure white minimalism, graphite & ochre' },
    { key: 'bordeaux', name: 'Bordeaux Estate', desc: 'Wine, parchment, antique brass' },
    { key: 'upsBrand', name: 'UPS Shield', desc: 'Pullman brown, gold, warm tan' }
  ];
  function setTheme(key) {
    if (!THEMES.some(function (t) { return t.key === key; })) return;
    root.setAttribute('data-cxo-theme', key);
    store(KEY_THEME, key);
    document.querySelectorAll('.tx-theme-menu__item').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.theme === key)); });
    document.dispatchEvent(new CustomEvent('twinx:theme', { detail: { theme: key } }));
  }
  function currentTheme() { return root.getAttribute('data-cxo-theme') || 'wallStreet'; }

  function themeMenu() {
    var btns = document.querySelectorAll('[data-tx-theme-open]');
    if (!btns.length) return;
    var menu = document.createElement('div');
    menu.className = 'tx-theme-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Colour theme'); menu.hidden = true;
    // swatches are drawn from each theme's own tokens, so they never drift from tokens.css
    menu.innerHTML = '<p class="tx-theme-menu__title">Colour theme</p>' + THEMES.map(function (t) {
      return '<button type="button" class="tx-theme-menu__item" role="menuitemradio" aria-checked="false" data-theme="' + t.key + '">' +
        '<span class="tx-theme-menu__swatch" data-cxo-theme="' + t.key + '" aria-hidden="true"><i style="background:var(--c-paper)"></i><i style="background:var(--c-nav-bg)"></i><i style="background:var(--c-gold)"></i></span>' +
        '<span class="tx-theme-menu__text"><b>' + t.name + '</b><small>' + t.desc + '</small></span>' +
        '<svg class="tx-theme-menu__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></button>';
    }).join('');
    document.body.appendChild(menu);
    var opener = null;
    function place() {
      var r = opener.getBoundingClientRect();
      var bar = opener.closest('.tx-sidebar');
      var edge = bar && getComputedStyle(bar).position !== 'fixed' ? bar.getBoundingClientRect().right : r.right;
      var w = menu.offsetWidth, h = menu.offsetHeight, left = edge + 10, top = r.bottom - h;
      if (left + w > window.innerWidth - 8) { left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)); top = r.bottom + 8; if (top + h > window.innerHeight - 8) top = r.top - h - 8; }
      menu.style.left = Math.round(left) + 'px'; menu.style.top = Math.round(Math.max(8, top)) + 'px';
    }
    function open(btn) {
      opener = btn; menu.hidden = false; place(); btn.setAttribute('aria-expanded', 'true'); root.classList.add('is-theme-menu-open');
      var on = menu.querySelector('[aria-checked="true"]') || menu.querySelector('[role="menuitemradio"]'); if (on) on.focus();
    }
    function close(focusBack) {
      if (menu.hidden) return;
      menu.hidden = true; root.classList.remove('is-theme-menu-open');
      if (opener) { opener.setAttribute('aria-expanded', 'false'); if (focusBack) opener.focus(); var bar = opener.closest('.tx-sidebar'); if (bar && !bar.matches(':hover') && !focusBack) bar.dispatchEvent(new Event('mouseleave')); }
    }
    btns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); if (menu.hidden) open(b); else close(false); }); });
    menu.addEventListener('click', function (e) { var it = e.target.closest('[data-theme]'); if (!it) return; setTheme(it.dataset.theme); close(true); });
    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitemradio"]')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) close(false); });
    window.addEventListener('resize', function () { if (!menu.hidden) place(); });
    setTheme(currentTheme());
  }

  /* ── app shell: collapsed by default, hover peeks in place, pin keeps open, drawer below 900px ── */
  function shell() {
    var sidebar = document.getElementById('tx-sidebar');
    if (!sidebar) return;
    var toggle = sidebar.querySelector('[data-tx-nav-toggle]');
    var scrim = document.querySelector('[data-tx-nav-close]');
    var openBtn = document.querySelector('[data-tx-nav-open]');
    var phone = window.matchMedia('(max-width: 899px)');
    var pinned = store(KEY_PIN) === '1', enterT, leaveT;
    function label() {
      if (!toggle) return;
      toggle.setAttribute('aria-expanded', String(pinned || root.classList.contains('is-nav-peek')));
      toggle.setAttribute('aria-label', pinned ? 'Collapse menu' : 'Keep menu open');
      toggle.title = pinned ? 'Collapse' : 'Keep open';
    }
    function setPinned(on) { pinned = on; root.classList.remove('is-nav-peek'); root.classList.toggle('is-nav-collapsed', !on); store(KEY_PIN, on ? '1' : '0'); label(); }
    function peek(open) {
      if (pinned || phone.matches) return;
      if (!open && root.classList.contains('is-theme-menu-open')) return;
      root.classList.toggle('is-nav-peek', open); root.classList.toggle('is-nav-collapsed', !open); label();
    }
    function drawer(open) {
      root.classList.toggle('is-nav-open', open);
      if (scrim) scrim.hidden = !open;
      if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
      if (open) { var first = sidebar.querySelector('.tx-nav-item'); if (first) first.focus(); } else if (openBtn && phone.matches) openBtn.focus();
    }
    root.classList.toggle('is-nav-collapsed', !pinned); label();
    sidebar.addEventListener('mouseenter', function () { clearTimeout(leaveT); enterT = setTimeout(function () { peek(true); }, 80); });
    sidebar.addEventListener('mouseleave', function () { clearTimeout(enterT); leaveT = setTimeout(function () { peek(false); }, 180); });
    sidebar.addEventListener('focusin', function () { clearTimeout(leaveT); peek(true); });
    sidebar.addEventListener('focusout', function (e) { if (!sidebar.contains(e.relatedTarget)) peek(false); });
    if (toggle) toggle.addEventListener('click', function () { if (phone.matches) { drawer(false); return; } setPinned(!pinned); });
    if (openBtn) openBtn.addEventListener('click', function () { drawer(true); });
    if (scrim) scrim.addEventListener('click', function () { drawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-nav-open')) drawer(false); });
    phone.addEventListener('change', function () { drawer(false); root.classList.remove('is-nav-peek'); });
  }

  /* ── tabs (roving tabindex, arrow keys) and segmented controls ───────────── */
  function tabs(scope) {
    (scope || document).querySelectorAll('[data-tx-tabs]').forEach(function (box) {
      if (box.__tx) return; box.__tx = true;
      var list = box.querySelector('[role="tablist"]'); if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      function select(tab, focus) {
        items.forEach(function (t) {
          var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
          var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
        });
        if (focus) tab.focus();
        box.dispatchEvent(new CustomEvent('twinx:tab', { detail: { tab: tab.id }, bubbles: true }));
      }
      list.addEventListener('click', function (e) { var t = e.target.closest('[role="tab"]'); if (t) select(t); });
      list.addEventListener('keydown', function (e) {
        var i = items.indexOf(document.activeElement); if (i < 0) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); select(items[(i + 1) % items.length], true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); select(items[(i - 1 + items.length) % items.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); select(items[0], true); }
        else if (e.key === 'End') { e.preventDefault(); select(items[items.length - 1], true); }
      });
    });
    (scope || document).querySelectorAll('[data-tx-segmented]').forEach(function (seg) {
      if (seg.__tx) return; seg.__tx = true;
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b || !seg.contains(b)) return;
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        seg.dispatchEvent(new CustomEvent('twinx:change', { detail: { value: b.value || b.textContent.trim() }, bubbles: true }));
      });
    });
  }

  /* ── dialogs: data-tx-open="id" opens <dialog id>, data-tx-close closes the nearest dialog ── */
  function dialogs() {
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-tx-open]');
      if (o) { var d = document.getElementById(o.getAttribute('data-tx-open')); if (d && d.showModal && !d.open) { d.showModal(); } return; }
      var c = e.target.closest('[data-tx-close]');
      if (c) { var dlg = c.closest('dialog'); if (dlg) dlg.close(c.value || ''); return; }
      // click on the backdrop closes a .tx-modal
      if (e.target.matches && e.target.matches('dialog.tx-modal[open]')) {
        var r = e.target.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close('');
      }
    });
  }

  /* ── toasts ─────────────────────────────────────────────────────────────── */
  function toast(message, opts) {
    opts = opts || {};
    var region = document.querySelector('.tx-toast-region');
    if (!region) { region = document.createElement('div'); region.className = 'tx-toast-region'; region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
    var el = document.createElement('div');
    el.className = 'tx-toast' + (opts.tone ? ' tx-toast--' + opts.tone : '');
    el.textContent = message;
    region.appendChild(el);
    setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 320); }, opts.duration || 3200);
    return el;
  }

  function init() { shell(); themeMenu(); tabs(); dialogs(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TwinX = { THEMES: THEMES, setTheme: setTheme, toast: toast, initTabs: tabs, version: '1.0.0' };
})();
