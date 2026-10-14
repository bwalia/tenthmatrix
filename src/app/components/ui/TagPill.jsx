import Link from 'next/link';
import cx from './cx';
import s from './TagPill.module.scss';

/**
 * Tag / topic pill.
 * props: href (renders a link), active (aria-current="page" + filled), count, size ('sm' | 'md'), children
 */
export default function TagPill({ href, active = false, count, size = 'md', className, children, prefetch, ...rest }) {
  const cls = cx('tm-tag', s.pill, s[size], active && s.active, href && s.link, className);
  const body = (
    <>
      <span>{children}</span>
      {typeof count === 'number' ? <span className={s.count}>{count}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-current={active ? 'page' : undefined} prefetch={prefetch} {...rest}>
        {body}
      </Link>
    );
  }
  return (
    <span className={cls} {...rest}>
      {body}
    </span>
  );
}
