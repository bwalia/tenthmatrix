/* global process */
/**
 * ISR data-access layer for blog content.
 *
 * Overlay model (default when CMS is enabled):
 *   1. Committed JSON under src/app/data is always the base layer.
 *   2. OPSAPI CMS posts are fetched (cached + tagged `cms-posts`) and merged
 *      on top — same slug → CMS wins; CMS-only slugs are appended.
 *   3. If the API is unreachable, the git catalog still renders in full.
 *
 * Set CMS_CONTENT_MODE=prefer to restore the legacy either/or behaviour
 * (CMS response replaces git; git only on failure).
 *
 * Enabled only when WEBSITE_NAMESPACE (`tenthmatrix`) and OPSAPI_URL are set;
 * otherwise every call uses the committed JSON, so local builds and CI work
 * with no API at all.
 */
import fs from 'fs';
import path from 'path';
import { mapCmsPost, mapCmsSummary } from './cmsMap.mjs';
import { loadBlog } from '@/utils/loadBlog';
import { getTopBlogTags } from '@/app/utils/blogTags';

const NS = process.env.WEBSITE_NAMESPACE || '';
const CAT = process.env.WEBSITE_CATEGORY || '';
const BASE = process.env.OPSAPI_URL
  ? `${process.env.OPSAPI_URL}api/v2/public/cms/${encodeURIComponent(NS)}`
  : null;
// The S3 static export (TM_STATIC_EXPORT=1) reads disk only: prebuild's
// fetchBlogs has already written the CMS posts on top of the committed JSON
// and rebuilt pages/ and tags/ from that set. Fetching again per page could
// list a post published mid-build that has no exported page.
export const CMS_ENABLED = !!(NS && BASE) && process.env.TM_STATIC_EXPORT !== '1';
/** `overlay` (default) = git base + CMS on top. `prefer` = legacy either/or. */
export const CMS_CONTENT_MODE = (process.env.CMS_CONTENT_MODE || 'overlay').toLowerCase();
const OVERLAY = CMS_CONTENT_MODE !== 'prefer';
const REVALIDATE = Number(process.env.CMS_REVALIDATE_SECONDS || 3600);
const PER_PAGE = 10;
const asArray = (v) => (Array.isArray(v) ? v : []);

// Bound every CMS call: a *slow* (not down) opsapi would otherwise hang the
// request/build for undici's ~300s default before the committed-JSON fallback
// could run, defeating the whole point of the fallback. Abort → the caller's
// try/catch converts it to the fallback.
const CMS_TIMEOUT_MS = Number(process.env.CMS_FETCH_TIMEOUT_MS || 5000);

async function cmsGet(pathAndQuery) {
  const res = await fetch(`${BASE}${pathAndQuery}`, {
    next: { revalidate: REVALIDATE, tags: ['cms-posts'] },
    signal: AbortSignal.timeout(CMS_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`CMS ${res.status}`);
  return res.json();
}

const dataDir = (...p) => path.join(process.cwd(), 'src/app/data', ...p);
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
};

function byPublishedDesc(a, b) {
  const ta = Date.parse(a?.published_date || '') || 0;
  const tb = Date.parse(b?.published_date || '') || 0;
  return tb - ta;
}

/** Git listing metas from pages/*.json (deduped by slug, newest first). */
function loadAllStaticSummaries() {
  const dir = dataDir('pages');
  if (!fs.existsSync(dir)) return [];
  const map = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.startsWith('page-') && f.endsWith('.json'))) {
    for (const item of asArray(readJson(path.join(dir, file)))) {
      if (item?.slug && !map.has(item.slug)) map.set(item.slug, item);
    }
  }
  return [...map.values()].sort(byPublishedDesc);
}

function filterByTag(summaries, tag) {
  if (!tag) return summaries;
  const t = String(tag).toLowerCase();
  return summaries.filter((p) =>
    asArray(p.tags).some((x) => (x?.slug || x?.name || '').toLowerCase() === t)
  );
}

function mergeSummaries(base, overlay) {
  const map = new Map();
  for (const p of base) {
    if (p?.slug) map.set(p.slug, p);
  }
  for (const p of overlay) {
    if (p?.slug) map.set(p.slug, p); // CMS wins
  }
  return [...map.values()].sort(byPublishedDesc);
}

