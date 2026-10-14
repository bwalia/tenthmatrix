import Link from 'next/link';
import cx from './cx';
import s from './Card.module.scss';

/**
 * Surface panel.
 * props:
 *   as         element ('div' default; 'article', 'li', 'section' …)
 *   href       makes the whole card one link (children must not contain other links)
 *   tone       'surface' (default) | 'sunken' | 'accent' | 'night'
 *   padding    'none' | 'sm' | 'md' (default) | 'lg'
 *   interactive  hover lift + border (implied by href)
 */
export default function Card({ as: Tag = 'div', href, tone = 'surface', padding = 'md', interactive, className, children, ...rest }) {
  const cls = cx('tm-card', s.card, s[tone], s[`p-${padding}`], (interactive || href) && s.interactive, className);
  if (href) {
    return (
      <Link href={href} className={cx(cls, s.link)} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
