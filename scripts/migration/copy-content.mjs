#!/usr/bin/env node
/**
 * §5 content migration, step 1: copy approved content from ../workstation-website
 * (read-only) into this repo, driven by migration/manifest.json.
 *
 *   blogs      data/blogs/<slug>.json + data/{locale}/blogs/<slug>.json
 *   articles   data/{locale}/articles.json filtered to approved codes (+ root mirror)
 *   insights   data/en/insights/** (whole section) + aliases.json for old slugs
 *   page data  data/{locale}/<page>.json for approved routes (why-workstation → why-tenthmatrix)
 *   public     public/data client copies + every local asset the copied JSON references
 *
 * Rerunnable: it overwrites what it copies, so run the whole chain afterwards:
 *   node scripts/migration/copy-content.mjs
 *   node scripts/migration/content-fixes.mjs
 *   node scripts/migration/rebrand.mjs --apply
 *   node scripts/migration/port-dict.mjs
 *   npm run i18n:build && npm run sync:articles-locales && npm run prebuild
 *
 * Usage: node scripts/migration/copy-content.mjs [--source ../workstation-website]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const argSrc = process.argv.indexOf('--source');
const SRC = path.resolve(ROOT, argSrc > -1 ? process.argv[argSrc + 1] : '../workstation-website');
const SRC_DATA = path.join(SRC, 'src/app/data');
const DATA = path.join(ROOT, 'src/app/data');
const PUB = path.join(ROOT, 'public');
const SRC_PUB = path.join(SRC, 'public');
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const KEEP = new Set(['tenthmatrix', 'both']);

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/manifest.json'), 'utf8'));
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
};
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
const counts = {};
const bump = (k, n = 1) => (counts[k] = (counts[k] || 0) + n);
const copiedJson = []; // every JSON file we wrote, scanned for asset refs

/* ---------- blogs ---------- */
const blogSlugs = manifest.blogs.filter((b) => KEEP.has(b.dest)).map((b) => b.slug);
const blogSet = new Set(blogSlugs);
for (const slug of blogSlugs) {
  const from = path.join(SRC_DATA, 'blogs', `${slug}.json`);
  if (!fs.existsSync(from)) { console.warn(`! blog missing in source: ${slug}`); continue; }
  copy(from, path.join(DATA, 'blogs', `${slug}.json`));
  copiedJson.push(path.join(DATA, 'blogs', `${slug}.json`));
  bump('blogs (shared)');
  for (const l of LOCALES) {
    const lf = path.join(SRC_DATA, l, 'blogs', `${slug}.json`);
    if (!fs.existsSync(lf)) continue;
    const to = path.join(DATA, l, 'blogs', `${slug}.json`);
    copy(lf, to);
    copiedJson.push(to);
    bump('blogs (locale copies)');
  }
}
// Drop shared/locale blog files that are not approved (stale from an earlier run).
for (const dir of ['blogs', ...LOCALES.map((l) => `${l}/blogs`)]) {
  const d = path.join(DATA, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (f.endsWith('.json') && !blogSet.has(f.replace(/\.json$/, ''))) fs.rmSync(path.join(d, f));
  }
}

/* ---------- articles ---------- */
const codes = new Set(manifest.articles.filter((a) => KEEP.has(a.dest)).map((a) => a.code));
for (const l of LOCALES) {
  const from = path.join(SRC_DATA, l, 'articles.json');
  if (!fs.existsSync(from)) continue;
  const j = readJson(from);
  j.data.content = (j.data.content || []).filter((a) => codes.has(a.code));
  const to = path.join(DATA, l, 'articles.json');
  writeJson(to, j);
  copiedJson.push(to);
  bump(`articles (${l})`, j.data.content.length);
  if (l === 'en') { writeJson(path.join(DATA, 'articles.json'), j); }
}

/* ---------- insights (whole section, English only in source) ---------- */
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
for (const l of LOCALES) {
  for (const f of walk(path.join(SRC_DATA, l, 'insights'))) {
    const to = path.join(DATA, l, 'insights', path.relative(path.join(SRC_DATA, l, 'insights'), f));
    copy(f, to);
    if (f.endsWith('.json')) copiedJson.push(to);
    if (f.includes('/articles/')) bump(`insights articles (${l})`);
    else bump(`insights other (${l})`);
  }
}
// Workstation hard-coded these old slugs in insights/[slug]/page.js; here they are data.
writeJson(path.join(DATA, 'en/insights/aliases.json'), {
  'jev-system-one': 'jev-new-ai-stack.json',
  'jev-agent-harness': 'building-jev-agent-harness.json',
  'jev-benchmarks': 'jev-benchmark-lab.json',
});

