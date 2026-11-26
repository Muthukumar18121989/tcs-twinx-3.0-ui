# Worked example: the Decision Lab page

A developer team built a "Decision Lab" page (Pricing Optimization for Pharma Distributors) with the TwinX shell
and tokens. The shell, header and sidebar were right. These are the problems the audit found and how each was
fixed. Use it as the model for any page.

## What was wrong

| # | Area | What the page did | Why it is wrong |
| --- | --- | --- | --- |
| 1 | Charts | Donut slices in fixed blue, purple, green and orange; the single-series donut in orange | The chart never follows the theme; in Onyx or Night Shift it clashes, and the colours mean nothing in TwinX |
| 2 | Charts | Legend **text** coloured in each series colour | Coloured text fails contrast in several themes; only the swatch should carry colour |
| 3 | Layout | Small donuts centred in wide, mostly empty cards | The card is not filled by its content; the totals (196, 3,218) only appear in a pill |
| 4 | Badges | "196 Twins", "3,218 SKUs" as outlined custom pills | A count is `tx-badge--info` (or `tx-tab__count`), not a new pill style |
| 5 | Badges | "COMPLETED" as a grey pill with a dark dot | Completed is `tx-badge--success` (green) everywhere in TwinX |
| 6 | Buttons | Filled navy "Results" button on every row, plus "New Experiment" filled | Eight primary buttons in one view: nothing stands out. Only "New experiment" is primary |
| 7 | Buttons | "Compare" styled as a faded custom button | A disabled action is `<button class="tx-btn tx-btn--sm" disabled>` |
| 8 | Table | Recommended price KPI as grey chips, two per cell | One-off chips. Two values stack as two text lines, numbers right aligned with `is-num` |
| 9 | Table | Experiment IDs in a custom bright blue | IDs are links or `is-muted` text styled by the table, which follows the theme |
| 10 | Table | Progress bars in a fixed green | No library progress bar yet: build `ui/local/components/progress/` with tokens (green when done, brand when running) and contribute it |
| 11 | Components | "My Projects" panel: a framed card for every project inside a framed panel | Box inside a box, and one-off markup. Build `ui/local/components/projects-panel/` (`twinx-ui new projects-panel`), list items as rows with hairlines, the selected one with `--c-gold-tint` |
| 12 | Pagination | Custom "Prev / Page 1 of 5 / Next" buttons | `tx-pagination` in the card footer |

## The fixes, in markup

### 1–3. Customer twins card: donut from the library, legend in ink, totals in the centre

```html
<section class="tx-card" aria-labelledby="ct-title">
  <header class="tx-card__head">
    <div class="tx-card__titles">
      <h2 class="tx-card__title" id="ct-title">Customer digital twins</h2>
      <p class="tx-card__subtitle">196 active distributor accounts across 3 healthcare segments</p>
    </div>
    <div class="tx-card__actions"><span class="tx-badge tx-badge--info">196 twins</span></div>
  </header>
  <div class="tx-card__body">
    <div class="tx-chart tx-chart--row">
      <div class="tx-donut-wrap">
        <svg class="tx-donut" viewBox="0 0 36 36" role="img" aria-label="Community Health Centers 42%, Hospitals and Health Systems 35%, Retail Alliances 23%">
          <circle class="tx-donut__track" cx="18" cy="18" r="15.915"/>
          <circle class="tx-donut__slice tx-series-1" cx="18" cy="18" r="15.915" stroke-dasharray="42 58" stroke-dashoffset="0"/>
          <circle class="tx-donut__slice tx-series-2" cx="18" cy="18" r="15.915" stroke-dasharray="35 65" stroke-dashoffset="-42"/>
          <circle class="tx-donut__slice tx-series-3" cx="18" cy="18" r="15.915" stroke-dasharray="23 77" stroke-dashoffset="-77"/>
        </svg>
        <div class="tx-donut__center" aria-hidden="true"><span class="tx-donut__value">196</span><span class="tx-donut__label">Twins</span></div>
      </div>
      <ul class="tx-legend tx-legend--stack">
        <li class="tx-legend__item tx-series-1"><span class="tx-legend__swatch" aria-hidden="true"></span>Community Health Centers <span class="tx-legend__value">82</span></li>
        <li class="tx-legend__item tx-series-2"><span class="tx-legend__swatch" aria-hidden="true"></span>Hospitals &amp; Health Systems <span class="tx-legend__value">69</span></li>
        <li class="tx-legend__item tx-series-3"><span class="tx-legend__swatch" aria-hidden="true"></span>Retail Alliances <span class="tx-legend__value">45</span></li>
      </ul>
    </div>
  </div>
</section>
```

`stroke-dasharray` values are percentages because `r="15.915"` gives a circumference of 100. Each slice's
`stroke-dashoffset` is minus the sum of the slices before it.

### 1 (canvas version). The same donut in Chart.js

```js
let chart;
TwinX.onTheme(() => {
  const colors = TwinX.chartColors(3);           // brand, gold, green in the current theme
  if (chart) chart.destroy();
  chart = new Chart(el, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: TwinX.token('--c-card'), borderWidth: 2 }] },
    options: { cutout: '72%', plugins: { legend: { display: false } } }   // use tx-legend in HTML instead
  });
});
```

React (Recharts): `const [colors, setColors] = useState(() => TwinX.chartColors(8)); useEffect(() => TwinX.onTheme(() => setColors(TwinX.chartColors(8))), []);`
then `<Cell fill={colors[i]} />`. Or skip JS entirely: `<Cell fill="var(--chart-1)" />` works for SVG output.

### 5, 6, 8, 9. Experiments table: status, one primary, plain values

```html
<tr>
  <td><input class="tx-check" type="checkbox" aria-label="Compare experiment 6331"></td>
  <td class="is-muted"><a href="results.html?id=6331">#6331</a></td>
  <td class="is-strong">test226</td>
  <td>Determining optimal pricing strategy</td>
  <td><!-- ui/local progress component --></td>
  <td><span class="tx-badge tx-badge--success">Completed</span></td>
  <td class="is-num">Enbrel $4,825.52<br>Januvia $527.38</td>
  <td><button type="button" class="tx-btn tx-btn--sm">Results</button></td>
</tr>
```

The card header keeps the only primary action of this area:
`<button type="button" class="tx-btn tx-btn--sm tx-btn--primary">New experiment</button>` and a
`<button type="button" class="tx-btn tx-btn--sm" disabled>Compare</button>` until two rows are ticked.

### 11. Projects panel as a local component

```
node ui/twinx/cli/bin/twinx-ui.mjs new projects-panel --title "Projects panel" --category "Navigation"
```

Build it in `ui/local/components/projects-panel/` with tokens only: one `tx-card` holding a header
(`MY PROJECTS` micro label + `tx-tab__count`, `tx-btn--ghost tx-btn--icon` add and collapse buttons with
`aria-label`), the "New experiment" button, and a list of projects as rows (hairline between rows, selected row
`background: var(--c-gold-tint)` with a gold left edge). Then `twinx-ui contribute projects-panel`.

## Result

After the fixes the page passes `twinx-ui lint` with 0 errors and 0 warnings, and every chart, badge and button
changes with the theme: switch between `wallStreet`, `twinx`, `onyx` and `nightShift` to see it.
