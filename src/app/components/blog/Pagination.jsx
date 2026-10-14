import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/**
 * Prev / next + "Page N of M". `base` is the path WITHOUT the page segment,
 * e.g. `/en/docs/blogs` (page 1) and `/en/docs/blogs/page` (page N >= 2).
 */
export default async function Pagination({ locale, currentPage, totalPages, firstHref, pageHref }) {
  if (!totalPages || totalPages <= 1) return null;
  const t = await getTranslations({ locale, namespace: 'common' });
  const href = (n) => (n <= 1 ? firstHref : `${pageHref}/${n}`);
  return (
    <nav className="tm-pagination" aria-label={t('pagination')}>
      {currentPage > 1 ? (
        <Link rel="prev" href={href(currentPage - 1)} className="tm-tap">
          {t('previous')}
        </Link>
      ) : null}
      <span aria-current="page">{t('page', { page: currentPage, total: totalPages })}</span>
      {currentPage < totalPages ? (
        <Link rel="next" href={href(currentPage + 1)} className="tm-tap">
          {t('next')}
        </Link>
      ) : null}
    </nav>
  );
}
