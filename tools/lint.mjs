// twinx-ui lint: keeps pages on the library.
//   1. no colour literals (hex, rgb, hsl, named white/black) outside the token file
//   2. no font-family names outside the token files (use var(--font) / var(--disp) / var(--title))
//   3. no restyling of .tx-* classes outside the library and ui/local (add a variant instead)
//   4. no tx-* class in markup that no component defines (do not invent names)
//   5. no hand edits inside ui/twinx (it is replaced on every sync)
//   6. every local component folder is complete (component.json, css, html examples)
import fs from 'node:fs';
import path from 'node:path';
import { LIB_DIR, LOCAL_DIR, exists, read, walk, posix, readComponents, manifest } from './lib.mjs';

const CSS_EXT = new Set(['.css', '.scss', '.less']);
const MARKUP_EXT = new Set(['.html', '.htm', '.vue', '.jsx', '.tsx', '.svelte', '.astro']);
const ALWAYS_SKIP = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', 'coverage/', 'vendor/'];
const COLOR_PROPS = /^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|column-rule(-color)?|text-decoration(-color)?)$/i;
const LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\s*\(|(?<![-\w])(white|black)(?![-\w])/i;

function ignoreList(root) {
  const f = path.join(root, '.twinxignore');
  if (!exists(f)) return [];
  return read(f).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.replace(/\*+$/, ''));
}

