import cx from './cx';
import Eyebrow from './Eyebrow';
import Button from './Button';
import LatticeArt from './LatticeArt';
import s from './CTA.module.scss';

/**
 * Call-to-action band.
 *
 * props:
 *   eyebrow, title (h2 by default, `headingLevel` to change), body
 *   primary    { label, href }
 *   secondary  { label, href }
 *   tone       'night' (default: dark in both themes) | 'accent' (mint wash)
 *   art        lattice illustration on wide screens (default true)
 */
export default function CTA({ eyebrow, title, body, primary, secondary, tone = 'night', headingLevel: H = 'h2', art = true, id, className, children }) {
  return (
    <section id={id} className={cx('tm-cta', s.band, s[tone], className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className={s.wrap}>
        <div className={s.panel}>
          <div className={s.copy}>
            {eyebrow ? <Eyebrow className={s.eyebrow}>{eyebrow}</Eyebrow> : null}
            <H id={id ? `${id}-title` : undefined} className={s.title}>
              {title}
            </H>
            {body ? <p className={s.body}>{body}</p> : null}
            {children}
            {primary || secondary ? (
              <div className={s.actions}>
                {primary ? (
                  <Button href={primary.href} variant={tone === 'night' ? 'night' : 'primary'} size="lg" arrow>
                    {primary.label}
                  </Button>
                ) : null}
                {secondary ? (
                  <Button href={secondary.href} variant="secondary" size="lg" className={s.secondary}>
                    {secondary.label}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          {art ? (
            <div className={s.art}>
              <LatticeArt cols={9} rows={7} at={[1, 3]} density="sparse" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
