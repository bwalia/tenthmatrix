/**
 * Prebuild content step (runs first in `npm run prebuild`).
 *
 *   1. Optionally refresh src/app/data/blogs/*.json from the OpsAPI CMS
 *      (GET {OPSAPI_URL}api/v2/public/cms/{WEBSITE_NAMESPACE}/posts — public,
 *      no JWT), or from the legacy /all-documents feed (OPSAPI_URL +
 *      JWT_SECRET_KEY) when WEBSITE_NAMESPACE is unset.
 *   2. Rebuild the derived indexes from what is on disk:
 *        src/app/data/pages/page-N.json        listing metadata, 10 per page
 *        src/app/data/tags/<tag>.json           every post for a tag
 *        src/app/data/tags/<tag>-page-N.json    paginated tag listings
 *        public/data/all-meta.json              every listing meta
 *        public/data/search-index.json          Fuse.js index (blogs + articles + insights)
 *
 * Overlay semantics match src/lib/cms.js: committed JSON is the base, CMS posts
 * are written on top (same slug → CMS wins), and the indexes are rebuilt from
 * the merged set. If the API is missing or down the committed JSON is used
 * as-is, so this script never fails the build.
 *
 * Deviation from Workstation's copy: Workstation only regenerates pages/ and
 * tags/ after a successful API fetch; here they are always rebuilt from disk so
 * migrated / hand-published posts get listing and tag pages without an API.
 * Uses Node's global fetch (Node >= 20) — no node-fetch dependency.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { mapCmsPost } from "../src/lib/cmsMap.mjs";
import { fetchCmsPosts } from "./lib/cmsSource.mjs";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src/app/data");
const BLOG_DIR = path.join(DATA_DIR, "blogs");
const PAGE_DIR = path.join(DATA_DIR, "pages");
const TAG_DIR = path.join(DATA_DIR, "tags");
const PUBLIC_DATA_DIR = path.join(ROOT, "public/data");
const BLOGS_PER_PAGE = 10;
const BRAND = "TenthMatrix";

/** Fixture slugs/codes (`__sample__`) render but are kept out of search + sitemap. */
export const isSample = (slug = "") => /^__.*__$/.test(String(slug));

const CMS_NAMESPACE = process.env.WEBSITE_NAMESPACE || "";
const USE_CMS = !!CMS_NAMESPACE;
const OPSAPI = process.env.OPSAPI_URL ? process.env.OPSAPI_URL.replace(/\/?$/, "/") : "";
const LEGACY_URL = OPSAPI ? `${OPSAPI}api/v2/all-documents` : null;
const FETCH_TIMEOUT_MS = Number(process.env.CMS_FETCH_TIMEOUT_MS || 15000);

// Re-exported for tests/consumers; one source of truth lives in src/lib/cmsMap.mjs.
export { mapCmsPost };

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const truncate = (text, max = 500) => (!text || text.length <= max ? text || "" : text.slice(0, max));
const slugify = (text) => String(text || "").toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    console.warn(`⚠️  Could not parse ${path.relative(ROOT, file)}: ${e.message}`);
    return null;
  }
};

/** Prefer marked cover; else first image with url (matches blog detail / generateMetadata). */
function coverImageUrl(blog) {
  const imgs = Array.isArray(blog.images) ? blog.images : [];
  const marked = imgs.find((i) => i?.is_cover && i?.url);
  if (marked) return marked.url;
  return imgs.find((i) => i?.url)?.url || blog.cover_image || null;
}

function authorName(user) {
  if (!user) return null;
  return user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || null;
}

function extractMeta(blog) {
  const name = authorName(blog.user);
  return {
    uuid: blog.uuid,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    published_date: blog.published_date,
    tags: (Array.isArray(blog.tags) ? blog.tags : []).map((t) => ({
      name: t.name,
      slug: t.slug || slugify(t.name),
    })),
    cover_image: coverImageUrl(blog),
    reading_minutes: blog.reading_minutes || 0,
    is_featured: !!blog.is_featured,
    user: name ? { name, avatar: blog.user?.avatar || null } : null,
  };
}

