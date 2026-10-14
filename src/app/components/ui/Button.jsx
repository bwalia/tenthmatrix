import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import cx from './cx';
import s from './Button.module.scss';

const isExternal = (href = '') => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');

/**
 * Button / link-button.
 *
 * props:
 *   variant   'primary' | 'secondary' | 'tertiary' | 'night'  (night = light-on-dark, for dark bands)
 *   size      'sm' | 'md' | 'lg'
 *   href      renders a link (next/link for internal paths, <a> for external)
 *   icon      a lucide-react component shown before the label
 *   arrow     true | 'external' — trailing arrow (external = diagonal); tertiary defaults to true
 *   block     full width
 *   ...rest   passed to the underlying <button>/<a> (type, onClick, aria-*, disabled …)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon: Icon,
  arrow,
  block = false,
  className,
  children,
  prefetch,
  ...rest
}) {
  const external = href ? isExternal(href) : false;
  const showArrow = arrow ?? (variant === 'tertiary' ? true : false);
  const Arrow = showArrow === 'external' || (showArrow && external && !href?.startsWith('mailto:')) ? ArrowUpRight : ArrowRight;
  const cls = cx('tm-button', s.btn, s[variant], s[size], block && s.block, className);
  const content = (
    <>
      {Icon ? <Icon className={s.icon} aria-hidden="true" size={18} strokeWidth={1.75} /> : null}
      <span className={s.label}>{children}</span>
      {showArrow ? <Arrow className={cx(s.icon, s.arrow)} aria-hidden="true" size={18} strokeWidth={1.75} /> : null}
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} rel="noopener" {...rest}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} prefetch={prefetch} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {content}
    </button>
  );
}
