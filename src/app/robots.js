const SITE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');

// Only production is indexable. int/test/acc share the same image, so the
// decision is made per request host at runtime via ROBOTS_DISALLOW_ALL (set in
// the non-prod Helm values) rather than at build time.
export const dynamic = 'force-dynamic';

export default function robots() {
  if (process.env.ROBOTS_DISALLOW_ALL === 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/*/search'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
