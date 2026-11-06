#!/usr/bin/env node
// twinx-ui: the command line for TCS TwinX 3.0 UI.
//   twinx-ui sync                 copy the library, the skill and the agent rules into this repo
//   twinx-ui update [tag]         re-run sync from the library repo on GitHub (default: latest main)
//   twinx-ui build [--check]      regenerate css bundles, registries, components.md and the catalog
//   twinx-ui lint [files…]        check pages use tokens and library classes (exit 1 on errors)
//   twinx-ui new <name> [--extends <component>] [--title "…"]   scaffold a component in ui/local
//   twinx-ui contribute [names…] [--dry-run]                       open a pull request on the library repo
//   twinx-ui hook post-edit|stop  used by the Claude Code hooks in .claude/settings.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LIB_DIR, LOCAL_DIR, exists, read, write, writeIfChanged, copyDir, posix, readComponents, bundleCss, bundleJs, registry, componentsMd, manifest } from '../tools/lib.mjs';
import { catalogHtml } from '../tools/catalog.mjs';
import { lint, report } from '../tools/lint.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..');                 // the package (library repo, npx cache, or ui/twinx/cli in a consumer)
const ROOT = process.cwd();
const args = process.argv.slice(2);
const cmd = args.shift();
const flag = (n) => { const i = args.indexOf(n); if (i < 0) return false; const v = args[i + 1]; if (v && !v.startsWith('--')) { args.splice(i, 2); return v; } args.splice(i, 1); return true; };
const log = (...m) => console.log(...m);
const die = (m, code = 1) => { console.error('twinx-ui: ' + m); process.exit(code); };

const isLibraryRepo = (dir) => exists(path.join(dir, 'skill/twinx-ui/SKILL.md')) && exists(path.join(dir, LIB_DIR, 'tokens/tokens.css')) && exists(path.join(dir, 'bin/twinx-ui.mjs'));
const pkgJson = (dir) => exists(path.join(dir, 'package.json')) ? JSON.parse(read(path.join(dir, 'package.json'))) : {};
function libVersion(root) {
  if (isLibraryRepo(root)) return pkgJson(root).version || '0.0.0';
  const v = path.join(root, LIB_DIR, 'VERSION.json');
  return exists(v) ? JSON.parse(read(v)).version : '0.0.0';
}
function repoSlug(dir) {
  const r = pkgJson(dir).repository; const url = typeof r === 'string' ? r : r?.url || '';
  const m = url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/); return m ? m[1] : 'Muthukumar18121989/tcs-twinx-3.0-ui';
}

// ── build ────────────────────────────────────────────────────────────────
function patternsOf(root) {
  const dir = path.join(root, LIB_DIR, 'patterns');
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((f) => {
    const html = read(path.join(dir, f));
    return { title: (html.match(/<title>(.*?)<\/title>/i)?.[1] || f).replace(/^.*?—\s*/, ''), description: html.match(/<meta name="description" content="([^"]*)"/i)?.[1], file: path.join(dir, f), baseFor: root };
  });
}

