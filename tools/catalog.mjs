// Generates the catalog page: every component, every example, live, in all five themes, with copy-markup buttons.
import path from 'node:path';
import { esc, posix, read, exists, GENERATED } from './lib.mjs';

const THEMES = [['wallStreet', 'Wall Street'], ['onyx', 'Onyx (dark)'], ['porcelain', 'Porcelain'], ['bordeaux', 'Bordeaux'], ['upsBrand', 'UPS Shield']];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// catalogFile: where the page is written; libDir/localDir: folders it links to; patterns: [{title, file}]
export function catalogHtml({ comps, version, catalogFile, libDir, localDir, hasLocalCss, hasLocalJs, patterns, repoName }) {
  const rel = (p) => posix(path.relative(path.dirname(catalogFile), p)) || '.';
  const cats = [];
  for (const c of comps) { let g = cats.find((x) => x.name === c.meta.category); if (!g) cats.push(g = { name: c.meta.category, items: [] }); g.items.push(c); }
  const localCount = comps.filter((c) => c.origin === 'local').length;

  const nav = cats.map((g) => `<p class="cat-nav__group">${esc(g.name)}</p>` + g.items.map((c) =>
    `<a class="cat-nav__link" href="#${c.origin}-${c.name}" data-search="${esc((c.meta.title + ' ' + c.name + ' ' + c.meta.description + ' ' + (c.meta.replaces || []).join(' ')).toLowerCase())}">${esc(c.meta.title)}${c.origin === 'local' ? ' <span class="tx-badge tx-badge--pending">Local</span>' : ''}</a>`).join('')).join('')
    + (patterns.length ? `<p class="cat-nav__group">Page patterns</p>` + patterns.map((p) => `<a class="cat-nav__link" href="#pattern-${slug(p.title)}" data-search="${esc(p.title.toLowerCase())} page pattern template">${esc(p.title)}</a>`).join('') : '');

  const sections = comps.map((c) => {
    const id = `${c.origin}-${c.name}`;
    const status = c.origin === 'local' ? '<span class="tx-badge tx-badge--pending">Local, not in the library yet</span>'
      : c.meta.status === 'deprecated' ? '<span class="tx-badge tx-badge--danger">Deprecated</span>'
      : c.meta.status === 'experimental' ? '<span class="tx-badge tx-badge--progress">Experimental</span>' : '<span class="tx-badge tx-badge--success">Stable</span>';
    const variants = (c.meta.variants || []).length ? `<div class="tx-table-wrap"><table class="tx-table tx-table--dense"><thead><tr><th scope="col">Class or attribute</th><th scope="col">Use it for</th></tr></thead><tbody>${c.meta.variants.map((v) => `<tr><td><code>${esc(v.class)}</code></td><td class="is-wrap">${esc(v.description)}</td></tr>`).join('')}</tbody></table></div>` : '';
    const examples = c.examples.map((e, i) => `
      <figure class="cat-example">
        <figcaption class="tx-row tx-row--between"><span class="cat-example__title">${esc(e.title)}</span>
          <span class="tx-row"><button type="button" class="tx-btn tx-btn--sm tx-btn--ghost" data-cat-code>Show code</button><button type="button" class="tx-btn tx-btn--sm" data-cat-copy>Copy markup</button></span></figcaption>
        <div class="cat-example__preview">${e.html}</div>
        <pre class="cat-example__code" hidden><code>${esc(e.html)}</code></pre>
      </figure>`).join('');
    return `
    <section class="tx-card cat-comp" id="${id}" aria-labelledby="${id}-t">
      <header class="tx-card__head">
        <div class="tx-card__titles"><h2 class="tx-card__title" id="${id}-t">${esc(c.meta.title)} <code class="cat-name">${esc(c.name)}</code></h2>
        <p class="tx-card__subtitle">${esc(c.meta.description)}</p></div>
        <div class="tx-card__actions">${status}${c.meta.extends ? ` <span class="tx-badge tx-badge--info">Adds to ${esc(c.meta.extends)}</span>` : ''}</div>
      </header>
      <div class="tx-card__body tx-stack">
        <dl class="cat-facts">
          <div><dt>When to use</dt><dd>${esc(c.meta.whenToUse)}</dd></div>
          ${c.meta.a11y ? `<div><dt>Accessibility</dt><dd>${esc(c.meta.a11y)}</dd></div>` : ''}
          ${(c.meta.replaces || []).length ? `<div><dt>Replaces</dt><dd>${c.meta.replaces.map((r) => `<code>${esc(r)}</code>`).join(' ')}</dd></div>` : ''}
          <div><dt>Files</dt><dd><code>${esc(c.rel)}/</code>${c.meta.owner ? ` · owner ${esc(c.meta.owner)}` : ''}${c.meta.since ? ` · since ${esc(c.meta.since)}` : ''}</dd></div>
        </dl>
        ${examples}
        ${variants}
      </div>
    </section>`;
  }).join('');

  const patternSections = patterns.map((p) => {
    const html = read(p.file);
    const base = rel(path.resolve(path.dirname(catalogFile), p.baseFor));
    const doc = html.replace(/<head>/i, '<head><base href="__TX_BASE__">');
    return `
    <section class="tx-card cat-comp" id="pattern-${slug(p.title)}" aria-labelledby="pattern-${slug(p.title)}-t">
      <header class="tx-card__head"><div class="tx-card__titles"><h2 class="tx-card__title" id="pattern-${slug(p.title)}-t">${esc(p.title)} <code class="cat-name">${esc(posix(path.relative(path.dirname(catalogFile), p.file)))}</code></h2>
      <p class="tx-card__subtitle">${esc(p.description || 'Copy this file to start a new page. Keep the head, the shell and the load order; change the content inside tx-main__body.')}</p></div></header>
      <div class="tx-card__body"><iframe class="cat-frame" title="${esc(p.title)} preview" data-base="${base}/" data-srcdoc="${esc(doc)}"></iframe></div>
    </section>`;
  }).join('');

  return `<!DOCTYPE html>
<!-- ${GENERATED} -->
<html lang="en" data-cxo-theme="wallStreet" data-cxo-font="editorial">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TwinX UI catalog</title>
  <script>try{var t=localStorage.getItem("twinx-theme");if(/^(wallStreet|onyx|porcelain|bordeaux|upsBrand)$/.test(t))document.documentElement.setAttribute("data-cxo-theme",t)}catch(e){}</script>
  <link rel="stylesheet" href="${rel(path.join(libDir, 'twinx.css'))}">
  ${hasLocalCss ? `<link rel="stylesheet" href="${rel(path.join(localDir, 'local.css'))}">` : ''}
  <style>
    /* catalog chrome only (tokens, no literals) */
    .cat { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; background: var(--paper-grad); }
    .cat-nav { position: sticky; top: 0; height: 100vh; overflow-y: auto; padding: var(--s-xl) var(--s-lg); border-right: 1px solid var(--c-line); background: var(--c-card); }
    .cat-nav__brand { display: flex; align-items: center; gap: 10px; margin-bottom: var(--s-lg); }
    .cat-nav__brand b { display: block; font: 700 15px/1.2 var(--disp); color: var(--c-ink); }
    .cat-nav__brand small { display: block; font-size: var(--t-small); color: var(--c-muted); }
    .cat-nav__group { margin: var(--s-lg) 0 var(--s-xs); font: 800 9px/1.3 var(--font); letter-spacing: .14em; text-transform: uppercase; color: var(--c-muted); }
    .cat-nav__link { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 10px; border-radius: var(--rad-sm); font: 500 13px/1.3 var(--font); color: var(--c-ink2); }
    .cat-nav__link:hover { background: var(--c-gold-hover); color: var(--c-ink); }
    .cat-nav__link[hidden] { display: none; }
    .cat-main { padding: var(--s-xl) var(--page-pad-x) var(--s-xxxl); display: flex; flex-direction: column; gap: var(--s-xl); min-width: 0; max-width: 1180px; }
    .cat-name { font: 500 var(--t-small)/1 var(--font); color: var(--c-muted); background: var(--c-ink-tint2); padding: 2px 6px; border-radius: var(--rad-sm); vertical-align: middle; }
    .cat-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--s-md) var(--s-xl); margin: 0; }
    .cat-facts dt { font: 800 9px/1.3 var(--font); letter-spacing: .14em; text-transform: uppercase; color: var(--c-muted); margin-bottom: 4px; }
    .cat-facts dd { margin: 0; font: 400 var(--t-body)/1.5 var(--font); color: var(--c-ink2); }
    .cat-facts code, .tx-table code { font-size: var(--t-small); color: var(--c-brand-lt); }
    .cat-example { margin: 0; border: 1px solid var(--c-line); border-radius: var(--rad-md); overflow: hidden; }
    .cat-example > figcaption { padding: var(--s-sm) var(--s-md); background: var(--c-ink-tint); border-bottom: 1px solid var(--c-line); }
    .cat-example__title { font: 600 var(--t-body)/1.3 var(--font); color: var(--c-ink2); }
    .cat-example__preview { padding: var(--s-xl); background: var(--c-paper); overflow-x: auto; }
    .cat-example__code { margin: 0; max-height: 360px; overflow: auto; padding: var(--s-md) var(--s-lg); background: var(--c-nav-bg); color: var(--c-on-dark); font: 400 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre; }
    .cat-frame { width: 100%; height: 620px; border: 1px solid var(--c-line); border-radius: var(--rad-md); background: var(--c-paper); }
    .cat-intro { flex-direction: column; align-items: flex-start; gap: var(--s-lg); margin-bottom: 0; }
    .cat-themes { display: flex; flex-wrap: wrap; gap: var(--s-sm); align-items: center; }
    @media (max-width: 899px) { .cat { grid-template-columns: minmax(0, 1fr); } .cat-nav { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--c-line); } .cat-nav__links { max-height: 220px; overflow-y: auto; } .cat-example__preview { padding: var(--s-md); } }
  </style>
</head>
<body>
<div class="cat">
  <aside class="cat-nav" aria-label="Components">
    <div class="cat-nav__brand"><span class="tx-sidebar__badge" aria-hidden="true">TX</span><span><b>TwinX UI</b><small>v${esc(version)} · ${comps.length} components${localCount ? ` (${localCount} local)` : ''}</small></span></div>
    <div class="tx-field"><label class="tx-field__label" for="cat-q">Find a component</label><input class="tx-input" id="cat-q" type="search" placeholder="button, table, .ad-btn…"></div>
    <div class="cat-nav__links">${nav}</div>
  </aside>
  <main class="cat-main">
    <header class="tx-page-header cat-intro">
      <div class="tx-page-header__text">
        <span class="tx-kicker">${esc(repoName || 'TCS TwinX 3.0 UI')}</span>
        <h1 class="tx-page-header__title">Component catalog</h1>
        <p class="tx-page-header__lead">Every component in the library, live. Pick a theme to check it in all five CXO palettes, then copy the markup into your page. Pages link <code>ui/twinx/twinx.css</code>${hasLocalCss ? ' and <code>ui/local/local.css</code>' : ''} and load <code>ui/twinx/js/twinx.js</code>.</p>
      </div>
      <div class="cat-themes" role="group" aria-label="Theme">
        <div class="tx-segmented" data-tx-segmented id="cat-theme">${THEMES.map(([k, n]) => `<button type="button" value="${k}" aria-pressed="false">${n}</button>`).join('')}</div>
      </div>
    </header>
    ${sections}
    ${patternSections}
  </main>
</div>
<script src="${rel(path.join(libDir, 'js/twinx.js'))}"></script>
${hasLocalJs ? `<script src="${rel(path.join(localDir, 'local.js'))}"></script>` : ''}
<script>
(function () {
  var seg = document.getElementById('cat-theme');
  function mark() { var cur = document.documentElement.getAttribute('data-cxo-theme'); seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.value === cur)); }); }
  seg.addEventListener('twinx:change', function (e) { TwinX.setTheme(e.detail.value); document.querySelectorAll('.cat-frame').forEach(function (f) { try { f.contentDocument.documentElement.setAttribute('data-cxo-theme', e.detail.value); } catch (x) {} }); });
  mark();
  document.querySelectorAll('.cat-frame').forEach(function (f) { f.srcdoc = f.dataset.srcdoc.replace('__TX_BASE__', new URL(f.dataset.base, location.href).href); });
  document.querySelectorAll('.cat-frame').forEach(function (f) { f.addEventListener('load', function () { try { f.contentDocument.documentElement.setAttribute('data-cxo-theme', document.documentElement.getAttribute('data-cxo-theme')); } catch (x) {} }); });
  document.addEventListener('click', function (e) {
    var fig = e.target.closest('.cat-example'); if (!fig) return;
    var code = fig.querySelector('.cat-example__code');
    if (e.target.closest('[data-cat-code]')) { code.hidden = !code.hidden; e.target.closest('button').textContent = code.hidden ? 'Show code' : 'Hide code'; }
    if (e.target.closest('[data-cat-copy]')) {
      var b = e.target.closest('button'), text = code.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { TwinX.toast('Markup copied', { tone: 'success' }); }, function () { code.hidden = false; TwinX.toast('Select the code and copy it', {}); });
    }
  });
  var q = document.getElementById('cat-q');
  q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase();
    document.querySelectorAll('.cat-nav__link').forEach(function (a) { a.hidden = !!v && a.dataset.search.indexOf(v) < 0; });
  });
})();
</script>
</body>
</html>
`;
}
