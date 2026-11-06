## UI: TCS TwinX 3.0 UI

All screens in this repo use the TwinX UI library. Before writing or changing any HTML or CSS, read
`.claude/skills/twinx-ui/SKILL.md` (Claude Code) or `.agent/skills/twinx-ui/SKILL.md` (Antigravity) and follow it.

- Reuse components from `ui/twinx/registry.json` (`tx-` classes); start pages from `ui/twinx/patterns/`.
- Tokens only: no hex, `rgb()`, `white`, `black` or font names in CSS. Text on brand fills is `var(--c-on-brand)`.
- Never edit `ui/twinx/` (it is replaced on sync). New or customised components go in `ui/local/components/`
  (`node ui/twinx/cli/bin/twinx-ui.mjs new <name> [--extends <component>]`).
- Before finishing: `node ui/twinx/cli/bin/twinx-ui.mjs build` and `… lint` with 0 errors; check the five themes.
