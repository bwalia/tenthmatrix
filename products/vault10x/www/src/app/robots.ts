// Required for output: export — Next must render this at build, not on demand.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.vault10x.com/sitemap.xml",
    host: "https://www.vault10x.com",
  };
}