/**
 * verify:canonical — cross-domain canonicals to www.workstation.co.uk.
 *
 * Builds nothing. Checks that:
 *   1. src/lib/seoCanonical.json matches what migration/manifest.json generates;
 *   2. every manifest blog / article / insight (dest tenthmatrix) that is not
 *      listed as rewritten resolves to a Workstation canonical;
 *   3. no rewritten / new TenthMatrix page (SELF_CANONICAL) does, and no
 *      CMS-only blog (not in the manifest) does;
 *   4. public/sitemap.xml contains none of the canonicalised URLs (any locale);
 *   5. every canonicalised marketing route's page.js goes through the shared
 *      metadata helper (createRoute / pageMetadata / seoAlternates).
 */
import fs from 'fs';
import path from 'path';
import {
  buildCanonicalMap,
  serialise,
  OUT_FILE,
  SELF_CANONICAL,
  SELF_CANONICAL_CONTENT,
  WORKSTATION_ORIGIN,
} from './migration/build-seo-canonical.mjs';

const ROOT = process.cwd();
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const errors = [];
const fail = (msg) => errors.push(msg);

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/manifest.json'), 'utf8'));
const committed = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
const expected = buildCanonicalMap();
if (committed !== serialise(expected)) {
  fail('src/lib/seoCanonical.json is stale — run node scripts/migration/build-seo-canonical.mjs');
}
const entries = JSON.parse(committed || '{"entries":{}}').entries;
const resolves = (p) => {
  const e = entries[p];
  return e && /^\/[a-z0-9/_-]+$/i.test(e.workstation) ? `${WORKSTATION_ORIGIN}/en${e.workstation}` : null;
};

// 2. manifest content → Workstation
let blogs = 0;
let articles = 0;
let insights = 0;
for (const b of manifest.blogs.filter((x) => x.dest === 'tenthmatrix')) {
  const p = `/docs/blogs/${b.slug}`;
  if (SELF_CANONICAL_CONTENT.has(p)) continue;
  if (resolves(p)) blogs++;
  else fail(`blog ${b.slug} has no Workstation canonical`);
}
for (const a of manifest.articles.filter((x) => x.dest === 'tenthmatrix')) {
  const p = `/articles/${a.code}`;
  if (SELF_CANONICAL_CONTENT.has(p)) continue;
  if (resolves(p)) articles++;
  else fail(`article ${a.code} has no Workstation canonical`);
}
for (const i of manifest.insights.filter((x) => x.dest === 'tenthmatrix')) {
  const served = i.urls.filter((u) => u !== '/insights' && entries[u]);
  if (i.urls.includes('/insights') && i.urls.length === 1) continue; // the listing page
  if (i.urls.every((u) => SELF_CANONICAL_CONTENT.has(u))) continue;
  if (served.length) insights++;
  else fail(`insight ${i.id} has no Workstation canonical`);
}

// 3. rewritten / new pages stay self-canonical
for (const p of SELF_CANONICAL) if (entries[p]) fail(`self-canonical page ${p} is canonicalised to Workstation`);
for (const p of SELF_CANONICAL_CONTENT) if (entries[p]) fail(`rewritten content ${p} is canonicalised to Workstation`);
const manifestBlogs = new Set(manifest.blogs.map((b) => b.slug));
const manifestArticles = new Set(manifest.articles.map((a) => a.code));
for (const [p, e] of Object.entries(entries)) {
  if (e.kind === 'blog' && !manifestBlogs.has(p.split('/').pop())) fail(`${p} is canonicalised but not in the manifest`);
  if (e.kind === 'article' && !manifestArticles.has(p.split('/').pop())) fail(`${p} is canonicalised but not in the manifest`);
}

// 4. sitemap
const sitemapFile = path.join(ROOT, 'public/sitemap.xml');
if (!fs.existsSync(sitemapFile)) {
  fail('public/sitemap.xml missing — run npm run sitemap');
} else {
  const locs = new Set([...fs.readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  let hits = 0;
  for (const loc of locs) {
    const m = loc.match(/^https?:\/\/[^/]+\/([a-z]{2})(\/.*)?$/);
    // Sitemap URLs carry a trailing slash (S3 export); entries are keyed without.
    const p = (m?.[2] || '/').replace(/(.)\/$/, '$1');
    if (m && LOCALES.includes(m[1]) && entries[p]) {
      if (hits++ < 10) fail(`sitemap lists canonicalised URL ${loc}`);
    }
  }
  if (hits > 10) fail(`… and ${hits - 10} more canonicalised URLs in the sitemap`);
}

// 5. marketing routes use the shared helper
for (const [p, e] of Object.entries(entries)) {
  if (e.kind !== 'page' && !p.startsWith('/insights/jev/')) continue;
  const file = path.join(ROOT, 'src/app/[locale]', p, 'page.js');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!/createRoute|pageMetadata|seoAlternates/.test(src)) fail(`${p}/page.js does not use createRoute / pageMetadata / seoAlternates`);
}

if (errors.length) {
  console.error(`✗ verify:canonical — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
const pages = Object.values(entries).filter((e) => e.kind === 'page').length;
console.log(
  `✓ verify:canonical — ${blogs} blogs, ${articles} articles, ${insights} insights, ${pages} pages canonicalise to Workstation; ${SELF_CANONICAL.size} self-canonical routes clean; sitemap clean`
);
