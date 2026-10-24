import path from "node:path";
import type { NextConfig } from "next";

/**
 * Two build modes, mirroring the vantiq marketing site.
 *
 * Default: a normal Next dev/server build for local work.
 *
 * NEXT_STATIC_EXPORT=true: a static export for GitHub Pages, which serves files
 * rather than running a Node server. Deploy CI sets this.
 */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

/** e.g. "/vault10x" for a GitHub project page. Empty for the custom domain. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // This app lives inside the TenthMatrix monorepo (products/vault10x/www).
  // Without a pinned root, Next picks the repo root from its lockfile and
  // builds the TenthMatrix website's src/proxy.js as this app's proxy.
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  ...(isStaticExport
    ? {
        output: "export",
        // Pages has no image optimiser.
        images: { unoptimized: true },
        // Emits /path/index.html, so deep links resolve without rewrite rules.
        trailingSlash: true,
      }
    : {}),

  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
