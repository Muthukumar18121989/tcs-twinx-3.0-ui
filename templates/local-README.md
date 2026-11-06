# ui/local: this repo's own TwinX components

Components here are used by this repo's pages and are not yet in the TwinX library.

- Create one: `node ui/twinx/cli/bin/twinx-ui.mjs new <name>` or `… new <name> --extends <library component>`
- Rebuild `local.css`, the registry and `ui/catalog.html`: `node ui/twinx/cli/bin/twinx-ui.mjs build`
- Send it to the library for review: `node ui/twinx/cli/bin/twinx-ui.mjs contribute <name>`

`local.css`, `local.js` and `registry.json` in this folder are generated. Edit the component folders instead.
