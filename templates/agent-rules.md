---
trigger: always_on
description: TCS TwinX 3.0 UI rules for every UI change
---

# TCS TwinX 3.0 UI

This workspace uses the TwinX UI library. For any HTML, CSS, layout, styling or new screen:

1. Read `.agent/skills/twinx-ui/SKILL.md` and follow its workflow.
2. Reuse components listed in `ui/twinx/registry.json` (classes start with `tx-`). Copy markup from
   `ui/twinx/components/<name>/<name>.html`. Start new pages from `ui/twinx/patterns/`.
3. Tokens only (`var(--c-*)`, `var(--s-*)`, `var(--rad-*)`, `var(--font)`). No hex, rgb(), white, black or font names.
4. Never edit `ui/twinx/`. New components and variants go in `ui/local/components/<name>/`
   (`node ui/twinx/cli/bin/twinx-ui.mjs new <name> [--extends <component>]`).
5. Before finishing run `node ui/twinx/cli/bin/twinx-ui.mjs build` and `node ui/twinx/cli/bin/twinx-ui.mjs lint`
   (0 errors), and check the page in the theme menu (eleven themes, two of them dark).
6. Chart and series colours are `var(--chart-1…8)` (SVG/CSS) or `TwinX.chartColors(n)` (canvas charts), never
   fixed colours. Only one primary (filled) button per view; row actions are `tx-btn--sm`.
7. To review or fix an existing page, follow `.agent/skills/twinx-ui-audit/SKILL.md`.
8. List any new local component in your summary and suggest `twinx-ui contribute <name>`.
