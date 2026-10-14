// Cross-domain canonicals to www.workstation.co.uk for pages that are still
// copies of a Workstation original. Data: ./seoCanonical.json, generated from
// migration/manifest.json by scripts/migration/build-seo-canonical.mjs.
//
// A canonicalised page:
//   - declares <link rel="canonical"> to the Workstation URL (same locale),
//   - carries no hreflang (hreflang only counts on canonical URLs, and
//     alternates pointing at our own locale copies would contradict the canonical),
//   - keeps robots index,follow (canonical is a hint; Google consolidates signals),
//   - is left out of public/sitemap.xml,
//   - points JSON-LD mainEntityOfPage / url at the Workstation URL.
// Anything not in the JSON (rewritten pages, new pages, CMS-only posts) is
// self-canonical on www.tenthmatrix.com.
import map from './seoCanonical.json';

export const SITE_URL = 'https://www.tenthmatrix.com';
export const WORKSTATION_ORIGIN = map.origin;

const norm = (p) => `/${String(p || '').replace(/^\/+|\/+$/g, '')}`;

/** Workstation URL for a TenthMatrix path (no locale prefix), or null if self-canonical. */
export function workstationCanonical(route, locale) {
  const entry = map.entries[norm(route)];
  return entry ? `${WORKSTATION_ORIGIN}/${locale}${entry.workstation}` : null;
}

export const isCanonicalisedAway = (route) => Boolean(map.entries[norm(route)]);

/** The canonical URL for a TenthMatrix route: Workstation's if copied, else ours. */
export function canonicalUrl(route, locale) {
  const r = norm(route);
  return workstationCanonical(r, locale) || `${SITE_URL}/${locale}${r === '/' ? '' : r}`;
}

/**
 * `alternates` for generateMetadata. Self-canonical pages get `selfCanonical`
 * (defaults to the absolute TenthMatrix URL) plus `languages` if given;
 * canonicalised pages get the Workstation URL and no hreflang.
 */
export function seoAlternates(route, locale, { selfCanonical, languages } = {}) {
  const ws = workstationCanonical(route, locale);
  if (ws) return { canonical: ws };
  return { canonical: selfCanonical || canonicalUrl(route, locale), ...(languages ? { languages } : {}) };
}
