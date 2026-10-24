import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import cx from './cx';
import s from './ProductCard.module.scss';

const isExternal = (href = '') => /^(https?:)?\/\//.test(href);

/**
 * Product tile. The whole card is clickable (stretched link on the title), so
 * keep other interactive elements out of it.
 *
 * props:
 *   name          product name (heading)
 *   tagline       one line under the name (mono, subtle)
 *   description   short paragraph
 *   href          product page (internal path or external URL)
 *   cta           link text shown at the bottom (e.g. "See Ring Promoter"); defaults to an arrow only
 *   icon          lucide-react component, shown in a 40px accent-soft square
 *   status        small badge, e.g. "Open source", "Beta"
 *   tags          string[] (max ~3)
 *   headingLevel  'h3' (default)
 *   variant       'default' | 'feature' (larger, spans two columns in a .tm-grid on wide screens)
 */
export default function ProductCard({ name, tagline, description, href, cta, icon: Icon, status, tags = [], headingLevel: H = 'h3', variant = 'default', className }) {
  const external = isExternal(href);
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const linkProps = { className: s.link };
  const title = href ? (
    external ? (
      <a href={href} {...(/^(https?:)?\/\//i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...linkProps}>
        {name}
      </a>
    ) : (
      <Link href={href} {...linkProps}>
        {name}
      </Link>
    )
  ) : (
    name
  );
  return (
    <article className={cx('tm-product-card', s.card, s[variant], href && s.clickable, className)}>
      <div className={s.top}>
        {Icon ? (
          <span className={s.icon} aria-hidden="true">
            <Icon size={22} strokeWidth={1.75} />
          </span>
        ) : null}
        {status ? <span className={s.status}>{status}</span> : null}
      </div>
      <H className={s.name}>{title}</H>
      {tagline ? <p className={s.tagline}>{tagline}</p> : null}
      {description ? <p className={s.desc}>{description}</p> : null}
      {tags.length ? (
        <ul className={s.tags}>
          {tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
      {href ? (
        <span className={s.cta} aria-hidden="true">
          {cta ? <span>{cta}</span> : null}
          <Arrow size={18} strokeWidth={1.75} />
        </span>
      ) : null}
    </article>
  );
}