function paginateSummaries(items, page = 1, perPage = PER_PAGE) {
  const safePage = Math.max(1, Number(page) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage) || 1);
  const start = (safePage - 1) * perPage;
  return {
    blogs: items.slice(start, start + perPage),
    totalPages,
    total: items.length,
  };
}

/** Fetch every CMS listing page (tagged fetch — ISR + /api/revalidate). */
async function loadAllCmsSummaries({ tag = '', category = CAT } = {}) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  do {
    const qs = new URLSearchParams({ page: String(page), perPage: '50' });
    if (tag) qs.set('tag', tag);
    if (category) qs.set('category', category);
    const body = await cmsGet(`/posts?${qs.toString()}`);
    for (const p of asArray(body?.data).map(mapCmsSummary)) {
      if (p?.slug) out.push(p);
    }
    totalPages = body?.meta?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return out;
}

function fallbackListPage({ page, tag }) {
  if (tag) {
    const dir = dataDir('tags');
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.startsWith(`${tag}-page-`) && f.endsWith('.json'))
      : [];
    const totalPages = Math.max(1, files.length);
    const file = files.length ? `${tag}-page-${page}.json` : `${tag}.json`;
    return { blogs: readJson(path.join(dir, file)) || [], totalPages };
  }
  const dir = dataDir('pages');
  const totalPages = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.startsWith('page-')).length || 1
    : 1;
  return { blogs: readJson(dataDir('pages', `page-${page}.json`)) || [], totalPages };
}

/** Listing page → { blogs: meta[], totalPages }. */
export async function getPostListPage({ page = 1, tag = '', category = CAT } = {}) {
  const staticAll = filterByTag(loadAllStaticSummaries(), tag);

  // No CMS configured (local / CI): keep pre-built page JSON unchanged.
  if (!CMS_ENABLED) {
    return fallbackListPage({ page, tag });
  }

  // Legacy either/or: CMS response replaces git; git only on failure.
  if (!OVERLAY) {
    try {
      const qs = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
      if (tag) qs.set('tag', tag);
      if (category) qs.set('category', category);
      const body = await cmsGet(`/posts?${qs.toString()}`);
      const blogs = asArray(body?.data).map(mapCmsSummary).filter(Boolean);
      if (blogs.length === 0 && !tag) throw new Error('CMS returned no posts');
      return { blogs, totalPages: body?.meta?.totalPages || 1 };
    } catch (e) {
      console.warn(`cms.getPostListPage fallback: ${e.message}`);
      return fallbackListPage({ page, tag });
    }
  }

  // Overlay: git base + CMS on top, then sort/slice locally.
  let cmsAll = [];
  try {
    // Fetch unfiltered CMS list when tagging client-side from merged set so
    // git-only tagged posts stay visible. If the API supports tag filters and
    // returns a huge corpus later, we can special-case — today catalogs are small.
    cmsAll = await loadAllCmsSummaries({ tag: '', category });
    if (tag) cmsAll = filterByTag(cmsAll, tag);
  } catch (e) {
    console.warn(`cms.getPostListPage overlay CMS miss: ${e.message}`);
  }

  return paginateSummaries(mergeSummaries(staticAll, cmsAll), page);
}

/**
 * Server-side search over published CMS posts → { results, page, totalPages, total }.
 * Overlay mode also includes matching git listing metas so committed posts stay
 * findable when the API is down or incomplete.
 */
