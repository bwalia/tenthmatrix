import cx from './cx';
import s from './Eyebrow.module.scss';

/**
 * Mono uppercase label above headings.
 * props: as ('p' default), marker (accent "tenth cell" square, default true), tone ('subtle' | 'accent'), children
 */
export default function Eyebrow({ as: Tag = 'p', marker = true, tone = 'subtle', className, children, ...rest }) {
  return (
    <Tag className={cx('tm-eyebrow', s.eyebrow, marker && s.marker, tone === 'accent' && s.accent, className)} {...rest}>
      {children}
    </Tag>
  );
}
