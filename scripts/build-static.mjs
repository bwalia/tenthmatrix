#!/usr/bin/env node
/**
 * Static export for prod (S3 bucket tenthmatrix-website, served through wslproxy).
 *
 * `output: 'export'` cannot contain route handlers that need a server
 * (src/app/api: likes, comments, live search, revalidate webhook), the
 * next-intl proxy (src/proxy.js) or the per-request robots route
 * (src/app/robots.js). They are moved aside for this build only and always
 * restored, so the standalone/k3s build is untouched. The export is prod-only,
 * so it gets the indexable prod robots.txt written into out/. On the export,
 * search uses the prebuilt Fuse index and the contact form posts straight to
 * OpsAPI from the browser; likes/comments are hidden (no server).
 *
 * Output: out/  (then scripts/deploy-s3.sh syncs it to the bucket)
 *   node scripts/build-static.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { locales } from '../src/utils/getMessages.js';

const root = process.cwd();
const stash = path.join(root, '.static-export-stash');
const ASIDE = ['src/app/api', 'src/proxy.js', 'src/app/robots.js'];
const SITE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');
// Old path → new path (no locale). Each src/app/[locale]/<old>/page.js calls
// permanentRedirect(); this map writes the equivalent static page for S3.
const REDIRECTS = { '/wsl-proxy': '/proxy10x' };
const ROBOTS =`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*/search\n\nHost: ${SITE_URL}\nSitemap: ${SITE_URL}/sitemap.xml\n`;

function move(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  return true;
}

const moved = [];
let status = 1;
try {
  fs.rmSync(stash, { recursive: true, force: true });
  for (const rel of ASIDE) if (move(path.join(root, rel), path.join(stash, rel))) moved.push(rel);
  const res = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, TM_STATIC_EXPORT: '1', NEXT_PUBLIC_STATIC_EXPORT: '1' },
  });
  status = res.status ?? 1;
  if (status === 0) {
    fs.writeFileSync(path.join(root, 'out', 'robots.txt'), ROBOTS);
    // No proxy on S3 to send / to the default locale: the export's root page is
    // an error shell, so replace it with an instant redirect to /en/.
    fs.writeFileSync(
      path.join(root, 'out', 'index.html'),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TenthMatrix</title>' +
        `<link rel="canonical" href="${SITE_URL}/en/"><meta http-equiv="refresh" content="0; url=/en/">` +
        '<script>location.replace("/en/"+location.search+location.hash)</script></head>' +
        '<body><a href="/en/">TenthMatrix</a></body></html>',
    );
    // Renamed routes: the export renders redirect() as a JS-only shell, which
    // crawlers and no-JS clients don't follow. Write a plain redirect page.
    for (const locale of locales) {
      for (const [from, to] of Object.entries(REDIRECTS)) {
        const url = `/${locale}${to}/`;
        const dir = path.join(root, 'out', locale, from.slice(1));
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>TenthMatrix</title>` +
            `<link rel="canonical" href="${SITE_URL}${url}"><meta http-equiv="refresh" content="0; url=${url}">` +
            `<script>location.replace("${url}"+location.search+location.hash)</script></head>` +
            `<body><a href="${url}">${url}</a></body></html>`,
        );
      }
    }
  }
} finally {
  for (const rel of moved) move(path.join(stash, rel), path.join(root, rel));
  fs.rmSync(stash, { recursive: true, force: true });
}
process.exit(status);
