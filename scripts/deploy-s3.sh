#!/usr/bin/env bash
# Deploy the TenthMatrix static export (prod, www.tenthmatrix.com) to S3.
#
#   bash scripts/deploy-s3.sh            # build (scripts/build-static.mjs) + sync
#   SKIP_BUILD=1 bash scripts/deploy-s3.sh   # sync an existing out/
#
# Bucket: tenthmatrix-website (eu-west-2, static website hosting, public read).
# wslproxy (lon1/lon2, rule tm-website-s3-proxy) serves www + apex over TLS
# from http://tenthmatrix-website.s3-website.eu-west-2.amazonaws.com.
# Credentials come from the environment (AWS_ACCESS_KEY_ID/… or AWS_PROFILE).
set -euo pipefail

BUCKET="${BUCKET:-tenthmatrix-website}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-2}"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npm run verify
  node scripts/build-static.mjs
fi
[ -f out/en/index.html ] || { echo "out/ is missing or incomplete — build first" >&2; exit 1; }

# SEO guard: every exported page has exactly one <h1>.
node scripts/verify-headings.mjs out

# Assets before HTML, so new pages never reference files that aren't there yet.
# --size-only: every build has fresh mtimes, so a timestamp compare would
# re-upload the whole ~2 GB export. Scripts/CSS are content-hashed and images
# rarely change in place. HTML and the per-page .txt RSC payloads (not hashed)
# always sync on timestamp with no-cache.
aws s3 sync out/ "s3://$BUCKET/" --size-only --exclude "*.html" --exclude "*.txt" --exclude "*opengraph-image" \
  --cache-control "public, max-age=86400"
# Social cards are extensionless PNGs (…/opengraph-image); S3 would guess
# binary/octet-stream, which some platforms refuse to render.
aws s3 sync out/ "s3://$BUCKET/" --size-only --exclude "*" --include "*opengraph-image" \
  --content-type image/png --cache-control "public, max-age=86400"
aws s3 sync out/ "s3://$BUCKET/" --delete --exclude "*" --include "*.html" --include "*.txt" \
  --cache-control "no-cache, no-store, must-revalidate"
# Remove assets that no longer exist in this build (hashed chunks, old images).
aws s3 sync out/ "s3://$BUCKET/" --size-only --delete --exclude "*.html" --exclude "*.txt" \
  --cache-control "public, max-age=86400"

# No versioned copies inside this bucket: the website endpoint would serve them
# publicly as duplicate content. Rollback = redeploy the previous commit.

echo "Deployed to s3://$BUCKET — http://$BUCKET.s3-website.$AWS_DEFAULT_REGION.amazonaws.com"
