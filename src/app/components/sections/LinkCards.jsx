import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './LinkCards.module.scss';
import { linkProps, withoutShop, isExternal, localeHref } from './links';

/** Related-reading links. items: [{ title|label, href, label|description }] */
export default function LinkCards({ items, locale, variant = 'cards' }) {
  const list = withoutShop(items).filter((i) => i.href);
  if (!list.length) return null;
  return (
    <ul className={`${styles.list} ${styles[variant] || ''}`}>
      {list.map((it, i) => {
        const title = it.title || it.label;
        const sub = it.title ? it.label || it.description : it.description;
        const ext = it.external || isExternal(localeHref(it.href, locale));
        const Arrow = ext ? ArrowUpRight : ArrowRight;
        return (
          <li key={`${it.href}-${i}`}>
            <a {...linkProps(it.href, locale)} className={styles.link}>
              <span className={styles.text}>
                <span className={styles.title}>{title}</span>
                {sub && <span className={styles.sub}>{sub}</span>}
              </span>
              <Arrow size={18} strokeWidth={1.75} aria-hidden="true" className={styles.arrow} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
