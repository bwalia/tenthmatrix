/**
 * Published OpsAPI CMS posts for the site's namespace — the source prebuild
 * (scripts/fetchBlogs.mjs) writes on top of the committed blog JSON, and what
 * scripts/cms-fingerprint.mjs hashes to decide whether prod needs a rebuild.
 *
 * Dependency-free (Node >= 20 global fetch) so the scheduled content check can
 * run without `npm ci`. Env is read per call, after the caller loads .env:
 *   OPSAPI_URL          base, trailing slash optional
 *   WEBSITE_NAMESPACE   public CMS namespace (tenthmatrix)
 *   WEBSITE_CATEGORY    optional category filter
 *   CMS_FETCH_TIMEOUT_MS  per request, default 15000
 */
import { mapCmsPost } from "../../src/lib/cmsMap.mjs";

export function cmsConfig(env = process.env) {
  const namespace = env.WEBSITE_NAMESPACE || "";
  const opsapi = env.OPSAPI_URL ? env.OPSAPI_URL.replace(/\/?$/, "/") : "";
  return {
    namespace,
    category: env.WEBSITE_CATEGORY || "",
    opsapi,
    base: opsapi && namespace ? `${opsapi}api/v2/public/cms/${encodeURIComponent(namespace)}` : null,
    timeoutMs: Number(env.CMS_FETCH_TIMEOUT_MS || 15000),
  };
}

export async function getJson(url, { timeoutMs = 15000, ...init } = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/**
 * Published CMS posts (list → full post per slug), mapped by mapCmsPost.
 * Throws if the list can't be read; a single failing post is skipped.
 */
export async function fetchCmsPosts(cfg = cmsConfig()) {
  if (!cfg.base) throw new Error("OPSAPI_URL / WEBSITE_NAMESPACE not set");
  const { base, category, timeoutMs } = cfg;
  const summaries = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const qs = new URLSearchParams({ page: String(page), perPage: "50" });
    if (category) qs.set("category", category);
    const body = await getJson(`${base}/posts?${qs}`, { timeoutMs });
    for (const p of Array.isArray(body?.data) ? body.data : []) summaries.push(p);
    totalPages = body?.meta?.totalPages || 1;
  }

  // The list omits content_html; a single failing post is skipped, not fatal.
  const posts = [];
  for (const s of summaries) {
    if (!s?.slug) continue;
    try {
      const body = await getJson(`${base}/posts/${encodeURIComponent(s.slug)}`, { timeoutMs });
      const mapped = mapCmsPost(body?.data);
      if (mapped) posts.push(mapped);
    } catch (e) {
      console.warn(`⚠️  CMS post ${s.slug} skipped: ${e.message}`);
    }
  }
  console.log(
    `📚 Fetched ${posts.length} CMS post(s) for namespace "${cfg.namespace}"` +
      (category ? ` (category "${category}")` : "") + "."
  );
  return posts;
}