/* ---------- page data (all locales) ---------- */
const GENERATED = new Set(['all-meta.json', 'blogs.json', 'articles.json']);
const RENAME = { 'why-workstation.json': 'why-tenthmatrix.json' };
const pages = manifest.pageData
  .filter((p) => KEEP.has(p.dest) && /^src\/app\/data\/en\/[^/]+\.json$/.test(p.path))
  .map((p) => path.basename(p.path))
  .filter((f) => !GENERATED.has(f));
for (const f of pages) {
  for (const l of LOCALES) {
    const from = path.join(SRC_DATA, l, f);
    if (!fs.existsSync(from)) { if (l === 'en') console.warn(`! page data missing: en/${f}`); continue; }
    const to = path.join(DATA, l, RENAME[f] || f);
    copy(from, to);
    copiedJson.push(to);
  }
  bump('page-data files (x13 locales)');
}
for (const l of LOCALES) {
  const stale = path.join(DATA, l, 'why-workstation.json');
  if (fs.existsSync(stale)) fs.rmSync(stale);
}

/* ---------- public/data client copies ---------- */
const PUBLIC_GENERATED = new Set(['all-meta.json', 'search-index.json']);
for (const p of manifest.pageData.filter((x) => KEEP.has(x.dest) && x.path.startsWith('public/data/'))) {
  const f = path.basename(p.path);
  if (PUBLIC_GENERATED.has(f)) continue;
  const to = path.join(PUB, 'data', f);
  copy(path.join(SRC, p.path), to);
  copiedJson.push(to);
  bump('public/data files');
}

/* ---------- assets ---------- */
// Every local file path referenced by copied JSON (bare "/x/y.ext" strings and
// src/href/poster/url() inside HTML), plus manifest assets with dest tm/both.
const assetRefs = new Set(manifest.assets.filter((a) => KEEP.has(a.dest)).map((a) => a.path));
const PATH_RE = /(?:^|["'(=\s])(\/(?:img|images|insights|brochures|data|videos|files)\/[^"'()\s<>?#]+\.[A-Za-z0-9]{2,5})/g;
const scan = (node) => {
  if (typeof node === 'string') { for (const m of node.matchAll(PATH_RE)) assetRefs.add(m[1]); }
  else if (Array.isArray(node)) node.forEach(scan);
  else if (node && typeof node === 'object') Object.values(node).forEach(scan);
};
for (const f of copiedJson) scan(readJson(f));
const missing = [];
for (const ref of [...assetRefs].sort()) {
  if (ref.startsWith('/brand/')) continue; // public/brand is owned by the brand work
  let rel;
  try { rel = decodeURI(ref).replace(/^\//, ''); } catch { rel = ref.replace(/^\//, ''); }
  const from = path.join(SRC_PUB, rel);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) {
    if (!fs.existsSync(path.join(PUB, rel))) missing.push(ref);
    continue;
  }
  copy(from, path.join(PUB, rel));
  bump(`assets /${rel.split('/')[0]}`);
}
// The insights benchmark kit (methodology files linked from the lab page).
for (const f of walk(path.join(SRC_PUB, 'insights'))) {
  copy(f, path.join(PUB, path.relative(SRC_PUB, f)));
  bump('assets /insights kit');
}

/* ---------- fixtures out ---------- */
for (const p of [
  'src/app/data/blogs/__sample__.json',
  'src/app/data/en/insights/articles/__sample__.json',
  'src/app/data/tags/sample.json',
  'src/app/data/tags/sample-page-1.json',
  'public/img/samples',
]) fs.rmSync(path.join(ROOT, p), { recursive: true, force: true });

console.log('Copied:');
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k.padEnd(34)} ${v}`);
if (missing.length) {
  console.log(`\nReferenced but not found in source or here (${missing.length}):`);
  missing.forEach((m) => console.log('  ' + m));
}
