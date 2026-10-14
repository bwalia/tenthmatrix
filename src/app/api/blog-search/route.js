import { searchPosts } from '@/lib/cms';

// force-dynamic (NOT force-static): this route reads the per-request `?q=`.
// Under force-static Next 16 prerenders it once with an empty query and every
// search returns nothing (bug seen on Workstation).
export const dynamic = 'force-dynamic';

/**
 * Live blog search against the OpsAPI CMS (`?search=`), so posts published via
 * the API are searchable immediately — no rebuild. searchPosts() merges git
 * hits in overlay mode and is cache-tagged `cms-posts` (busted by
 * /api/revalidate). The client falls back to the prebuilt Fuse index if this
 * route fails.
 */
export async function GET(req) {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 200);
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const { results, total } = await searchPosts({ q, perPage: 40 });
    return Response.json({ results, total });
  } catch {
    return Response.json({ results: [], error: 'search-unavailable' }, { status: 503 });
  }
}