export async function searchPosts({ q, page = 1, perPage = 10 } = {}) {
  const query = (q || '').trim();
  if (!query) return { results: [], page, totalPages: 0, total: 0 };

  const qLower = query.toLowerCase();
  const gitHits = loadAllStaticSummaries()
    .filter(
      (p) =>
        (p.title || '').toLowerCase().includes(qLower) ||
        (p.excerpt || '').toLowerCase().includes(qLower) ||
        (p.slug || '').toLowerCase().includes(qLower)
    )
    .map((p) => ({
      type: 'blog',
      id: p.uuid || p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || '',
      date: (p.published_date || '').toString().slice(0, 10),
      image: p.cover_image || null,
      author: p.user?.name || '',
      category: asArray(p.tags).map((t) => t.name).filter(Boolean),
      published_date: p.published_date,
    }));

  let cmsHits = [];
  if (CMS_ENABLED) {
    try {
      const qs = new URLSearchParams({ page: '1', perPage: '50', search: query });
      if (CAT) qs.set('category', CAT);
      const body = await cmsGet(`/posts?${qs.toString()}`);
      cmsHits = asArray(body?.data).map((p) => ({
        type: 'blog',
        id: p.uuid,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || '',
        date: (p.published_at || '').slice(0, 10),
        image: p.featured_image_url || null,
        author: p.author_name || '',
        category: asArray(p.tags).map((t) => t.name).filter(Boolean),
        published_date: p.published_at,
      }));
    } catch (e) {
      console.warn(`cms.searchPosts: ${e.message}`);
    }
  }

  if (!OVERLAY && CMS_ENABLED) {
    // Legacy: CMS search only when enabled (previous behaviour on success).
    if (cmsHits.length || !gitHits.length) {
      const total = cmsHits.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
      const start = (Math.max(1, page) - 1) * perPage;
      return {
        results: cmsHits.slice(start, start + perPage),
        page,
        totalPages,
        total,
      };
    }
  }

  const merged = mergeSummaries(gitHits, cmsHits);
  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
  const start = (Math.max(1, page) - 1) * perPage;
  return {
    results: merged.slice(start, start + perPage),
    page,
    totalPages,
    total,
  };
}

/** Single full post by slug — CMS on top of committed files. */
export async function getPostDetail(slug, locale = 'en') {
  const gitPost = loadBlog(slug, locale);

  if (CMS_ENABLED) {
    try {
      const body = await cmsGet(`/posts/${encodeURIComponent(slug)}`);
      const mapped = mapCmsPost(body?.data);
      if (mapped) return mapped; // CMS wins
    } catch (e) {
      console.warn(`cms.getPostDetail fallback: ${e.message}`);
    }
  }

  return gitPost;
}

/** Top blog tags for the filter chips → [{ slug, label, count }]. */
export async function getBlogTags(limit = 8) {
  if (!CMS_ENABLED || !OVERLAY) {
    if (CMS_ENABLED) {
      try {
        const body = await cmsGet('/tags');
        const tags = asArray(body?.data)
          .map((t) => ({ slug: t.slug, label: t.name || t.slug, count: t.post_count || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        if (tags.length === 0) throw new Error('CMS returned no tags');
        return tags;
      } catch (e) {
        console.warn(`cms.getBlogTags fallback: ${e.message}`);
      }
    }
    return getTopBlogTags(limit);
  }

  // Overlay: derive chips from the merged catalog so counts match what users see.
  let cmsAll = [];
  try {
    cmsAll = await loadAllCmsSummaries({ category: CAT });
  } catch (e) {
    console.warn(`cms.getBlogTags overlay CMS miss: ${e.message}`);
  }
  const merged = mergeSummaries(loadAllStaticSummaries(), cmsAll);
  const counts = new Map();
  for (const post of merged) {
    for (const t of asArray(post.tags)) {
      const slug = t.slug || '';
      if (!slug) continue;
      const prev = counts.get(slug) || { slug, label: t.name || slug, count: 0 };
      prev.count += 1;
      if (t.name) prev.label = t.name;
      counts.set(slug, prev);
    }
  }
  const fromMerged = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  return fromMerged.length ? fromMerged : getTopBlogTags(limit);
}

/** Slugs for generateStaticParams (pre-render known posts; new ones are ISR). */
export async function getAllSlugs() {
  const gitSlugs = fs.existsSync(dataDir('blogs'))
    ? fs.readdirSync(dataDir('blogs')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    : [];

  if (!CMS_ENABLED) return gitSlugs;

  let cmsSlugs = [];
  try {
    cmsSlugs = (await loadAllCmsSummaries({ category: CAT })).map((p) => p.slug).filter(Boolean);
  } catch (e) {
    console.warn(`cms.getAllSlugs fallback: ${e.message}`);
    if (!OVERLAY) return gitSlugs;
  }

  if (!OVERLAY) return cmsSlugs.length ? cmsSlugs : gitSlugs;

  return [...new Set([...gitSlugs, ...cmsSlugs])];
}
