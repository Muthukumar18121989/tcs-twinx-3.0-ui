# TCS TwinX 3.0 UI

One design system and component library for every TwinX screen, built from the CXO design system (the same
tokens, five colour themes and patterns as the Stellantis Promotool redesign). It ships with a skill for
**Claude Code** and **Antigravity**, so BAs and UX designers who vibe code get the same components and styles,
and anything new they make can come back into the library.

- **Tokens and themes**: `ui/twinx/tokens/` (Wall Street, Onyx dark, Porcelain, Bordeaux, UPS Shield).
- **19 components** with the `tx-` prefix: `ui/twinx/components/<name>/` (CSS, markup examples, `component.json`).
- **Page patterns**: `ui/twinx/patterns/` (page, list, form, detail).
- **One stylesheet and one script**: `ui/twinx/twinx.css`, `ui/twinx/js/twinx.js`. Plain HTML, CSS and JS, no build step.
- **Catalog**: `catalog.html`, every component live in every theme with copy-markup buttons.
- **Skill and rules**: `skill/twinx-ui/` (copied to `.claude/skills/` and `.agent/skills/` in each project).
- **The `twinx-ui` command**: sync, update, build, lint, new, contribute, and the Claude Code hooks.

## For BAs and UX designers: use it in your repo

You need Node 18+, git access to this repo, and (to contribute) the GitHub CLI `gh`.

On Windows, install [Git](https://git-scm.com/download/win) and [Node.js LTS](https://nodejs.org) first (or `winget install --id Git.Git -e` and `winget install --id OpenJS.NodeJS.LTS -e`), reopen the terminal, and run commands one per line: Windows PowerShell 5 does not accept `&&`. To view the catalog use `npx serve .` and open `/ui/catalog.html`.

```sh
# in the root of your own repo
npx github:Muthukumar18121989/tcs-twinx-3.0-ui#v1.0.1 sync
```

That adds:

| Path | What it is |
| --- | --- |
| `ui/twinx/` | The library. Do not edit; sync replaces it. |
| `ui/local/` | Your own and customised components |
| `ui/catalog.html` | Catalog of library + local components |
| `.claude/skills/twinx-ui/`, `.agent/skills/twinx-ui/` | The skill for Claude Code and Antigravity |
| `.agent/rules/twinx-ui.md`, `AGENTS.md`, `CLAUDE.md` | Always-on rules pointing both tools at the skill |
| `.claude/settings.json` | Hooks: lint after each edit, rebuild and check before Claude finishes |
| `.github/workflows/twinx-ui.yml` | Pull request check (works for work from either tool) |

Then just ask Claude or Antigravity for screens. The skill makes them start from a pattern, reuse `tx-`
components and tokens, and put anything new in `ui/local/components/`.

Commands (run from your repo root; `tx` = `node ui/twinx/cli/bin/twinx-ui.mjs`):

| Command | What it does |
| --- | --- |
| `tx new <name>` | Scaffold a new local component |
| `tx new <name> --extends button` | Scaffold a variant of a library component (adds a modifier class) |
| `tx build` | Rebuild `ui/local/local.css`, the registries and `ui/catalog.html` |
| `tx lint` | Tokens only, no invented `tx-` classes, no restyling of library classes, no edits in `ui/twinx` |
| `tx contribute <name>` | Open a pull request on this repo with your component |
| `tx update v1.1.0` | Pull a newer library version |

Pages link `ui/twinx/twinx.css`, then `ui/local/local.css`, and load `ui/twinx/js/twinx.js` at the end of
`<body>`. Copy `ui/twinx/patterns/page-template.html` to start.

Legacy folders that are not on the library yet can be listed in `.twinxignore` so the lint skips them.

## How new components come back

```
designer asks for a screen ─▶ skill reads the registry ─▶ fits? ── yes ─▶ reuse tx- markup
                                                         └─ no ─▶ tx new … in ui/local ─▶ hooks lint + rebuild
tx contribute <name> ─▶ pull request here ─▶ Muthu reviews in all themes and merges ─▶ next tag ─▶ tx update everywhere
```

`contribute` clones this repo, adds the component (or merges a variant into the component it extends), rebuilds
the catalog and registry, checks the result with the lint, and opens the pull request. People without push access
get a fork automatically.

## For the library owner

- **Review**: open `catalog.html` from the pull request branch (`npm run catalog`, then http://localhost:8000/catalog.html), switch themes, check widths 1440 to 390.
- **Release**: bump `version` in `package.json`, run `npm run build`, commit, then tag: `git tag v1.1.0 && git push --tags`. Projects update with `tx update v1.1.0`.
- **Checks**: `npm run check` (generated files up to date + lint) and `npm test` (syncs into a throwaway project and proves every rule). CI runs both on every pull request.
- **Generated files** (do not edit by hand): `ui/twinx/twinx.css`, `ui/twinx/js/components.js`, `ui/twinx/registry.json`, `skill/twinx-ui/reference/components.md`, `catalog.html`.

## Repo layout

```
ui/twinx/            the package that projects receive
  tokens/            tokens.css (5 themes), fonts.css, fonts/
  base.css           reset, focus ring, scrollbars
  components/<name>/ <name>.css, <name>.html (examples), component.json, optional <name>.js
  patterns/          page templates
  js/twinx.js        shell, theme menu, tabs, dialogs, toasts
  twinx.css, registry.json, js/components.js   generated
skill/twinx-ui/      SKILL.md + reference/ (tokens, patterns, contributing, components)
templates/           files sync writes into projects (rules, AGENTS block, CI workflow, ignore list)
bin/twinx-ui.mjs     the command
tools/               build, catalog, lint and test code
catalog.html         generated catalog
```
