/* global process, console */
/**
 * Import the committed blog JSON (src/app/data/blogs/*.json) into the OpsAPI
 * CMS as published posts in the `tenthmatrix` namespace.
 *
 * DRY-RUN BY DEFAULT. Nothing is written unless you pass --apply. Writing to the
 * CMS needs an explicit go-ahead (TENTHMATRIX_BUILD.prompt.md §6), so even with
 * an API key in your environment a plain run only maps and prints.
 *
 * Auth (only needed for --apply, and for the live "already exists" lookup):
 * an OpsAPI API key with a `cms` scope (dashboard → API Keys). API keys skip 2FA.
 *
 * Usage:
 *   node scripts/import-blogs-to-cms.mjs                       # dry run (default)
 *   node scripts/import-blogs-to-cms.mjs --only=my-slug        # dry run, one post
 *   OPSAPI_URL=https://int-api.tenthmatrix.com/ \
 *   OPSAPI_API_KEY='<key>' \
 *   node scripts/import-blogs-to-cms.mjs --apply               # WRITE
 *
 * Env: OPSAPI_URL (default https://int-api.tenthmatrix.com/), OPSAPI_API_KEY,
 *      CMS_NAMESPACE (default tenthmatrix), CMS_CATEGORY (default website),
 *      CMS_CATEGORY_NAME (default Website).
 *
 * Idempotent: posts whose slug already exists in the namespace are skipped.
 * Fixture slugs (`__sample__`) are never imported.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice('--only='.length);

const BASE = (process.env.OPSAPI_URL || 'https://int-api.tenthmatrix.com/').replace(/\/?$/, '/');
const KEY = process.env.OPSAPI_API_KEY || '';
const NS = process.env.CMS_NAMESPACE || 'tenthmatrix';
const CAT_SLUG = process.env.CMS_CATEGORY || 'website';
const CAT_NAME = process.env.CMS_CATEGORY_NAME || 'Website';
const DIR = path.join(process.cwd(), 'src/app/data/blogs');
const isSample = (slug = '') => /^__.*__$/.test(String(slug));

if (process.env.DRY_RUN === '1' && APPLY) {
  console.error('DRY_RUN=1 and --apply contradict each other; refusing to guess.');
  process.exit(1);
}
if (APPLY && !KEY) {
  console.error('--apply needs OPSAPI_API_KEY. Mint a key in the OpsAPI dashboard → API Keys (cms scope).');
  process.exit(1);
}
const headers = {
  'Content-Type': 'application/json',
  ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
  'X-Namespace-Slug': NS,
};

async function api(method, pathAndQuery, body) {
  const res = await fetch(`${BASE}${pathAndQuery.replace(/^\//, '')}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

/** Ensure the target category exists; return its uuid. Dry run never creates. */
async function ensureCategory() {
  if (!KEY) {
    console.log(`[dry-run] no OPSAPI_API_KEY — assuming category "${CAT_SLUG}" would be created/looked up`);
    return 'DRY_CAT_UUID';
  }
  const list = await api('GET', 'api/v2/cms/categories');
  const found = (list.json?.data || []).find((c) => c.slug === CAT_SLUG);
  if (found) return found.uuid;
  if (!APPLY) { console.log(`[dry-run] would create category ${CAT_SLUG}`); return 'DRY_CAT_UUID'; }
  const created = await api('POST', 'api/v2/cms/categories', { name: CAT_NAME, slug: CAT_SLUG });
  if (!created.ok) throw new Error(`create category failed (${created.status}): ${JSON.stringify(created.json)}`);
  return created.json?.data?.uuid || created.json?.uuid;
}

/** Slugs already published in the namespace (public endpoint, paginates). */
async function existingSlugs() {
  const slugs = new Set();
  try {
    for (let page = 1, total = 1; page <= total; page++) {
      const res = await fetch(`${BASE}api/v2/public/cms/${encodeURIComponent(NS)}/posts?page=${page}&perPage=50`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const body = await res.json();
      for (const p of body.data || []) slugs.add(p.slug);
      total = body.meta?.totalPages || 1;
    }
  } catch (e) {
    console.warn(`Could not list existing posts (${e.message}) — treating namespace as empty.`);
  }
  return slugs;
}

function mapPost(b, categoryUuid) {
  const imgs = Array.isArray(b.images) ? b.images : [];
  const cover = imgs.find((i) => i?.is_cover) || imgs[0];
  const tags = (Array.isArray(b.tags) ? b.tags : [])
    .map((t) => (typeof t === 'string' ? t : t?.name || t?.slug))
    .filter(Boolean);
  const author = b.user?.name || `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();
  return {
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt || '',
    content_html: b.content || b.content_html || '',
    status: 'published',
    visibility: 'public',
    featured_image_url: cover?.url || null,
    tags,
    category_uuids: categoryUuid ? [categoryUuid] : [],
    seo_title: b.meta_title || b.title,
    seo_description: b.meta_description || b.excerpt || '',
    seo_keywords: b.meta_keywords || '',
    author_name: author || 'TenthMatrix',
  };
}

async function main() {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')) : [];
  const mode = APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes; pass --apply to write)';
  console.log(`${mode}: ${files.length} blog file(s) → ${BASE}api/v2/cms/posts  (namespace=${NS}, category=${CAT_SLUG})`);

  const categoryUuid = await ensureCategory();
  const skip = await existingSlugs();
  console.log(`${skip.size} post(s) already in the namespace — those are skipped.`);

  let created = 0, skipped = 0, failed = 0;
  for (const f of files) {
    let b;
    try { b = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf-8')); }
    catch (e) { console.warn(`- ${f}: invalid JSON (${e.message}), skip`); skipped++; continue; }
    if (!b.title || !b.slug) { console.warn(`- ${f}: missing title/slug, skip`); skipped++; continue; }
    if (isSample(b.slug)) { skipped++; continue; }
    if (ONLY && b.slug !== ONLY) continue;
    if (skip.has(b.slug)) { skipped++; continue; }
    const payload = mapPost(b, categoryUuid);
    if (!APPLY) {
      console.log(`[dry-run] would create: ${b.slug}  (tags: ${payload.tags.join(',') || '-'}, ${payload.content_html.length} chars)`);
      created++;
      continue;
    }
    const res = await api('POST', 'api/v2/cms/posts', payload);
    if (res.ok) { created++; console.log(`+ ${b.slug}`); }
    else { failed++; console.error(`✗ ${b.slug} (${res.status}): ${JSON.stringify(res.json).slice(0, 200)}`); }
  }
  console.log(`\nDone (${APPLY ? 'applied' : 'dry run'}). ${APPLY ? 'created' : 'would create'}=${created} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
