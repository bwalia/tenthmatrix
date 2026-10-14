// Shared data loading + metadata for the marketing/product routes.
import { loadLocaleData } from '@/utils/loadLocaleData';
import { locales } from '@/utils/getMessages';

export const SITE_URL = 'https://www.tenthmatrix.com';

/** Page JSON for a locale (falls back to en); null if the file is missing. */
export async function loadPage(file, locale) {
  try {
    return await loadLocaleData(file, locale);
  } catch {
    return null;
  }
}

/** Every locale for generateStaticParams (the [locale] layout validates). */
export function localeParams() {
  return locales.map((locale) => ({ locale }));
}

function clip(text, max = 160) {
  if (!text) return undefined;
  const plain = String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > max ? `${plain.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : plain;
}

/**
 * title / description / keywords / canonical / hreflang / OG for a route.
 * Titles that already carry the brand are used as-is; others get the
 * root layout's "%s | TenthMatrix" template.
 */
export function pageMetadata({ locale, route, data, title, description }) {
  const raw = data?.meta?.title || title || data?.header?.title || data?.hero?.title || 'TenthMatrix';
  // Drop a leftover "| Workstation" brand suffix; the layout template adds ours.
  const t = String(raw).replace(/\s*[|–—-]\s*Workstation(\s+AI)?\s*$/i, '').trim();
  const d = clip(
    data?.meta?.description ||
      description ||
      data?.header?.description ||
      data?.header?.subtitle ||
      data?.hero?.description ||
      data?.hero?.subtitle
  );
  const canonical = `${SITE_URL}/${locale}${route}`;
  const branded = /tenthmatrix/i.test(t);
  return {
    title: branded ? { absolute: t } : t,
    description: d,
    keywords: data?.meta?.keywords || undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${route}`])),
    },
    openGraph: {
      type: 'website',
      siteName: 'TenthMatrix',
      url: canonical,
      title: branded ? t : `${t} | TenthMatrix`,
      description: d,
      locale,
    },
    twitter: { card: 'summary_large_image', title: branded ? t : `${t} | TenthMatrix`, description: d },
  };
}