function build({ root = ROOT, check = false, quiet = false } = {}) {
  const library = isLibraryRepo(root);
  const libDir = path.join(root, LIB_DIR), localDir = path.join(root, LOCAL_DIR);
  if (!exists(libDir)) die(`no ${LIB_DIR} folder here. Run twinx-ui sync first.`);
  const version = libVersion(root);
  const libComps = readComponents(libDir, 'library', root);
  const localComps = library ? [] : readComponents(localDir, 'local', root);
  const all = [...libComps, ...localComps];
  const out = {};
  const rel = (p) => path.join(root, p);
  if (library) {
    out[rel(`${LIB_DIR}/twinx.css`)] = bundleCss(libDir, libComps, { withFoundations: true });
    out[rel(`${LIB_DIR}/js/components.js`)] = bundleJs(libComps) || `/* no component scripts */\n`;
    out[rel(`${LIB_DIR}/registry.json`)] = registry(libComps, version);
    out[rel('skill/twinx-ui/reference/components.md')] = componentsMd(libComps, version);
    out[rel(`${LOCAL_DIR}/local.css`)] = `/* Placeholder so the page patterns load in the library repo. In a project repo this file holds its local components. */\n`;
    out[rel('catalog.html')] = catalogHtml({ comps: libComps, version, catalogFile: rel('catalog.html'), libDir: rel(LIB_DIR), localDir: rel(LOCAL_DIR), hasLocalCss: false, hasLocalJs: false, patterns: patternsOf(root), repoName: 'TCS TwinX 3.0 UI' });
  } else {
    const localCss = bundleCss(libDir, localComps, { withFoundations: false });
    const localJs = bundleJs(localComps);
    out[rel(`${LOCAL_DIR}/local.css`)] = localCss;
    if (localJs) out[rel(`${LOCAL_DIR}/local.js`)] = localJs;
    out[rel(`${LOCAL_DIR}/registry.json`)] = registry(localComps, version);
    const md = componentsMd(all, version);
    for (const s of ['.claude/skills/twinx-ui', '.agent/skills/twinx-ui']) if (exists(rel(s))) out[rel(`${s}/reference/components.md`)] = md;
    out[rel('ui/catalog.html')] = catalogHtml({ comps: all, version, catalogFile: rel('ui/catalog.html'), libDir: rel(LIB_DIR), localDir: rel(LOCAL_DIR), hasLocalCss: true, hasLocalJs: !!localJs, patterns: patternsOf(root), repoName: path.basename(root) });
  }
  const stale = [];
  for (const [f, s] of Object.entries(out)) {
    if (check) { if (!exists(f) || read(f) !== s) stale.push(posix(path.relative(root, f))); }
    else if (writeIfChanged(f, s) && !quiet) log('  wrote ' + posix(path.relative(root, f)));
  }
  if (check && stale.length) die(`generated files are out of date: ${stale.join(', ')}. Run twinx-ui build and commit.`);
  if (!quiet) log(`twinx-ui build: ${libComps.length} library + ${localComps.length} local component(s), v${version}`);
  return { libComps, localComps };
}

