import Link from 'next/link';
import cx from './cx';
import s from './FeatureGrid.module.scss';

/**
 * Icon + title + text list, for "what it does" sections.
 * props:
 *   items         [{ icon?: LucideComponent, title, body, href?, linkLabel? }]
 *   columns       2 | 3 (default) | 4
 *   headingLevel  'h3' (default)
 *   variant       'plain' (default, hairline-separated) | 'cards'
 */
export default function FeatureGrid({ items = [], columns = 3, headingLevel: H = 'h3', variant = 'plain', className }) {
  return (
    <ul className={cx('tm-feature-grid', s.grid, s[`cols-${columns}`], s[variant], className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <li key={item.title || i} className={s.item}>
            {Icon ? (
              <span className={s.icon} aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
            ) : null}
            <H className={s.title}>{item.title}</H>
            {item.body ? <p className={s.body}>{item.body}</p> : null}
            {item.href ? (
              <Link href={item.href} className={s.link}>
                {item.linkLabel || item.title}
                <span aria-hidden="true"> →</span>
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
