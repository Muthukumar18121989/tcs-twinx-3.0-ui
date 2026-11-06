---
name: twinx-ui
description: Build or change any screen, page, component or style with the TCS TwinX 3.0 UI library (CXO design system). Use whenever the task touches HTML, CSS, layout, colours, buttons, tables, forms, dialogs or a new page, so the work reuses library components and tokens, and any new or customised component is added to ui/local for the library.
---

# TCS TwinX 3.0 UI

This repo uses the **TCS TwinX 3.0 UI** library: CXO design tokens with five colour themes, and ready-made
components with the `tx-` class prefix. Every screen anyone builds here must look like it came from the same
product. Your job is to **reuse first, extend second, invent last**, and to leave anything new in a place where
it can go back into the library.

## Where things are

| Path | What | Can you edit it? |
| --- | --- | --- |
| `ui/twinx/` | The library (synced from the TwinX repo) | **Never.** It is replaced on every sync and the lint rejects edits. |
| `ui/twinx/registry.json` | Every component, its classes, variants and when to use it | Read it first |
| `ui/twinx/components/<name>/<name>.html` | Copy-ready markup for each variant | Read and copy |
| `ui/twinx/patterns/*.html` | Page templates (shell, header, card, table, form) | Copy to start a page |
| `ui/twinx/tokens/tokens.css` | Colours, spacing, radius, shadow, type, z-index, motion | Read only |
| `ui/local/components/<name>/` | This repo's own and customised components | **Yes**, this is where new work goes |
| `ui/catalog.html` | Live catalog of library + local components in all themes | Generated |
| `reference/components.md` (next to this file) | Short guide to every component | Generated |
| `reference/tokens.md`, `reference/patterns.md` | Token meanings, layout rules | Read when styling |

## Workflow for every UI task

1. **Look before you build.** Read `ui/twinx/registry.json` (and `ui/local/registry.json`) or
   `reference/components.md`. Pick the closest component and variant. Search by the old class name too: each
   component lists the legacy classes it `replaces`.
2. **New page?** Copy `ui/twinx/patterns/page-template.html` (or `list-page.html`, `form-page.html`). Keep the
   `<head>` (head script, then `ui/twinx/twinx.css`, then `ui/local/local.css`), the `tx-app` shell, and
   `ui/twinx/js/twinx.js` at the end of `<body>`. Change the brand, the menu items and what is inside
   `tx-main__body`. Never copy an old page to start a new one.
3. **Use the markup exactly as in the component's `.html` file.** Same elements, same classes, same ARIA. Do not
   add page-level CSS that changes how a `tx-` class looks.
4. **Page CSS is for layout only**: grid columns, widths, ordering. Prefer the helpers `tx-stack`, `tx-row`,
   `tx-grid`. Any value you write uses tokens: `var(--s-lg)`, `var(--rad-md)`, `var(--c-line)`. Never a hex,
   `rgb()`, `white`, `black` or a font name.
5. **Need it to look different?** Do not override it in the page. Make a variant in `ui/local`:
   `node ui/twinx/cli/bin/twinx-ui.mjs new <component>-<what> --extends <component>`. It adds a modifier class,
   for example `tx-btn--success`, with its own CSS, markup example and `component.json` entry.
6. **Genuinely new component?** First check that no component or combination of components does the job.
   Then `node ui/twinx/cli/bin/twinx-ui.mjs new <name> --title "Readable name" --category "Data display"`,
   build it in `ui/local/components/<name>/` with the `tx-<name>` prefix, fill in every field of
   `component.json` (description, whenToUse, variants, a11y), add at least one `<!-- @example: … -->` block
   to the `.html` file, then use it in the page.
7. **Check before you finish.**
   - `node ui/twinx/cli/bin/twinx-ui.mjs build` regenerates `ui/local/local.css`, the registry and the catalog.
   - `node ui/twinx/cli/bin/twinx-ui.mjs lint` must report 0 errors for the files you touched.
   - Open the page and `ui/catalog.html` and check all five themes (palette button in the menu bar):
     `wallStreet`, `onyx` (dark), `porcelain`, `bordeaux`, `upsBrand`.
   - Check widths 1440, 1280, 1024, 768 and 390 px.
8. **Say what you added.** In your reply and in the pull request, list any new component or variant in
   `ui/local` and suggest `twinx-ui contribute <name>` so the library owner can review it for everyone.

## Rules that always apply

- **Tokens, never literals.** Colours come from `var(--c-*)`. Text on a brand fill is `var(--c-on-brand)`,
  never white. Tints are `color-mix(in srgb, var(--c-x) N%, transparent)`, never `rgba()`. Fonts are
  `var(--font)`, `var(--disp)` (headings, numbers) and `var(--title)` (page and dialog titles).
- **One container per block.** A titled `tx-card` holds the block. Never put a framed box inside another framed
  box (tables, filter bars and forms inside a card sit flush; the library does this for you). KPI tiles inside a
  summary card are the one exception.
- **Tight page padding**: 16px top, 20px sides. The shell sets it; do not add padding to `tx-main`.
- **Pages scroll** on short windows instead of squashing content. Do not set fixed heights on page sections.
- **Wide tables** scroll sideways inside `tx-table-wrap` with a visible scrollbar. Numbers are `is-num`.
  Headers of columns with column lines (`tx-table--lines`) are centred; otherwise they follow their column.
- **The menu bar** is collapsed by default, opens on hover in place and pushes the content over (never on top),
  and the toggle pins it open. Do not change this behaviour.
- **One primary button** per view or dialog. Destructive actions use `tx-btn--danger`.
- **Accessibility**: one `<h1>` per page (in `tx-page-header`), labels on every control, `aria-label` on
  icon-only buttons, status in words not only colour, native `<dialog>` for modals.
- **No new dependencies or frameworks** for styling (no Tailwind, Bootstrap, UI kits, CSS-in-JS) unless the
  person explicitly asks. Plain HTML, CSS and `twinx.js` are enough.
- If the person asks for something that breaks these rules, say which rule, offer the closest compliant option,
  and only break it if they confirm.

## Behaviour in twinx.js (no page script needed)

- Shell: `<aside class="tx-sidebar" id="tx-sidebar">`, `data-tx-nav-toggle`, `data-tx-nav-open`, `data-tx-nav-close`.
- Theme menu: any button with `data-tx-theme-open`. `TwinX.setTheme('onyx')` from code.
- Tabs: wrap in `data-tx-tabs`; segmented control: `data-tx-segmented` (fires `twinx:change`).
- Dialogs: `data-tx-open="<dialog id>"` and `data-tx-close`.
- Toasts: `TwinX.toast('Saved', { tone: 'success' })`.

See `reference/contributing.md` for how local components go back into the library.