// ── sync (run in the consumer repo, from npx or from ui/twinx/cli) ─────────
const BLOCK_START = '<!-- twinx-ui:start -->', BLOCK_END = '<!-- twinx-ui:end -->';
function upsertBlock(file, body) {
  const block = `${BLOCK_START}\n${body.trim()}\n${BLOCK_END}`;
  let s = exists(file) ? read(file) : '';
  const re = new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`);
  s = re.test(s) ? s.replace(re, block) : (s.trim() ? s.trimEnd() + '\n\n' : '') + block + '\n';
  write(file, s);
}
function mergeHooks(file) {
  const cmdBase = `node ${LIB_DIR}/cli/bin/twinx-ui.mjs hook`;
  let cfg = {};
  if (exists(file)) { try { cfg = JSON.parse(read(file)); } catch { die(`${file} is not valid JSON; fix it and run sync again.`); } }
  cfg.hooks ||= {};
  const want = { PostToolUse: { matcher: 'Edit|MultiEdit|Write', command: `${cmdBase} post-edit` }, Stop: { command: `${cmdBase} stop` } };
  for (const [ev, h] of Object.entries(want)) {
    cfg.hooks[ev] = (cfg.hooks[ev] || []).filter((g) => !(g.hooks || []).some((x) => (x.command || '').includes('twinx-ui.mjs hook')));
    cfg.hooks[ev].push({ ...(h.matcher ? { matcher: h.matcher } : {}), hooks: [{ type: 'command', command: h.command, timeout: 30 }] });
  }
  write(file, JSON.stringify(cfg, null, 2) + '\n');
}

function sync() {
  const dest = path.resolve(flag('--dest') || ROOT);
  const noCi = flag('--no-ci');
  if (isLibraryRepo(dest)) die('this is the library repo itself; run sync inside a project repo.');
  const src = isLibraryRepo(PKG) ? PKG : null;
  if (!src) die('run sync from the library package: npx github:' + repoSlug(PKG) + ' sync  (or: twinx-ui update)');
  const version = pkgJson(src).version;
  const libDest = path.join(dest, LIB_DIR);
  // 1. the library (replaced whole), plus the command line inside it
  fs.rmSync(libDest, { recursive: true, force: true });
  copyDir(path.join(src, LIB_DIR), libDest);
  for (const d of ['bin', 'tools']) copyDir(path.join(src, d), path.join(libDest, 'cli', d));
  write(path.join(libDest, 'cli/package.json'), JSON.stringify({ name: 'twinx-ui-cli', private: true, type: 'module', repository: pkgJson(src).repository }, null, 2) + '\n');
  write(path.join(libDest, 'VERSION.json'), JSON.stringify({ name: 'TCS TwinX 3.0 UI', version, repository: `https://github.com/${repoSlug(src)}`, syncedAt: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  write(path.join(libDest, 'README.md'), `# TCS TwinX 3.0 UI v${version} (synced copy)\n\nDo not edit files in this folder: \`twinx-ui sync\` replaces it, and the lint flags hand edits.\nPut your own or customised components in \`${LOCAL_DIR}/components/\` (\`node ${LIB_DIR}/cli/bin/twinx-ui.mjs new <name>\`), then send them back with \`twinx-ui contribute\`.\n\nCatalog: open \`ui/catalog.html\` (serve the repo with any static server).\n`);
  // 2. local components folder
  fs.mkdirSync(path.join(dest, LOCAL_DIR, 'components'), { recursive: true });
  if (!exists(path.join(dest, LOCAL_DIR, 'README.md'))) write(path.join(dest, LOCAL_DIR, 'README.md'), read(path.join(src, 'templates/local-README.md')));
  // 3. skill for Claude Code and Antigravity, rules for both, hooks for Claude Code
  for (const s of ['.claude/skills/twinx-ui', '.agent/skills/twinx-ui']) { fs.rmSync(path.join(dest, s), { recursive: true, force: true }); copyDir(path.join(src, 'skill/twinx-ui'), path.join(dest, s)); }
  write(path.join(dest, '.agent/rules/twinx-ui.md'), read(path.join(src, 'templates/agent-rules.md')));
  const block = read(path.join(src, 'templates/agents-block.md'));
  upsertBlock(path.join(dest, 'AGENTS.md'), block);
  upsertBlock(path.join(dest, 'CLAUDE.md'), block);
  mergeHooks(path.join(dest, '.claude/settings.json'));
  if (!noCi) write(path.join(dest, '.github/workflows/twinx-ui.yml'), read(path.join(src, 'templates/twinx-ui-check.yml')));
  if (!exists(path.join(dest, '.twinxignore'))) write(path.join(dest, '.twinxignore'), read(path.join(src, 'templates/twinxignore')));
  // 4. regenerate local bundles, catalog and components.md, then record the manifest
  build({ root: dest, quiet: true });
  write(path.join(libDest, '.manifest.json'), JSON.stringify({ version, files: manifest(libDest) }, null, 2) + '\n');
  const local = readComponents(path.join(dest, LOCAL_DIR), 'local');
  const libNames = new Set(readComponents(libDest, 'library').map((c) => c.name));
  log(`TCS TwinX 3.0 UI v${version} synced into ${dest}`);
  log(`  ${LIB_DIR}/            library (do not edit)\n  ${LOCAL_DIR}/            your components (${local.length})\n  ui/catalog.html        live catalog\n  .claude/skills/twinx-ui, .agent/skills/twinx-ui, .agent/rules/twinx-ui.md, AGENTS.md, CLAUDE.md\n  .claude/settings.json  lint hooks${noCi ? '' : '\n  .github/workflows/twinx-ui.yml  pull request check'}`);
  for (const c of local) if (!c.meta.extends && libNames.has(c.name)) log(`  note: ${LOCAL_DIR}/components/${c.name} now exists in the library. Compare them and delete your local copy.`);
  log(`\nLink in every page: ${LIB_DIR}/twinx.css, ${LOCAL_DIR}/local.css, and at the end of <body> ${LIB_DIR}/js/twinx.js`);
}

