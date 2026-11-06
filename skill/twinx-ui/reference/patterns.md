# Page patterns and layout rules

Start every page from a file in `ui/twinx/patterns/`:

| Pattern | Use it for |
| --- | --- |
| `page-template.html` | Any page: shell, header, one card |
| `list-page.html` | A list of records: header with actions, filter bar, table card with pagination |
| `form-page.html` | Create or edit a record: stepper, form card with sections, sticky actions |
| `detail-page.html` | One record: context bar, KPI tiles, tabs with panels |

The patterns assume the page sits at the repo root (links start with `ui/`). If your pages live in a sub-folder,
adjust the prefix once (for example `../ui/twinx/twinx.css`).

## Page skeleton

```
<html data-cxo-theme="wallStreet" data-cxo-font="editorial">
<head> head script · ui/twinx/twinx.css · ui/local/local.css · page CSS (layout only) </head>
<body>
  <div class="tx-app">
    <aside class="tx-sidebar" id="tx-sidebar">…menu…</aside>
    <div class="tx-scrim" data-tx-nav-close hidden></div>
    <div class="tx-main">
      <div class="tx-mobile-bar">…</div>
      <header class="tx-page-header">…</header>
      <main class="tx-main__body"> cards </main>
    </div>
  </div>
  <script src="ui/twinx/js/twinx.js"></script>
</body>
```

## Layout rules

- Blocks are `tx-card`s stacked in `tx-main__body` (16px apart). Side-by-side blocks: `tx-grid tx-grid--2`
  or `tx-grid` with `--tx-grid-min`.
- One container per block; nothing framed inside a framed card except KPI tiles in a summary card.
- Page padding is owned by the shell (16px top, 20px sides; 16px below 1280px; drawer below 900px).
- Nothing has a fixed height except `tx-table-wrap` via `--tx-table-h` when the table should scroll inside.
- Below 900px every grid becomes one column and the menu bar becomes a drawer.
