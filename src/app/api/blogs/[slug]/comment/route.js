import { blogExists } from '@/utils/loadBlog';
import { isValidSlug, read, addComment, rateLimited, clientKey } from '@/lib/engagement';

export const dynamic = 'force-dynamic';

const clean = (s, max) =>
  String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

/** GET → { comments }. */
export async function GET(_req, { params }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return Response.json({ error: 'Invalid slug' }, { status: 400 });
  return Response.json({ comments: read(slug).comments });
}

/** POST { name, comment, website? } → { success, comments }. `website` is a honeypot. */
export async function POST(req, { params }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return Response.json({ error: 'Invalid slug' }, { status: 400 });
  if (!blogExists(slug) && !process.env.WEBSITE_NAMESPACE) {
    return Response.json({ error: 'Blog not found' }, { status: 404 });
  }
  if (rateLimited(`comment:${clientKey(req)}`, { limit: 5 })) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body?.website) return Response.json({ success: true, comments: read(slug).comments });
  const name = clean(body?.name, 80);
  const comment = clean(body?.comment, 2000);
  if (!name || !comment) return Response.json({ error: 'Name and comment are required' }, { status: 400 });
  try {
    return Response.json({ success: true, comments: addComment(slug, { name, comment }) });
  } catch {
    return Response.json({ error: 'Store unavailable' }, { status: 503 });
  }
}
