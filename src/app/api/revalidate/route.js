/* global process, Response, Buffer */
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import crypto from 'crypto';

// force-dynamic (NOT force-static) is REQUIRED: under `output: standalone` +
// Next 16, `force-static` makes this POST handler render statically, so it is
// invoked with an EMPTY request-header set — the body still streams via
// req.text(), but req.headers.get(...) returns null — and every signed webhook
// delivery fails the signature check with 401. Reading the signature through
// the next/headers `headers()` dynamic API returns the real inbound headers and
// keeps the route per-request. Verified against int in prod: same secret + same
// body hashed identically on both sides, yet req.headers was empty in-handler.
export const dynamic = 'force-dynamic';

/**
 * OPSAPI webhook receiver.
 *
 * OPSAPI POSTs a signed payload on a cms_post change (see the CMS webhook system
 * in opsapi). We verify the HMAC-SHA256 signature (`X-Opsapi-Signature-256`)
 * against REVALIDATE_SECRET — the same secret registered on the OPSAPI webhook
 * for this namespace — then bust the `cms-posts` cache tag so the next request
 * re-fetches. Content live in seconds, no rebuild.
 */
export async function POST(req) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'REVALIDATE_SECRET not configured' }, { status: 503 });
  }

  let raw;
  try {
    raw = await req.text();
  } catch {
    return Response.json({ ok: false, error: 'Could not read request body' }, { status: 400 });
  }
  const provided = (await headers()).get('x-opsapi-signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');

  // Constant-time compare; timingSafeEqual throws on length mismatch, so guard.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // Next 16 requires a cache-life profile. { expire: 0 } = expire immediately,
  // which is what Workstation's one-arg call did (content live on next request).
  revalidateTag('cms-posts', { expire: 0 });
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