function update() {
  const ref = args[0] || 'main';
  const v = exists(path.join(ROOT, LIB_DIR, 'VERSION.json')) ? JSON.parse(read(path.join(ROOT, LIB_DIR, 'VERSION.json'))) : {};
  const slug = (v.repository || '').replace(/^https:\/\/github\.com\//, '') || repoSlug(PKG);
  log(`Updating from github:${slug}#${ref} …`);
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', `github:${slug}#${ref}`, 'sync', ...args.slice(1)], { stdio: 'inherit', cwd: ROOT, shell: process.platform === 'win32' });
}

// ── new ──────────────────────────────────────────────────────────────────
function scaffold() {
  const ext = flag('--extends'), title = flag('--title'), category = flag('--category') || 'Other';
  const inLibrary = isLibraryRepo(ROOT);
  const name = args[0];
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) die('usage: twinx-ui new <kebab-name> [--extends <component>] [--title "Readable name"]');
  const base = path.join(ROOT, inLibrary ? LIB_DIR : LOCAL_DIR, 'components', name);
  if (exists(base)) die(`${posix(path.relative(ROOT, base))} already exists.`);
  if (ext && !readComponents(path.join(ROOT, LIB_DIR), 'library').some((c) => c.name === ext)) die(`"${ext}" is not a library component. See ${LIB_DIR}/registry.json.`);
  const cls = ext ? `tx-${ext}--${name.replace(new RegExp('^' + ext + '-?'), '') || 'custom'}` : `tx-${name}`;
  const meta = {
    name, title: title || (ext ? `${ext} variant: ${name}` : name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())),
    category: ext ? readComponents(path.join(ROOT, LIB_DIR), 'library').find((c) => c.name === ext).meta.category : category,
    status: inLibrary ? 'stable' : 'experimental', ...(ext ? { extends: ext } : {}),
    description: 'TODO: one sentence on what it is.', whenToUse: 'TODO: when to use it, and when to use something else.',
    variants: [{ class: cls, description: 'TODO' }], a11y: 'TODO: roles, labels, keyboard.', owner: process.env.USER || '', since: libVersion(ROOT),
  };
  write(path.join(base, 'component.json'), JSON.stringify(meta, null, 2) + '\n');
  write(path.join(base, `${name}.css`), `/* ${meta.title}. Tokens only: var(--c-*), var(--s-*), var(--rad-*), var(--shadow-*), var(--font) …\n   ${ext ? `Adds the modifier .${cls} to the library's ${ext} component; keep the base .tx-${ext} rules untouched.` : `Prefix every class with tx-${name}.`} */\n.${cls} {\n}\n`);
  write(path.join(base, `${name}.html`), `<!-- @example: Default -->\n${ext ? `<!-- copy the base markup from ${LIB_DIR}/components/${ext}/${ext}.html and add ${cls} -->\n` : ''}<div class="${cls}"></div>\n`);
  log(`Created ${posix(path.relative(ROOT, base))}/ (component.json, ${name}.css, ${name}.html). Fill in the TODOs, then run twinx-ui build.`);
}

