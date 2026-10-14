import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import cx from './cx';
import s from './Breadcrumbs.module.scss';

/**
 * props: items [{ label, href? }] (last item = current page, no href), label (nav aria-label, e.g. t('common.breadcrumb'))
 */
export default function Breadcrumbs({ items = [], label = 'Breadcrumb', className }) {
  if (!items.length) return null;
  return (
    <nav aria-label={label} className={cx('tm-breadcrumbs', s.nav, className)}>
      <ol className={s.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={s.item}>
              {item.href && !last ? (
                <Link href={item.href} className={s.link}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={s.current}>
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRight aria-hidden="true" size={14} strokeWidth={2} className={s.sep} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
