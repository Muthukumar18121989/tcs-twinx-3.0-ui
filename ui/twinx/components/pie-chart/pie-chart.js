/* Pie and donut chart: reads data-value from each .tx-pie__item and paints the slices with the theme's chart tokens.
   Runs on load for every [data-tx-pie]; call TwinX.renderPies(rootElement) after adding charts later. */
(function () {
  'use strict';
  function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 }) + '%'; }
  function render(fig) {
    var chart = fig.querySelector('.tx-pie__chart');
    var items = Array.prototype.slice.call(fig.querySelectorAll('.tx-pie__item'));
    if (!chart || !items.length) return;
    var values = items.map(function (li) { var v = parseFloat(li.getAttribute('data-value')); return v > 0 ? v : 0; });
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    if (!total) return;
    var at = 0, stops = [], words = [];
    values.forEach(function (v, i) {
      var pct = v / total * 100, colour = 'var(--chart-' + ((i % 8) + 1) + ')';
      stops.push(colour + ' ' + at.toFixed(3) + '% ' + (at + pct).toFixed(3) + '%');
      at += pct;
      var share = items[i].querySelector('.tx-pie__share');
      if (share) share.textContent = fmt(pct);
      var label = items[i].querySelector('.tx-pie__label');
      words.push((label ? label.textContent.trim() : 'Item ' + (i + 1)) + ' ' + fmt(pct));
    });
    chart.style.background = 'conic-gradient(' + stops.join(', ') + ')';
    chart.setAttribute('role', 'img');
    var cap = fig.querySelector('.tx-pie__caption');
    chart.setAttribute('aria-label', (cap ? cap.textContent.trim() + ': ' : '') + words.join(', '));
  }
  function renderPies(root) { (root || document).querySelectorAll('[data-tx-pie]').forEach(render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { renderPies(); }); else renderPies();
  window.TwinX = window.TwinX || {};
  window.TwinX.renderPies = renderPies;
})();
