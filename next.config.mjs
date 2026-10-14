import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./src/i18n.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Standalone output + traced files resolve to this app (avoids picking up a
    // parent lockfile as the workspace root).
    outputFileTracingRoot: path.join(__dirname),
    // The CMS data layer reads committed JSON at runtime (fs) as the API-down
    // fallback. Runtime fs reads aren't auto-traced into the standalone bundle,
    // so include the data dir explicitly — else the fallback renders empty.
    outputFileTracingIncludes: {
        '/**': ['./src/app/data/**'],
    },
    images: {
        unoptimized: true,
    },

    // ISR shared cache: a Redis-backed handler so revalidateTag('cms-posts')
    // busts every replica, not just one pod. Production only; local-only LRU
    // when REDIS_URL is unset. cacheMaxMemorySize: 0 defers to the handler.
    cacheHandler:
        process.env.NODE_ENV === 'production'
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
    async redirects() {
        const locale = ':locale(en|es|fr|nl|hi|th|zh|ar|bn|pt|ru|ur|pa)';
        return [
            { source: `/${locale}/blogs`, destination: '/:locale/docs/blogs', permanent: true },
            { source: `/${locale}/blogs/:path*`, destination: '/:locale/docs/blogs/:path*', permanent: true },
        ];
    },
};

export default withNextIntl(nextConfig);
