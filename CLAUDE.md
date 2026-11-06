# TCS TwinX 3.0 UI (library repo)

This repo is the source of the TwinX UI library that project repos sync with `twinx-ui sync`.

- Components live in `ui/twinx/components/<name>/` (`<name>.css`, `<name>.html` with `<!-- @example: Title -->` blocks, `component.json`). Follow `skill/twinx-ui/SKILL.md` for the rules (tokens only, `tx-` names, one container per block).
- Never hand-edit generated files: `ui/twinx/twinx.css`, `ui/twinx/js/components.js`, `ui/twinx/registry.json`, `skill/twinx-ui/reference/components.md`, `catalog.html`, `ui/local/local.css`. Run `node bin/twinx-ui.mjs build`.
- Colours only in `ui/twinx/tokens/tokens.css`. Every theme must keep working: check `catalog.html` in all five.
- Before finishing: `npm run check` and `npm test` must pass.
- A change that renames or removes a class breaks project repos: keep the old class working or mark the component `deprecated` with the replacement named, and bump the minor version.
- Muthu approves new components by merging their pull request.