const byPublishedDesc = (a, b) =>
  (Date.parse(b?.published_date || "") || 0) - (Date.parse(a?.published_date || "") || 0);

function clearJson(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json")) fs.unlinkSync(path.join(dir, f));
}

/** Load every committed blog document from disk. */
function loadDiskBlogs() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const blog = readJson(path.join(BLOG_DIR, f));
      if (blog && !blog.slug) blog.slug = f.replace(/\.json$/, "");
      return blog;
    })
    .filter(Boolean);
}

/** pages/, tags/ and all-meta.json from the given blog documents. */
function writeListingIndexes(blogs) {
  [PAGE_DIR, TAG_DIR, PUBLIC_DATA_DIR].forEach(ensureDir);
  clearJson(PAGE_DIR);
  clearJson(TAG_DIR);

  const metaList = blogs.map(extractMeta).sort(byPublishedDesc);

  const totalPages = Math.max(1, Math.ceil(metaList.length / BLOGS_PER_PAGE));
  for (let i = 0; i < totalPages; i++) {
    writeJson(
      path.join(PAGE_DIR, `page-${i + 1}.json`),
      metaList.slice(i * BLOGS_PER_PAGE, (i + 1) * BLOGS_PER_PAGE)
    );
  }

  const tagsMap = new Map();
  for (const meta of metaList) {
    for (const t of meta.tags) {
      if (!t.slug) continue;
      if (!tagsMap.has(t.slug)) tagsMap.set(t.slug, []);
      tagsMap.get(t.slug).push(meta);
    }
  }
  for (const [tagSlug, tagBlogs] of tagsMap) {
    writeJson(path.join(TAG_DIR, `${tagSlug}.json`), tagBlogs);
    const tagPages = Math.ceil(tagBlogs.length / BLOGS_PER_PAGE);
    for (let i = 0; i < tagPages; i++) {
      writeJson(
        path.join(TAG_DIR, `${tagSlug}-page-${i + 1}.json`),
        tagBlogs.slice(i * BLOGS_PER_PAGE, (i + 1) * BLOGS_PER_PAGE)
      );
    }
  }

  writeJson(path.join(PUBLIC_DATA_DIR, "all-meta.json"), metaList.filter((m) => !isSample(m.slug)));
  console.log(
    `📝 Indexed ${metaList.length} blog(s): ${totalPages} listing page(s), ${tagsMap.size} tag(s).`
  );
}

/** Insight articles (src/app/data/en/insights/articles/*.json) for the search index. */
function loadInsightEntries() {
  const dir = path.join(DATA_DIR, "en/insights/articles");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)))
    .filter((a) => a?.slug && !isSample(a.slug))
    .map((a) => ({
      type: "insight",
      id: `insight-${a.slug}`,
      slug: a.slug,
      title: a.title || "",
      excerpt: a.subtitle || a.meta?.description || "",
      content: "",
      tags: a.meta?.keywords || "",
      date: a.published_iso || "",
      image: a.hero_image || null,
      author: BRAND,
      category: a.series ? [a.series] : [],
    }));
}

