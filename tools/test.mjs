// End-to-end check: sync the library into a throwaway project, then prove the rules hold.
// Run from the library repo: node tools/test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(LIB, 'bin/twinx-ui.mjs');
const keep = process.argv.includes('--keep');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twinx-sample-'));
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'}  ${msg}`); if (!cond) failed++; };
const run = (cli, a, input) => spawnSync(process.execPath, [cli, ...a], { cwd: dir, encoding: 'utf8', input });
const local = () => path.join(dir, 'ui/twinx/cli/bin/twinx-ui.mjs');

execFileSync('git', ['init', '-q'], { cwd: dir });
fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Sample project\n\nExisting notes stay.\n');
let r = run(CLI, ['sync']);
ok(r.status === 0, 'sync runs' + (r.status ? ': ' + r.stderr : ''));
for (const f of ['ui/twinx/twinx.css', 'ui/twinx/js/twinx.js', 'ui/twinx/registry.json', 'ui/twinx/.manifest.json', 'ui/twinx/cli/bin/twinx-ui.mjs', 'ui/local/local.css', 'ui/local/registry.json', 'ui/catalog.html', '.claude/skills/twinx-ui/SKILL.md', '.claude/skills/twinx-ui/reference/components.md', '.agent/skills/twinx-ui/SKILL.md', '.agent/rules/twinx-ui.md', '.claude/settings.json', '.github/workflows/twinx-ui.yml', '.twinxignore', 'CLAUDE.md'])
  ok(fs.existsSync(path.join(dir, f)), `sync wrote ${f}`);
ok(JSON.parse(fs.readFileSync(path.join(dir, 'ui/twinx/VERSION.json'), 'utf8')).repository === 'https://github.com/Muthukumar18121989/tcs-twinx-3.0-ui', 'VERSION.json records the full library repo URL (used by update and contribute)');
const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
ok(agents.includes('Existing notes stay.') && agents.includes('twinx-ui:start'), 'AGENTS.md keeps existing text and gains the TwinX block');
r = run(CLI, ['sync']);
ok((fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').match(/twinx-ui:start/g) || []).length === 1, 'a second sync does not duplicate the AGENTS.md block');
const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude/settings.json'), 'utf8'));
ok(settings.hooks.PostToolUse.length === 1 && settings.hooks.Stop.length === 1, 'a second sync does not duplicate hooks');

for (const f of fs.readdirSync(path.join(dir, 'ui/twinx/patterns'))) fs.copyFileSync(path.join(dir, 'ui/twinx/patterns', f), path.join(dir, f));
r = run(local(), ['lint']);
ok(r.status === 0, 'pages copied from the patterns pass lint' + (r.status ? '\n' + r.stdout : ''));
r = run(local(), ['build', '--check']);
ok(r.status === 0, 'generated files are up to date after sync');

// rule: colour literals and invented classes in a page
fs.writeFileSync(path.join(dir, 'bad.html'), '<style>.box{color:#fff;background:rgba(0,0,0,.2)}</style><div class="tx-card tx-fancy-panel" style="border-color: white"></div>');
r = run(local(), ['lint', 'bad.html']);
ok(r.status === 1 && /color-literal/.test(r.stdout) && /tx-fancy-panel/.test(r.stdout), 'lint catches colour literals and unknown tx- classes');
// rule: restyling a library class in page CSS
fs.writeFileSync(path.join(dir, 'page.css'), '.tx-btn--primary { border-radius: 0; }\n.grid { display: grid; gap: var(--s-lg); }\n');
r = run(local(), ['lint', 'page.css']);
ok(r.status === 1 && /restyle/.test(r.stdout), 'lint catches page CSS that restyles a tx- class');
// rule: hand edit inside the library
fs.appendFileSync(path.join(dir, 'ui/twinx/components/button/button.css'), '\n.tx-btn { border-radius: 0; }\n');
r = run(local(), ['lint']);
ok(r.status === 1 && /library-edit/.test(r.stdout), 'lint catches hand edits inside ui/twinx');
// hook: post-edit returns 2 with the reason, so Claude Code shows it to Claude
r = run(local(), ['hook', 'post-edit'], JSON.stringify({ cwd: dir, tool_input: { file_path: path.join(dir, 'bad.html') } }));
ok(r.status === 2 && /TwinX UI rules/.test(r.stderr), 'post-edit hook blocks with an explanation');
r = run(local(), ['hook', 'post-edit'], JSON.stringify({ cwd: dir, tool_input: { file_path: path.join(dir, 'list-page.html') } }));
ok(r.status === 0, 'post-edit hook is silent for a clean page');
fs.rmSync(path.join(dir, 'bad.html')); fs.rmSync(path.join(dir, 'page.css'));
r = run(CLI, ['sync']);
ok(run(local(), ['lint']).status === 0, 'sync restores the library and lint is clean again');

// new local component and a variant of a library component
r = run(local(), ['new', 'timeline', '--title', 'Timeline', '--category', 'Data display']);
ok(r.status === 0 && fs.existsSync(path.join(dir, 'ui/local/components/timeline/component.json')), 'new scaffolds a local component');
r = run(local(), ['new', 'button-success', '--extends', 'button']);
ok(r.status === 0, 'new --extends scaffolds a variant');
fs.writeFileSync(path.join(dir, 'ui/local/components/button-success/button-success.css'), '.tx-btn--success { background: var(--c-green); border-color: var(--c-green); color: var(--c-on-brand); }\n');
fs.writeFileSync(path.join(dir, 'ui/local/components/button-success/button-success.html'), '<!-- @example: Success -->\n<button type="button" class="tx-btn tx-btn--success">Approve</button>\n');
r = run(local(), ['build']);
const css = fs.readFileSync(path.join(dir, 'ui/local/local.css'), 'utf8');
ok(r.status === 0 && css.includes('.tx-btn--success'), 'build bundles local components into ui/local/local.css');
ok(fs.readFileSync(path.join(dir, 'ui/catalog.html'), 'utf8').includes('local-button-success'), 'the local variant appears in ui/catalog.html');
ok(fs.readFileSync(path.join(dir, '.claude/skills/twinx-ui/reference/components.md'), 'utf8').includes('button-success'), 'the skill reference lists the local variant');
fs.writeFileSync(path.join(dir, 'use.html'), '<button class="tx-btn tx-btn--success">Approve</button>');
ok(run(local(), ['lint', 'use.html']).status === 0, 'pages may use classes from local components');
r = run(local(), ['contribute', 'timeline', '--dry-run']);
ok(r.status === 1 && /TODO/.test(r.stderr), 'contribute refuses a component with TODOs left');

console.log(`\n${failed ? failed + ' check(s) failed' : 'all checks passed'}${keep ? `\nsample project kept at ${dir}` : ''}`);
if (!keep) fs.rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
