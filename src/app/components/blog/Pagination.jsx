import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import s from './Pagination.module.scss';

function pageList(current, total) {
  const set = new Set([1, total, current, current - 1, current + 1]);
  const pages = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((n, i) => {
    if (i && n - pages[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

/**
 * Numbered pagination. firstHref = page 1 URL (e.g. /en/docs/blogs);
 * pageHref = prefix for N >= 2 (e.g. /en/docs/blogs/page → /page/2).
 */
export default async function Pagination({ locale, currentPage, totalPages, firstHref, pageHref }) {
  if (!totalPages || totalPages <= 1) return null;
  const t = await getTranslations({ locale, namespace: 'common' });
  const href = (n) => (n <= 1 ? firstHref : `${pageHref}/${n}`);
  return (
    <nav className={`tm-pagination ${s.nav}`} aria-label={t('pagination')}>
      {currentPage > 1 ? (
        <Link rel="prev" href={href(currentPage - 1)} className={`${s.step} ${s.prev}`}>
          <ChevronLeft aria-hidden="true" size={18} />
          <span>{t('previous')}</span>
        </Link>
      ) : (
        <span className={`${s.step} ${s.prev}`} aria-hidden="true" data-disabled="true">
          <ChevronLeft size={18} />
          <span>{t('previous')}</span>
        </span>
      )}
      <ol className={s.pages}>
        {pageList(currentPage, totalPages).map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} className={s.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              {n === currentPage ? (
                <span className={s.page} aria-current="page">
                  <span className="tm-visually-hidden">{t('pageLabel')} </span>
                  {n}
                </span>
              ) : (
                <Link href={href(n)} className={s.page} aria-label={t('goToPage', { page: n })}>
                  {n}
                </Link>
              )}
            </li>
          )
        )}
      </ol>
      {currentPage < totalPages ? (
        <Link rel="next" href={href(currentPage + 1)} className={`${s.step} ${s.next}`}>
          <span>{t('next')}</span>
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      ) : (
        <span className={`${s.step} ${s.next}`} aria-hidden="true" data-disabled="true">
          <span>{t('next')}</span>
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