/** Unified Fuse.js search index: blogs + articles + insights. */
function generateSearchIndex(blogs) {
  ensureDir(PUBLIC_DATA_DIR);
  const searchIndex = [];

  for (const blog of blogs) {
    if (isSample(blog.slug)) continue;
    searchIndex.push({
      type: "blog",
      id: blog.uuid || blog.slug,
      slug: blog.slug,
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: truncate(stripHtml(blog.content || "")),
      tags: (blog.tags || []).map((t) => t.name).join(", "),
      date: blog.published_date || "",
      image: coverImageUrl(blog),
      author: authorName(blog.user) || BRAND,
      category: (blog.tags || []).map((t) => t.name),
    });
  }

  const articlesPath = path.join(DATA_DIR, "en/articles.json");
  if (fs.existsSync(articlesPath)) {
    const articlesData = readJson(articlesPath);
    for (const article of articlesData?.data?.content || []) {
      if (!article?.code || isSample(article.code)) continue;
      searchIndex.push({
        type: "article",
        id: article.uuid || article.code,
        slug: article.code,
        title: article.title || "",
        excerpt: article.sub_title || "",
        content: truncate(stripHtml(article.content || "")),
        tags: article.meta_keywords || "",
        date: article.publish_date
          ? new Date(Number(article.publish_date) * 1000).toISOString().split("T")[0]
          : "",
        image: article.image || null,
        author: BRAND,
        category: (article.cats || []).map((c) => c.cat_name),
      });
    }
  }

  searchIndex.push(...loadInsightEntries());

  const out = path.join(PUBLIC_DATA_DIR, "search-index.json");
  writeJson(out, searchIndex);
  console.log(`🔍 Wrote ${path.relative(ROOT, out)} (${searchIndex.length} entries).`);
}

// --- Sources ---------------------------------------------------------------

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Legacy source: the /all-documents feed (JWT-auth). */
async function fetchLegacyDocuments() {
  const token = jwt.sign({ sub: "static-site-fetcher", role: "admin" }, process.env.JWT_SECRET_KEY, {
    expiresIn: "10m",
  });
  const body = await getJson(LEGACY_URL, { headers: { Authorization: `Bearer ${token}` } });
  return Array.isArray(body?.data) ? body.data : [];
}

/**
 * A CMS post that reuses the slug of a post copied from Workstation keeps that
 * post's cross-domain canonical (src/lib/seoCanonical.json) and stays out of
 * the sitemap. Warn so new posts get new slugs; rewritten ones belong in
 * SELF_CANONICAL_CONTENT (scripts/migration/build-seo-canonical.mjs).
 */
export function canonicalCollisions(posts) {
  let entries = {};
  try {
    entries = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/seoCanonical.json"), "utf8")).entries || {};
  } catch {
    return [];
  }
  return posts.map((p) => p?.slug).filter((slug) => slug && entries[`/docs/blogs/${slug}`]);
}

function warnCanonicalCollisions(posts) {
  for (const slug of canonicalCollisions(posts)) {
    console.warn(
      `⚠️  CMS post "${slug}" reuses a Workstation-copied slug: it keeps the canonical to ` +
        `workstation.co.uk and is left out of the sitemap. Give new posts a new slug.`
    );
  }
}

async function refreshFromApi() {
  if (!OPSAPI) {
    console.log("ℹ️  OPSAPI_URL not set — using committed blog JSON.");
    return;
  }
  if (!USE_CMS && !process.env.JWT_SECRET_KEY) {
    console.log("ℹ️  WEBSITE_NAMESPACE and JWT_SECRET_KEY not set — using committed blog JSON.");
    return;
  }
  try {
    const posts = USE_CMS ? await fetchCmsPosts() : await fetchLegacyDocuments();
    if (!posts.length) {
      console.warn("⚠️  API returned no posts — keeping committed blog JSON.");
      return;
    }
    warnCanonicalCollisions(posts);
    ensureDir(BLOG_DIR);
    let written = 0;
    for (const post of posts) {
      const slug = post.slug || post.uuid;
      if (!slug) continue;
      writeJson(path.join(BLOG_DIR, `${slug}.json`), post); // CMS wins on the same slug
      written += 1;
    }
    console.log(`✅ Wrote ${written} post(s) from the API on top of the committed set.`);
  } catch (e) {
    console.error(`❌ Blog fetch failed (${e.message}) — keeping committed blog JSON.`);
  }
}

async function main() {
  [BLOG_DIR, PAGE_DIR, TAG_DIR, PUBLIC_DATA_DIR].forEach(ensureDir);
  await refreshFromApi();
  const blogs = loadDiskBlogs();
  writeListingIndexes(blogs);
  generateSearchIndex(blogs);
}

// Auto-run only when invoked directly (so tests can import helpers).
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error.message);
    process.exit(0); // never block the build on content refresh
  });
}