const stripDataUris = (s) => s.replace(/url\(\s*(["'])data:.*?\1\s*\)/gis, 'url()').replace(/url\(\s*data:[^)]*\)/gi, 'url()');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

function cssDeclarations(text) {
  // yields {prop, value, index} for every declaration, ignoring comments and data URIs
  const clean = stripDataUris(text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')));
  const out = [];
  const re = /([a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/gi;
  let m;
  while ((m = re.exec(clean))) out.push({ prop: m[1], value: m[2], index: m.index });
  return out;
}

export function lint({ root = process.cwd(), files = null, mode = 'consumer' } = {}) {
  const problems = [];
  const add = (file, line, rule, message, level = 'error') => problems.push({ file: posix(path.relative(root, file)), line, rule, message, level });
  const libDir = path.join(root, LIB_DIR), localDir = path.join(root, LOCAL_DIR);
  const libComps = readComponents(libDir, 'library', root);
  const localComps = mode === 'consumer' ? readComponents(localDir, 'local', root) : [];
  const known = new Set([...libComps, ...localComps].flatMap((c) => c.classes));
  const ignores = ignoreList(root);
  const inLib = (rel) => rel.startsWith(LIB_DIR + '/');
  const inLocal = (rel) => rel.startsWith(LOCAL_DIR + '/');
  const isTokens = (rel) => rel.startsWith(LIB_DIR + '/tokens/');
  const generated = new Set([LIB_DIR + '/twinx.css', LOCAL_DIR + '/local.css', LOCAL_DIR + '/local.js', 'ui/catalog.html', 'catalog.html', LIB_DIR + '/js/components.js']);

  // 5. hand edits in the synced library
  if (mode === 'consumer' && exists(path.join(libDir, '.manifest.json'))) {
    const want = JSON.parse(read(path.join(libDir, '.manifest.json'))).files || {};
    const have = manifest(libDir);
    for (const [f, h] of Object.entries(have)) {
      if (!files || files.some((x) => posix(path.relative(root, path.resolve(root, x))) === `${LIB_DIR}/${f}`)) {
        if (!(f in want)) add(path.join(libDir, f), 1, 'library-edit', `New file inside ${LIB_DIR}. The library folder is replaced on every sync: put your own components in ${LOCAL_DIR}/components/<name>/ (twinx-ui new <name>).`);
        else if (want[f] !== h) add(path.join(libDir, f), 1, 'library-edit', `This file was changed by hand. ${LIB_DIR} is replaced on every sync, so the change would be lost. Move it to ${LOCAL_DIR}/components (a variant: twinx-ui new <name> --extends <component>) and restore the file with twinx-ui sync.`);
      }
    }
  }

  // 6. local components complete
  for (const c of localComps) for (const p of c.problems) add(path.join(c.dir, 'component.json'), 1, 'local-component', `${c.name}: ${p}`);
  if (mode === 'library') for (const c of libComps) for (const p of c.problems) add(path.join(c.dir, 'component.json'), 1, 'component', `${c.name}: ${p}`);
  for (const c of localComps) if (c.meta.extends && !libComps.some((l) => l.name === c.meta.extends)) add(path.join(c.dir, 'component.json'), 1, 'local-component', `${c.name} extends "${c.meta.extends}", which is not a library component.`);

  const list = (files ? files.map((f) => path.resolve(root, f)) : walk(root, { skip: ALWAYS_SKIP }))
    .filter((f) => exists(f) && fs.statSync(f).isFile());

  for (const file of list) {
    const rel = posix(path.relative(root, file));
    if (rel.startsWith('..') || ALWAYS_SKIP.some((s) => rel.includes(s))) continue;
    if (ignores.some((ig) => rel.startsWith(ig) || rel === ig)) continue;
    if (generated.has(rel)) continue;
    if (mode === 'consumer' && inLib(rel)) continue; // covered by the manifest check
    const ext = path.extname(file).toLowerCase();
    if (!CSS_EXT.has(ext) && !MARKUP_EXT.has(ext)) continue;
    const text = read(file);

    // CSS: in .css files and in <style> blocks
    const blocks = CSS_EXT.has(ext) ? [{ css: text, offset: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => ({ css: m[1], offset: m.index + m[0].indexOf(m[1]) }));
    for (const { css, offset } of blocks) {
      if (!isTokens(rel)) {
        for (const d of cssDeclarations(css)) {
          if (d.prop.startsWith('--')) { if (LITERAL.test(d.value)) add(file, lineOf(text, offset + d.index), 'color-literal', `Custom property ${d.prop} is set to a colour literal (${d.value.trim()}). Colours live in ${LIB_DIR}/tokens/tokens.css: use var(--c-*) or color-mix() of tokens.`); continue; }
          if (COLOR_PROPS.test(d.prop) && LITERAL.test(d.value)) add(file, lineOf(text, offset + d.index), 'color-literal', `${d.prop}: ${d.value.trim()} uses a colour literal. Use a token (var(--c-ink), var(--c-brand), var(--c-on-brand)…) or color-mix(in srgb, var(--c-x) N%, transparent) so all five themes work.`);
          if (/^font(-family)?$/i.test(d.prop) && /["']?[A-Z][a-zA-Z ]+["']?\s*(,|$)/.test(d.value) && !/var\(--/.test(d.value)) add(file, lineOf(text, offset + d.index), 'font-literal', `${d.prop}: ${d.value.trim()} names a font. Use var(--font), var(--disp) or var(--title).`, 'warning');
        }
      }
      // 3. restyling library classes outside the library
      if (mode === 'consumer' && !inLocal(rel)) {
        const re = /(^|[}\s,>+~(])\.(tx-[a-z0-9_-]+)[^{}]*\{/gi; let m;
        const clean = css.replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '));
        while ((m = re.exec(clean))) add(file, lineOf(text, offset + m.index), 'restyle', `Restyles .${m[2]} outside the library. Add a variant in ${LOCAL_DIR} instead (twinx-ui new <name> --extends <component>), so the change can go back to the library.`);
      }
    }

    // markup: inline style colours and unknown tx- classes
    if (MARKUP_EXT.has(ext)) {
      for (const m of text.matchAll(/style\s*=\s*(["'{])([\s\S]*?)(?:\1|}})/gi)) {
        const v = stripDataUris(m[2]);
        if (LITERAL.test(v) && /(color|background|border|fill|stroke|shadow)/i.test(v)) add(file, lineOf(text, m.index), 'color-literal', `Inline style with a colour literal: ${m[2].trim().slice(0, 80)}. Use a component class or a token.`);
      }
      if (known.size) {
        for (const m of text.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g)) {
          for (const cls of m[1].split(/\s+/)) {
            if (/^tx-[a-z0-9_-]+$/i.test(cls) && !known.has(cls)) add(file, lineOf(text, m.index), 'unknown-class', `Class "${cls}" is not defined by any TwinX component. Check ui/twinx/registry.json for the right name, or create it with twinx-ui new.`);
          }
        }
      }
    }
  }
  return problems;
}

export function report(problems, { quiet = false } = {}) {
  const errors = problems.filter((p) => p.level === 'error'), warnings = problems.filter((p) => p.level !== 'error');
  const lines = problems.map((p) => `${p.file}:${p.line}  ${p.level === 'error' ? 'error' : 'warn '}  [${p.rule}] ${p.message}`);
  if (!quiet || problems.length) lines.push(`twinx-ui lint: ${errors.length} error(s), ${warnings.length} warning(s)`);
  return { text: lines.join('\n'), errors: errors.length, warnings: warnings.length };
}