// ── contribute: open a pull request on the library repo with ui/local components ──
function sh(cmdName, a, opts = {}) { return execFileSync(cmdName, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim(); }
function contribute() {
  const dry = flag('--dry-run');
  const v = exists(path.join(ROOT, LIB_DIR, 'VERSION.json')) ? JSON.parse(read(path.join(ROOT, LIB_DIR, 'VERSION.json'))) : die('run twinx-ui sync first.');
  const slug = v.repository.replace(/^https:\/\/github\.com\//, '');
  let local = readComponents(path.join(ROOT, LOCAL_DIR), 'local');
  if (args.length) local = local.filter((c) => args.includes(c.name));
  if (!local.length) die(`no components in ${LOCAL_DIR}/components${args.length ? ' named ' + args.join(', ') : ''}.`);
  const bad = local.filter((c) => c.problems.length || /TODO/.test(JSON.stringify(c.meta)));
  if (bad.length) die(`finish these before contributing (no TODOs, all files present): ${bad.map((c) => c.name + (c.problems.length ? ' (' + c.problems.join('; ') + ')' : ' (TODO left in component.json)')).join(', ')}`);
  const problems = lint({ root: ROOT, files: local.flatMap((c) => fs.readdirSync(c.dir).map((f) => path.join(c.dir, f))) }).filter((p) => p.level === 'error');
  if (problems.length) die('lint errors in the components:\n' + report(problems).text);
  try { sh('gh', ['--version']); } catch { die('the GitHub CLI (gh) is needed: https://cli.github.com, then gh auth login.'); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'twinx-contrib-'));
  log(`Cloning ${slug} …`);
  sh('gh', ['repo', 'clone', slug, tmp, '--', '--depth', '1']);
  const branch = `contrib/${path.basename(ROOT).toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${local.map((c) => c.name).join('-').slice(0, 40)}-${Date.now().toString(36)}`;
  sh('git', ['checkout', '-b', branch], { cwd: tmp });
  const lines = [];
  for (const c of local) {
    if (c.meta.extends) {
      const t = path.join(tmp, LIB_DIR, 'components', c.meta.extends);
      const tm = JSON.parse(read(path.join(t, 'component.json')));
      tm.variants = [...(tm.variants || []), ...(c.meta.variants || []).filter((nv) => !(tm.variants || []).some((ov) => ov.class === nv.class))];
      write(path.join(t, 'component.json'), JSON.stringify(tm, null, 2) + '\n');
      fs.appendFileSync(path.join(t, `${c.meta.extends}.css`), `\n/* ── ${c.name} (contributed from ${path.basename(ROOT)}) ── */\n${c.css.trim()}\n`);
      fs.appendFileSync(path.join(t, `${c.meta.extends}.html`), '\n' + c.examples.map((e) => `<!-- @example: ${e.title} -->\n${e.html}\n`).join('\n'));
      lines.push(`- **${c.meta.title}**: new variant(s) ${(c.meta.variants || []).map((x) => '`' + x.class + '`').join(', ')} on \`${c.meta.extends}\``);
    } else {
      const t = path.join(tmp, LIB_DIR, 'components', c.name);
      if (exists(t)) die(`the library already has a component named "${c.name}". Rename yours, or make it a variant with --extends ${c.name}.`);
      copyDir(c.dir, t);
      const m = JSON.parse(read(path.join(t, 'component.json'))); m.status = 'stable'; m.contributedFrom = path.basename(ROOT);
      write(path.join(t, 'component.json'), JSON.stringify(m, null, 2) + '\n');
      lines.push(`- **${c.meta.title}** (\`${c.name}\`, ${c.meta.category}): ${c.meta.description}`);
    }
  }
  execFileSync(process.execPath, [path.join(tmp, 'bin/twinx-ui.mjs'), 'build', '--quiet'], { cwd: tmp, stdio: 'inherit' });
  const libLint = lint({ root: tmp, mode: 'library' }).filter((p) => p.level === 'error');
  if (libLint.length) die('the merged library does not pass lint:\n' + report(libLint).text);
  sh('git', ['add', '-A'], { cwd: tmp });
  sh('git', ['-c', 'user.name=' + (process.env.GIT_AUTHOR_NAME || sh('git', ['config', 'user.name'], { cwd: ROOT }) || 'twinx-ui'), '-c', 'user.email=' + (process.env.GIT_AUTHOR_EMAIL || sh('git', ['config', 'user.email'], { cwd: ROOT }) || 'twinx-ui@users.noreply.github.com'), 'commit', '-m', `Add ${local.map((c) => c.name).join(', ')} from ${path.basename(ROOT)}`], { cwd: tmp });
  const body = `Components contributed from \`${path.basename(ROOT)}\` with \`twinx-ui contribute\`.\n\n${lines.join('\n')}\n\nReview checklist:\n- [ ] Looks right in all five themes (open catalog.html)\n- [ ] Not a near-duplicate of an existing component or variant\n- [ ] Names follow tx-<component>[--variant]\n- [ ] component.json is complete (when to use, accessibility)\n`;
  if (dry) { log(`Dry run: branch ${branch} prepared in ${tmp}\n\n${body}`); return; }
  try { sh('git', ['push', '-u', 'origin', branch], { cwd: tmp }); }
  catch { log('No push access to the library repo; pushing to your fork instead.'); sh('gh', ['repo', 'fork', '--remote', '--remote-name', 'fork'], { cwd: tmp }); sh('git', ['push', '-u', 'fork', branch], { cwd: tmp }); }
  const url = sh('gh', ['pr', 'create', '--repo', slug, '--head', branch, '--title', `Add ${local.map((c) => c.meta.title).join(', ')}`, '--body', body], { cwd: tmp });
  for (const c of local) { const f = path.join(c.dir, 'component.json'); const m = JSON.parse(read(f)); m.contributed = url; write(f, JSON.stringify(m, null, 2) + '\n'); }
  log(`Pull request opened: ${url}\nOnce it is merged, run twinx-ui update and delete the local copies.`);
}

// ── Claude Code hooks ─────────────────────────────────────────────────────
function hook() {
  const kind = args[0];
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no stdin */ }
  const root = input.cwd || ROOT;
  if (kind === 'post-edit') {
    const f = input.tool_input?.file_path || input.tool_input?.path;
    if (!f || !/\.(css|scss|less|html?|vue|jsx|tsx|svelte|astro|json)$/i.test(f)) return;
    const rel = posix(path.relative(root, path.resolve(root, f)));
    if (rel.startsWith(LOCAL_DIR + '/components/')) { try { build({ root, quiet: true }); } catch { /* reported on stop */ } }
    const problems = lint({ root, files: [f], mode: isLibraryRepo(root) ? 'library' : 'consumer' }).filter((p) => p.level === 'error' || rel.startsWith(LIB_DIR + '/'));
    if (problems.length) { console.error(`TwinX UI rules (see .claude/skills/twinx-ui/SKILL.md):\n${report(problems).text}`); process.exit(2); }
  } else if (kind === 'stop') {
    try { build({ root, quiet: true }); } catch (e) { console.error(String(e.message || e)); }
    if (input.stop_hook_active) return;
    let changed = [];
    try { changed = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).split('\n').map((l) => l.slice(3).trim().replace(/^"|"$/g, '')).filter(Boolean).map((l) => l.includes(' -> ') ? l.split(' -> ')[1] : l); } catch { return; }
    const files = changed.filter((f) => exists(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile());
    if (!files.length) return;
    const problems = lint({ root, files, mode: isLibraryRepo(root) ? 'library' : 'consumer' }).filter((p) => p.level === 'error');
    if (problems.length) { console.error(`Before finishing, fix these TwinX UI problems in the files you changed:\n${report(problems).text}`); process.exit(2); }
  }
}

// ── main ─────────────────────────────────────────────────────────────────
switch (cmd) {
  case 'sync': sync(); break;
  case 'update': update(); break;
  case 'build': build({ check: !!flag('--check'), quiet: !!flag('--quiet') }); break;
  case 'lint': {
    const mode = isLibraryRepo(ROOT) ? 'library' : 'consumer';
    const changed = flag('--changed');
    let files = args.length ? args : null;
    if (changed) {
      const base = typeof changed === 'string' ? changed : 'origin/main';
      try { files = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); }
      catch { die(`could not diff against ${base}`); }
    }
    const r = report(lint({ root: ROOT, files, mode }));
    log(r.text); process.exit(r.errors ? 1 : 0);
  }
  case 'new': scaffold(); break;
  case 'contribute': contribute(); break;
  case 'hook': hook(); break;
  case 'version': case '--version': log(libVersion(ROOT === PKG ? PKG : ROOT)); break;
  default:
    log(read(fileURLToPath(import.meta.url)).split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    if (cmd && cmd !== 'help') process.exit(1);
}
