import createMiddleware from 'next-intl/middleware';

// Next 16 renamed middleware.js -> proxy.js. Locale list is inlined (the
// matcher must be a static literal anyway); keep it in sync with
// src/utils/getMessages.js.
const intlMiddleware = createMiddleware({
  locales: ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'],
  defaultLocale: 'en',
  // Always show the locale in the URL (/en/articles), same as Workstation.
  localePrefix: 'always',
  // Don't guess from Accept-Language: crawlers and the sitemap expect /en.
  localeDetection: false,
});

export function proxy(request) {
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension
  // (robots.txt, sitemap.xml, /img/…, /data/search-index.json).
  matcher: ['/', '/(en|es|fr|nl|hi|th|zh|ar|bn|pt|ru|ur|pa)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
