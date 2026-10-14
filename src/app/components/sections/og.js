import { renderOgImage } from '@/lib/ogImage';
import { loadPage } from './meta';

/** Default export factory for a route's opengraph-image.js. */
export function ogImage(file, eyebrow = 'TenthMatrix', fallback = 'TenthMatrix') {
  return async function Image({ params }) {
    const { locale } = await params;
    const pick = (d) =>
      String(d?.meta?.title || d?.header?.title || d?.hero?.title || fallback)
        .replace(/\s*[|–—-]\s*(Workstation(\s+AI)?|TenthMatrix)\s*$/i, '')
        .trim();
    const title = pick(await loadPage(file, locale));
    // Non-Latin titles fall back to English (see renderOgImage).
    const fallbackTitle = locale === 'en' ? title : pick(await loadPage(file, 'en'));
    return renderOgImage({ title, eyebrow, fallbackTitle });
  };
}
