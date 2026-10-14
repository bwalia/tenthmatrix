import { renderOgImage } from '@/lib/ogImage';
import { loadPage } from './meta';

/** Default export factory for a route's opengraph-image.js. */
export function ogImage(file, eyebrow = 'TenthMatrix', fallback = 'TenthMatrix') {
  return async function Image({ params }) {
    const { locale } = await params;
    const d = await loadPage(file, locale);
    const raw = d?.meta?.title || d?.header?.title || d?.hero?.title || fallback;
    const title = String(raw).replace(/\s*[|–—-]\s*(Workstation(\s+AI)?|TenthMatrix)\s*$/i, '').trim();
    return renderOgImage({ title, eyebrow });
  };
}
