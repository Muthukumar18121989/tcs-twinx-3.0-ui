# TwinX tokens (ui/twinx/tokens/tokens.css)

Every value below is a CSS custom property. Themes change the palette by setting `data-cxo-theme` on `<html>`;
everything derived from it (tints, gradients, shadows) follows. Never write the hex values themselves.

## Colour (meaning, not hue)

| Token | Use it for |
| --- | --- |
| `--c-paper` | Page background |
| `--c-card` | Card, input and dialog surfaces |
| `--c-ink` | Main text, headings |
| `--c-ink2` | Secondary text, input values |
| `--c-muted` | Labels, captions, helper text |
| `--c-faint` | Placeholders, disabled text, separators like "/" |
| `--c-line` / `--c-line2` | Hairlines and card borders / control borders |
| `--c-brand` / `--c-brand-lt` | Primary actions, selected states / links |
| `--c-on-brand` | Text and icons on a brand fill (instead of white) |
| `--c-gold` / `--c-gold-dk` | Accent: focus ring, hover borders, active markers / gold text |
| `--c-nav-bg` / `--c-nav-bg2` / `--c-on-dark` | Menu bar and dark bands / text on them |
| `--c-green` + `--c-green-bg` | Success, approved |
| `--c-red` + `--c-red-bg` | Error, rejected, destructive |
| `--c-amber` + `--c-amber-bg` | Warning, pending |
| `--c-gold-tint`, `--c-gold-hover`, `--c-gold-ring` | Selected row, hover wash, focus ring |
| `--c-brand-tint`, `--c-brand-tint2`, `--c-ink-tint`, `--c-ink-tint2` | Opaque washes over the card (sticky headers, tracks) |
| `--nav-text`, `--nav-text-quiet`, `--nav-fill`, `--nav-fill-hover`, `--nav-line` | Text, fills and lines on the dark menu bar |
| `--chart-1` … `--chart-8` | Chart series, brand first |

Need a tint that is not listed? `color-mix(in srgb, var(--c-brand) 12%, transparent)`.

## Type

- Families: `--font` (body, tables, labels), `--disp` (UI headings, numbers, card titles), `--title` (page and dialog titles; also use `--cxo-title-weight`, `--cxo-title-scale`, `--cxo-title-tracking`).
- Scale: `--t-micro` 9, `--t-caption` 10.5, `--t-small` 11.5, `--t-body` 12.5, `--t-base` 13, `--t-lead` 15, `--t-h3` 18, `--t-h2` 22, `--t-h1` 28 (px).
- Micro labels: 800 weight, 9px, `letter-spacing: .14em`, uppercase, `--c-muted` (as in `tx-field__label`).

## Space, shape, depth, layers, motion

- Spacing: `--s-xs` 4, `--s-sm` 8, `--s-md` 12, `--s-lg` 16, `--s-xl` 24, `--s-xxl` 32, `--s-xxxl` 44.
- Radius: `--rad-sm` 6, `--rad-md` 10, `--rad-lg` 14, `--rad-xl` 18, `--rad-pill`.
- Shadows: `--shadow-1` (cards, buttons), `--shadow-2` (hover, raised), `--shadow-3` (dialogs, menus).
- Surfaces: `--paper-grad`, `--card-elevated`, `--nav-grad`, `--gold-foil`.
- Sizes: `--control-h` 36, `--control-h-sm` 28, `--modal-sm/md/lg` 420/560/760, `--page-max` 1680.
- Layers: `--z-sticky` 20, `--z-dropdown` 50, `--z-overlay` 1000, `--z-panel` 1200, `--z-modal` 9000, `--z-toast` 10000.
- Motion: `--ease`, `--m-fast` 120ms, `--m-base` 200ms, `--m-slow` 300ms.

## Themes

`wallStreet` (default: cream, navy, champagne gold), `onyx` (dark), `porcelain` (white, graphite, ochre),
`bordeaux` (wine, parchment, brass), `upsBrand` (brown, gold, tan). Font presets via `data-cxo-font`:
`editorial` (default, serif titles), `classic`, `modern`.
