import { blogExists } from '@/utils/loadBlog';
import { isValidSlug, read, like, rateLimited, clientKey } from '@/lib/engagement';

export const dynamic = 'force-dynamic';

/** GET → { likes }. */
export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return Response.json({ error: 'Invalid slug' }, { status: 400 });
  return Response.json({ likes: read(slug).likes });
}

/** POST { action: "like" | "dislike" } → { success, likes }. */
export async function POST(req, { params }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return Response.json({ error: 'Invalid slug' }, { status: 400 });
  // Committed posts only; CMS-only posts are allowed when the CMS is enabled.
  if (!blogExists(slug) && !process.env.WEBSITE_NAMESPACE) {
    return Response.json({ error: 'Blog not found' }, { status: 404 });
  }
  if (rateLimited(`like:${clientKey(req)}`, { limit: 30 })) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  let action;
  try {
    ({ action } = await req.json());
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (action !== 'like' && action !== 'dislike') {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }
  try {
    return Response.json({ success: true, likes: like(slug, action) });
  } catch {
    return Response.json({ error: 'Store unavailable' }, { status: 503 });
  }
}
