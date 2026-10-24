/**
 * Builds src/lib/seoCanonical.json — the single source of truth for which
 * TenthMatrix pages are still copies of a www.workstation.co.uk original and
 * must declare a cross-domain canonical to it (and stay out of our sitemap).
 *
 *   node scripts/migration/build-seo-canonical.mjs          # write the JSON
 *   node scripts/migration/build-seo-canonical.mjs --check  # exit 1 if stale
 *
 * Input is migration/manifest.json (what was copied) plus SELF_CANONICAL below
 * (copied routes TenthMatrix has since rewritten, and routes it created). The
 * mapping is keyed on manifest slugs only, so content created later in the
 * OpsAPI `tenthmatrix` CMS namespace is never canonicalised away.
 *
 * When a copied page is substantially rewritten, add its route to
 * SELF_CANONICAL (marketing routes) or SELF_CANONICAL_CONTENT (blog / article /
 * insight paths) and re-run this script: it becomes self-canonical and returns
 * to the sitemap.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OUT_FILE = path.join(ROOT, 'src/lib/seoCanonical.json');
export const WORKSTATION_ORIGIN = 'https://www.workstation.co.uk';

/**
 * Copied marketing routes that stay self-canonical: pages TenthMatrix rewrote
 * (PR #5 feat/outsourcing-positioning: home, about-us, why-tenthmatrix,
 * services hub, ai-agents, generative-ai, pricing) or created, legal/policy
 * pages, and listing / utility pages that list TenthMatrix's own catalogue.
 */
export const SELF_CANONICAL = new Set([
  // rewritten or created by TenthMatrix
  '/',
  '/about-us',
  '/why-tenthmatrix',
  '/services',
  '/ai-agents',
  '/generative-ai',
  '/pricing',
  '/outsource-ai-development',
  '/ai-agent-development',
  '/generative-ai-development',
  '/why-tenthmatrix-agents',
  '/start-a-project',
  '/brand',
  '/search',
  '/contact-us',
  // legal / policy
  '/privacy-policy',
  '/cookie-policy',
  '/terms-of-service',
  '/terms-of-service/privacy-policy',
  '/refund-policy',
  '/accessibility-statement',
  '/data-deletion',
  '/security',
  // listing / hub / utility pages (list TenthMatrix's own content)
  '/articles',
  '/docs',
  '/docs/blogs',
  '/docs/blogs/tags',
  '/insights',
  '/sitemap-page',
]);

/**
 * Copied marketing routes TenthMatrix serves under a new path (Workstation path →
 * TenthMatrix path). The new path keeps the Workstation canonical until it is
 * rewritten enough to join SELF_CANONICAL; the old path only redirects.
 */
export const RENAMED_ROUTES = { '/wsl-proxy': '/proxy10x' };

/** Blog / article / insight paths (no locale) rewritten enough to be ours. */
export const SELF_CANONICAL_CONTENT = new Set([]);

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const pageExists = (route) =>
  fs.existsSync(path.join(ROOT, 'src/app/[locale]', route === '/' ? '' : route, 'page.js'));

/** Insight slug → URL path on TenthMatrix (the [slug] route serves file slugs + aliases). */
function insightRoutes() {
  const dir = path.join(ROOT, 'src/app/data/en/insights/articles');
  const byFile = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const slug = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).slug || f.replace(/\.json$/, '');
    byFile[f] = slug;
  }
  let aliases = {};
  try {
    aliases = read('src/app/data/en/insights/aliases.json');
  } catch {
    /* none */
  }
  return { byFile, aliases };
}

export function buildCanonicalMap() {
  const manifest = read('migration/manifest.json');
  const entries = {};
  const add = (tmPath, wsPath, kind) => {
    if (SELF_CANONICAL.has(tmPath) || SELF_CANONICAL_CONTENT.has(tmPath)) return;
    entries[tmPath] = { kind, workstation: wsPath };
  };

  for (const b of manifest.blogs) {
    if (b.dest !== 'tenthmatrix') continue;
    add(`/docs/blogs/${b.slug}`, `/docs/blogs/${b.slug}`, 'blog');
  }
  for (const a of manifest.articles) {
    if (a.dest !== 'tenthmatrix') continue;
    add(`/articles/${a.code}`, `/articles/${a.code}`, 'article');
  }

  // Insights: each manifest file's primary slug plus its aliases, all pointing at
  // Workstation's primary URL. The /insights index is a listing (self-canonical);
  // multi-segment aliases TenthMatrix doesn't serve (/insights/jev/harness) are skipped.
  const { byFile, aliases } = insightRoutes();
  for (const ins of manifest.insights) {
    if (ins.dest !== 'tenthmatrix') continue;
    if (ins.id.startsWith('articles/')) {
      const file = ins.id.slice('articles/'.length);
      const slug = byFile[file];
      if (!slug) continue;
      const primary = `/insights/${slug}`;
      add(primary, primary, 'insight');
      for (const [alias, f] of Object.entries(aliases)) if (f === file) add(`/insights/${alias}`, primary, 'insight');
    } else {
      for (const url of ins.urls) if (url !== '/insights' && pageExists(url)) add(url, url, 'insight');
    }
  }

  // Marketing routes copied from Workstation that TenthMatrix still serves unchanged.
  for (const r of manifest.routes) {
    if (!['tenthmatrix', 'both'].includes(r.dest)) continue;
    if (!r.path.startsWith('/') || r.path.includes('[') || r.path.startsWith('/api/')) continue;
    if (r.path.startsWith('/insights')) continue; // handled above
    const tmPath = RENAMED_ROUTES[r.path] || r.path;
    if (!pageExists(tmPath)) continue;
    add(tmPath, r.path, 'page');
  }

  const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
  return {
    _comment:
      'GENERATED by scripts/migration/build-seo-canonical.mjs from migration/manifest.json. Do not hand-edit. TenthMatrix path (no locale) -> Workstation path; full URL is https://www.workstation.co.uk/{locale}{workstation}.',
    origin: WORKSTATION_ORIGIN,
    entries: sorted,
  };
}

export const serialise = (map) => `${JSON.stringify(map, null, 2)}\n`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const map = buildCanonicalMap();
  const text = serialise(map);
  const counts = {};
  for (const e of Object.values(map.entries)) counts[e.kind] = (counts[e.kind] || 0) + 1;
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    if (current !== text) {
      console.error('✗ src/lib/seoCanonical.json is stale — run node scripts/migration/build-seo-canonical.mjs');
      process.exit(1);
    }
    console.log(`✓ seoCanonical.json up to date (${JSON.stringify(counts)})`);
  } else {
    fs.writeFileSync(OUT_FILE, text);
    console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}: ${Object.keys(map.entries).length} paths ${JSON.stringify(counts)}`);
  }
}
