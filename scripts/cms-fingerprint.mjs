#!/usr/bin/env node
/**
 * Fingerprint of the published OpsAPI CMS posts the S3 export would pull in.
 *
 *   OPSAPI_URL=https://api.tenthmatrix.com/ WEBSITE_NAMESPACE=tenthmatrix \
 *     node scripts/cms-fingerprint.mjs        # prints a sha256, or nothing
 *
 * Hashes exactly what scripts/fetchBlogs.mjs would write (list → full post per
 * slug, mapped), so a new, edited, unpublished or deleted post changes it while
 * view counts do not. Used by .github/workflows/content-refresh.yaml to rebuild
 * prod only when CMS content changed, and by the deploy-s3 job to record what
 * it shipped. Prints nothing when the CMS is not configured or unreachable, so
 * callers can tell "unknown" from "no posts" and skip rather than rebuild.
 * Logs go to stderr; stdout is only the hash. No npm dependencies, so the
 * scheduled check runs without `npm ci`.
 */
import crypto from "node:crypto";
import { cmsConfig, fetchCmsPosts } from "./lib/cmsSource.mjs";

console.log = console.error; // keep progress lines off stdout

const cfg = cmsConfig();
if (!cfg.base) {
  console.error("cms-fingerprint: OPSAPI_URL / WEBSITE_NAMESPACE not set");
  process.exit(0);
}

try {
  const posts = (await fetchCmsPosts(cfg)).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  const hash = crypto.createHash("sha256").update(JSON.stringify(posts)).digest("hex");
  console.error(`cms-fingerprint: ${posts.length} post(s) → ${hash}`);
  process.stdout.write(`${hash}\n`);
} catch (e) {
  console.error(`cms-fingerprint: CMS unreachable (${e.message})`);
}
