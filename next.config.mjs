import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./src/i18n.js');

// Prod (www.tenthmatrix.com) is a static export served from the S3 bucket
// tenthmatrix-website via wslproxy; int/test/acc run the standalone image on k3s.
// scripts/build-static.mjs sets this (and moves src/app/api + src/proxy.js
// aside, since neither can exist in an export).
const STATIC_EXPORT = process.env.TM_STATIC_EXPORT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: STATIC_EXPORT ? 'export' : 'standalone',
    // S3 website hosting serves /path/index.html for /path/.
    trailingSlash: STATIC_EXPORT,
    // Standalone output + traced files resolve to this app (avoids picking up a
    // parent lockfile as the workspace root).
    outputFileTracingRoot: path.join(__dirname),
    // The CMS data layer reads committed JSON at runtime (fs) as the API-down
    // fallback. Runtime fs reads aren't auto-traced into the standalone bundle,
    // so include the data dir explicitly — else the fallback renders empty.
    // src/lib/og-fonts: static TTFs read by src/lib/ogImage.js for ISR'd OG images.
    outputFileTracingIncludes: {
        '/**': ['./src/app/data/**', './src/lib/og-fonts/**'],
    },
    images: {
        unoptimized: true,
    },

    // ISR shared cache: a Redis-backed handler so revalidateTag('cms-posts')
    // busts every replica, not just one pod. Production only; local-only LRU
    // when REDIS_URL is unset. cacheMaxMemorySize: 0 defers to the handler.
    cacheHandler:
        process.env.NODE_ENV === 'production' && !STATIC_EXPORT
            ? fileURLToPath(new URL('./cache-handler.mjs', import.meta.url))
            : undefined,
    cacheMaxMemorySize: 0,

    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    poweredByHeader: false,

    experimental: {
        optimizePackageImports: ['lucide-react'],
    },

    // Legacy /blogs URLs → canonical /docs/blogs (locale-aware), same as
    // Workstation. The locale is constrained so /api/blogs/* is never caught.
    // Not supported by output: 'export' — the static build gets redirect pages
    // from scripts/build-static.mjs instead.
    ...(STATIC_EXPORT ? {} : { redirects }),
};

async function redirects() {
    const locale = ':locale(en|es|fr|nl|hi|th|zh|ar|bn|pt|ru|ur|pa)';
    return [
        { source: `/${locale}/blogs`, destination: '/:locale/docs/blogs', permanent: true },
        { source: `/${locale}/blogs/:path*`, destination: '/:locale/docs/blogs/:path*', permanent: true },
    ];
}

export default withNextIntl(nextConfig);
