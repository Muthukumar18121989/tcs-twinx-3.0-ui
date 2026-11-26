---
name: twinx-ui-audit
description: Audit and fix a page or screen that was built with the TCS TwinX 3.0 UI library so it follows the theme and reuses tx- components. Use when someone asks to review, check, clean up, fix or make consistent a page, a screenshot of a page, chart colours, badges, buttons or tables, or before handing a TwinX page over.
---

# TwinX page audit and fix

Developers often build a TwinX page that *almost* follows the library: the shell and tokens are there, but the
charts use their own colours, statuses are grey pills, every row has a filled button and a few blocks are one-off
markup. Each of these breaks something: the page stops following the theme, looks different from the next page,
and cannot be updated by `twinx-ui sync`. This skill finds those problems and fixes them with library parts.

Read `.claude/skills/twinx-ui/SKILL.md` (or `.agent/skills/twinx-ui/SKILL.md`) first: its rules apply here too.
A worked example of a real page, with every finding and its fix, is in `reference/decision-lab-example.md`.

## 1. Collect what to audit

- **Code**: the page files the person names, or the files changed on the branch (`git diff --name-only main`).
  Include the page's CSS, its scripts and any chart code (Chart.js, ECharts, Recharts, D3, inline SVG).
- **Screenshot only**: audit what you see, name each finding by what it looks like, then find the code for it.
- Note the library version in `ui/twinx/VERSION.json`. If it is older than the one in the repo's README, run
  `twinx-ui sync` first so the audit uses the current components (for example `chart`, added in 1.1.0).

## 2. Run the lint, warnings included

```
node ui/twinx/cli/bin/twinx-ui.mjs lint <files…>
```

Treat **warnings as findings too** in an audit. The rules most often hit:

| Rule | What it means |
| --- | --- |
| `color-literal` | A hex, `rgb()`, `white` or `black` in CSS or an inline style |
| `chart-color` | `fill`, `stroke` or `stop-color` set to a fixed colour in SVG or JSX |
| `script-color` (warning) | A colour literal in a script: chart options, colour arrays, inline style strings |
| `primary-in-row` (warning) | A filled primary button repeated in table rows |
| `unknown-class` | A `tx-` class that no component defines (an invented name) |
| `restyle` | Page CSS that changes how a `tx-` class looks |

The lint cannot see everything. Do the checklist below on every page.

## 3. Checklist (check each line, write down every miss)

### Colour and theme
1. No colour is written as a value anywhere: CSS, inline styles, SVG attributes, chart options, JS arrays.
2. Text on a brand fill is `var(--c-on-brand)`; tints are `color-mix(in srgb, var(--c-x) N%, transparent)`.
3. The page looks right in **every theme** (palette button in the menu): `wallStreet`, `onyx` (dark),
   `porcelain`, `bordeaux`, `upsBrand`, `twinx`, `usbBrand` (Meridian), `torque`, `slipstream`, `graphite`,
   `nightShift` (dark). If anything stays the same colour while the theme changes, it is hardcoded.

### Charts
4. Series colours come from `var(--chart-1)` … `var(--chart-8)` **in order**: series 1 is the brand colour,
   then gold, green, red, amber, slate. Never choose colours per chart, and never reorder them for taste.
5. SVG and donuts use the `chart` component: `tx-donut`, `tx-donut__slice tx-series-N`, `tx-legend`.
6. Canvas charts (Chart.js, ECharts, Highcharts, Recharts with props) take colours from
   `TwinX.chartColors(n)`, axis text from `TwinX.token('--c-muted')`, grid lines from `TwinX.token('--c-line')`,
   and redraw on theme change with `TwinX.onTheme(fn)`.
7. Legend **text is ink** (`tx-legend__item`); only the swatch carries the series colour. Coloured legend text
   is unreadable in half the themes.
8. Every chart states its values in text (legend values or an `aria-label`), not only in colour.

### Components (reuse, do not reinvent)
9. Every block is a library component: `tx-card`, `tx-kpi`, `tx-table`, `tx-badge`, `tx-btn`, `tx-tabs`,
   `tx-pagination`, `tx-modal`, `tx-filter-bar`, `tx-page-header`, `tx-context-bar`, `tx-empty`. Check
   `ui/twinx/registry.json` (and its `replaces` lists) before accepting any custom class.
