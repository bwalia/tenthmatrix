/* global process */
/**
 * generateStaticParams source for the S3 static export (prod) only.
 *
 * The k3s standalone build serves blog routes on demand (ISR):
 * generateStaticParams returns [] and pages render on first request. The S3
 * export (scripts/build-static.mjs sets TM_STATIC_EXPORT=1) has no server, so
 * every dynamic blog route enumerates its params from the committed JSON that
 * prebuild/fetchBlogs refreshes. Same model as Workstation's staticSlugs.js.
 */
import fs from 'fs';
import path from 'path';
import { locales } from '@/utils/getMessages';

export const STATIC_EXPORT = process.env.TM_STATIC_EXPORT === '1';

const dataDir = (...p) => path.join(process.cwd(), 'src/app/data', ...p);
const readdir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const isSample = (slug) => /^__.*__$/.test(slug);

/** [{ locale }] for metadata routes (opengraph-image) under [locale]. */
export function localeParams() {
  return locales.map((locale) => ({ locale }));
}

/** All post slugs → [{ slug }]. */
export function exportBlogSlugs() {
  return readdir(dataDir('blogs'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .filter((slug) => !isSample(slug))
    .map((slug) => ({ slug }));
}

/** Listing page numbers → [{ page }]. */
export function exportPageParams() {
  return readdir(dataDir('pages'))
    .filter((f) => /^page-\d+\.json$/.test(f))
    .map((f) => ({ page: f.replace('page-', '').replace('.json', '') }));
}

/** Tag slugs → [{ tag }]. */
export function exportTagParams() {
  return readdir(dataDir('tags'))
    .filter((f) => f.endsWith('.json') && !/-page-\d+\.json$/.test(f))
    .map((f) => ({ tag: f.replace(/\.json$/, '') }));
}

/** Tag listing pages → [{ tag, page }]. */
export function exportTagPageParams() {
  return readdir(dataDir('tags'))
    .map((f) => f.match(/^(.+)-page-(\d+)\.json$/))
    .filter(Boolean)
    .map(([, tag, page]) => ({ tag, page }));
}
