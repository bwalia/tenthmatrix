import cx from './cx';
import Eyebrow from './Eyebrow';
import s from './Section.module.scss';

/**
 * Page section with an optional header (eyebrow, title, lede, actions).
 *
 * props:
 *   id            anchor id; the title gets `${id}-title` and labels the section
 *   eyebrow       string
 *   title         string | node
 *   headingLevel  'h2' (default) | 'h3'
 *   lede          string | node
 *   actions       node, shown at the end of the header (e.g. a tertiary Button)
 *   tone          'default' | 'sunken' | 'surface' | 'night'
 *   width         'default' | 'narrow' | 'wide'
 *   align         'start' (default) | 'center'
 *   spacing       'default' | 'compact' | 'none'
 *   divider       top hairline (default false)
 */
export default function Section({
  id,
  eyebrow,
  title,
  headingLevel: H = 'h2',
  lede,
  actions,
  tone = 'default',
  width = 'default',
  align = 'start',
  spacing = 'default',
  divider = false,
  className,
  children,
  ...rest
}) {
  const titleId = title && id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cx('tm-section', s.section, s[`tone-${tone}`], s[`space-${spacing}`], divider && s.divider, className)}
      {...rest}
    >
      <div className={cx(s.inner, s[`w-${width}`])}>
        {title || eyebrow || lede ? (
          <header className={cx(s.head, align === 'center' && s.center, actions && s.withActions)}>
            <div className={s.headCopy}>
              {eyebrow ? <Eyebrow >{eyebrow}</Eyebrow> : null}
              {title ? (
                <H id={titleId} className={s.title}>
                  {title}
                </H>
              ) : null}
              {lede ? <p className={s.lede}>{lede}</p> : null}
            </div>
            {actions ? <div className={s.actions}>{actions}</div> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