10. Something the library really does not have (for example a projects side panel or a progress bar) becomes a
    **local component** in `ui/local/components/<name>/` (`twinx-ui new <name>`), used the same way on every
    page, and is offered back with `twinx-ui contribute <name>`. Never leave it as page-only markup.
11. No invented `tx-` names, no page CSS that restyles a `tx-` class.

### Status badges (same words, same colour, everywhere)

| Status text | Class |
| --- | --- |
| Completed, Approved, Done, Valid, Active | `tx-badge tx-badge--success` |
| In progress, Running, Processing | `tx-badge tx-badge--progress` |
| Pending, Waiting, Needs action, Submitted | `tx-badge tx-badge--pending` |
| Failed, Rejected, Error, Cancelled | `tx-badge tx-badge--danger` |
| Draft, Unknown, Archived | `tx-badge tx-badge--neutral` |
| Iteration 3, v2, a tag, a count such as "196 Twins" | `tx-badge tx-badge--info` (no dot) |

12. A status is never a grey pill with a hand-made dot. Counts next to a tab or panel title use `tx-tab__count`.

### Buttons
13. **One primary (filled) button per view** and one per dialog: the main action of the page, such as
    "New experiment". Row actions in a table ("Results", "Open", "Configure") are `tx-btn tx-btn--sm` (or
    `tx-btn--ghost tx-btn--sm`), never `tx-btn--primary` repeated down the column.
14. Destructive actions use `tx-btn--danger`. Icon-only buttons are `tx-btn--icon` with an `aria-label`.
15. A disabled action is a real `disabled` button, not a greyed-out custom style.

### Tables
16. `tx-table` inside `tx-table-wrap`, which sits flush in its `tx-card` (no extra frame). Numbers and prices
    are `is-num` (right aligned, tabular). IDs are `is-muted` or a link coloured by the table, not a custom blue.
17. Values are plain text in the cell. Two values in one cell stack as two lines of text, not as grey chips.
18. Pagination is `tx-pagination` in the card footer, with "Showing 1–8 of 33" as `tx-muted` text.

### Layout and containers
19. One container per block: never a framed box inside another framed box. KPI tiles inside a summary card are
    the only exception. A list of items inside a panel uses rows with hairlines, not a card per item.
20. A chart card is filled by its chart: use `tx-chart--row` (chart and legend side by side) or `tx-kpi` tiles
    beside it instead of a small chart floating in empty space.
21. Page padding, sidebar behaviour (collapsed, opens on hover, pin) and the header come from the shell. Do not
    change them on a page.

### Type and accessibility
22. Fonts are `var(--font)`, `var(--disp)`, `var(--title)`; sizes use the `--t-*` scale. One `<h1>` per page.
23. Every control has a label; every status has its word, not only its colour.

## 4. Fix, in this order

1. **Colours**: replace every literal with its token, chart series with `--chart-N` / `TwinX.chartColors()`.
2. **Components**: swap one-off markup for the library component; copy the markup from
   `ui/twinx/components/<name>/<name>.html`. Make missing pieces local components (step 3.10).
3. **Badges and buttons**: apply the status table and the one-primary rule.
4. **Layout**: remove nested frames, fill or rearrange half-empty cards.
5. Delete page CSS that is no longer used.

Keep behaviour the same: do not change data, routes, labels or what a button does, only how it is built.

## 5. Verify

- `node ui/twinx/cli/bin/twinx-ui.mjs build`, then `… lint` on the touched files: **0 errors and 0 warnings**
  (or a warning you explain).
- Open the page in all eleven themes, at least `wallStreet`, `onyx`, `twinx` and `nightShift`, and check that
  every chart, badge and button changes with the theme. Check 1440, 1024 and 390 px wide.

## 6. Report

Reply with a short table: **finding → fix → file**, grouped as Colour, Charts, Components, Badges, Buttons,
Tables, Layout. List any new local component and suggest `twinx-ui contribute <name>`. If you could not fix
something (for example a chart library that cannot take CSS colours), say so and why.
