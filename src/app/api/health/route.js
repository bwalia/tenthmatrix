// Ring Promoter health check (rp.workstation.co.uk, app tenthmatrix-website):
// `version` must equal the image tag it promoted to this ring (APP_VERSION,
// set from image.tag by the Helm chart). K3S only: the S3 static export
// strips src/app/api, and its version lives in /version.json instead.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { status: 'ok', version: process.env.APP_VERSION || 'dev' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
