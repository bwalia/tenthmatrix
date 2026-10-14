#!/usr/bin/env node
/**
 * SEO guard: every built page must have exactly one <h1>.
 *
 *   node scripts/verify-headings.mjs [dir]      (npm run verify:headings)
 *
 * Scans a static export (`out/`) when one exists, else
 * the prerendered pages of a normal build (`.next/server/app/**\/*.html`).
 * Pass a directory to scan something else. Exits 1 if any page has zero or
 * several <h1> elements, listing each offender with its h1 texts.
 *
 * <script>, <template>, <noscript> and comments are stripped before counting,
 * so HTML strings inside the RSC payload (e.g. blog bodies) don't count —
 * only markup the browser actually renders on first load. Client-only widgets
 * that inject headings after hydration are not visible here; the Playwright
 * audit (scripts/visual/theme-audit.mjs) reports the live h1 count as well.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argDir = process.argv.slice(2).find((a) => !a.startsWith('--'));
const candidates = argDir
  ? [path.resolve(argDir)]
  : [path.join(root, 'out'), path.join(root, '.next/server/app')];
const dir = candidates.find((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());

if (!dir) {
  console.error(
    `verify-headings: no build output found (looked for ${candidates
      .map((d) => path.relative(root, d) || d)
      .join(', ')}). Run \`npm run build\` first.`
  );
  process.exit(1);
}

// Pages that render no content of their own, so "one h1" doesn't apply.
const IGNORE = [
  /^index\.html$/, // `/` → redirect to /en (src/app/page.js)
  /^_global-error(\/index)?\.html$/, // root error boundary shell
  /^500(\/index)?\.html$/,
];

function* walk(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield p;
  }
}

const strip = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');

const text = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

let scanned = 0;
let skipped = 0;
const bad = [];

for (const file of walk(dir)) {
  const rel = path.relative(dir, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  if (IGNORE.some((re) => re.test(rel)) || /<meta[^>]+http-equiv=["']?refresh/i.test(raw)) {
    skipped += 1;
    continue;
  }
  scanned += 1;
  const html = strip(raw);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]).slice(0, 80));
  if (h1s.length !== 1) bad.push({ rel, h1s });
}

const where = path.relative(root, dir) || dir;
if (!scanned) {
  console.error(`verify-headings: no HTML pages found under ${where}.`);
  process.exit(1);
}

if (bad.length) {
  console.error(`verify-headings: ${bad.length} of ${scanned} pages under ${where} do not have exactly one <h1>:`);
  for (const { rel, h1s } of bad.slice(0, 200)) {
    console.error(`  ${rel}: ${h1s.length} h1${h1s.length ? ` — ${h1s.map((t) => JSON.stringify(t)).join(', ')}` : ''}`);
  }
  if (bad.length > 200) console.error(`  … ${bad.length - 200} more`);
  process.exit(1);
}

console.log(`verify-headings: ${scanned} pages under ${where} each have exactly one <h1> (${skipped} redirect/shell pages skipped).`);
