// Link helpers for page JSON copied from Workstation. JSON hrefs are
// locale-less ("/contact-us"); hardware routes stay on Workstation; the shop
// is never linked from TenthMatrix.
import { locales } from '@/utils/getMessages';

export const WORKSTATION_URL = 'https://www.workstation.co.uk';

// Routes that stayed on Workstation (migration/manifest.json, dest "workstation").
const WORKSTATION_PATHS = [
  '/ai-financial-services', '/ai-healthcare', '/ai-industries', '/ai-labs', '/ai-sme-packages',
  '/ai-startups', '/ai-workstations', '/edge-ai', '/gpu-clusters', '/gpu-vs-workstations', '/login',
  '/mlops-setup', '/partners/boston', '/private-ai',
];

// Paths renamed on the way over (migration/redirects.json).
const RENAMED = { '/why-workstation': '/why-tenthmatrix' };

const LOCALE_RE = new RegExp(`^/(${locales.join('|')})(/|$)`);

export function isExternal(href) {
  return /^(https?:)?\/\//i.test(href || '') || /^(mailto|tel):/i.test(href || '');
}

/** Shop links (shop app, /shop route, cart/checkout) are dropped everywhere. */
export function isShopLink(href) {
  if (!href || typeof href !== 'string') return false;
  return /shop\.workstation\.co\.uk|^\/?shop(\/|$|\?)|\/(cart|checkout)(\/|$)/i.test(href.trim());
}

/** Locale-prefix internal paths; send hardware paths to Workstation. */
export function localeHref(href, locale) {
  if (!href || typeof href !== 'string') return '#';
  const h = href.trim();
  if (isExternal(h) || h.startsWith('#')) return h;
  if (!h.startsWith('/')) return h;
  if (/\.[a-z0-9]{2,5}$/i.test(h.split(/[?#]/)[0])) return h; // static file
  if (LOCALE_RE.test(h)) return h;
  const [path, rest = ''] = h.split(/(?=[?#])/);
  const clean = path.replace(/\/$/, '') || '/';
  if (WORKSTATION_PATHS.some((p) => clean === p || clean.startsWith(`${p}/`))) {
    return `${WORKSTATION_URL}${clean}${rest}`;
  }
  const renamed = RENAMED[clean] || clean;
  return `/${locale}${renamed === '/' ? '' : renamed}${rest}`;
}

/** Props for an <a>: external links open in a new tab with rel. */
export function linkProps(href, locale) {
  const resolved = localeHref(href, locale);
  return isExternal(resolved) && !/^(mailto|tel):/i.test(resolved)
    ? { href: resolved, target: '_blank', rel: 'noopener noreferrer' }
    : { href: resolved };
}

/** Filter an array of link-ish items, removing any that point at the shop. */
export function withoutShop(items, ...keys) {
  const k = keys.length ? keys : ['href', 'link', 'buttonLink', 'url', 'ctaHref'];
  return (items || []).filter((it) => it && !k.some((key) => isShopLink(it[key])));
}
