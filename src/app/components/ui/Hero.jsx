import cx from './cx';
import Eyebrow from './Eyebrow';
import Button from './Button';
import LatticeArt from './LatticeArt';
import s from './Hero.module.scss';

/**
 * Page hero. Renders the page's single <h1>.
 *
 * props:
 *   variant  'page' (default) | 'home' (display size, art on the right)
 *   eyebrow  string
 *   title    string | node (h1)
 *   lede     string | node
 *   actions  [{ label, href, variant?, arrow? }] or a node
 *   meta     string[] — mono facts under the actions ("Self-hosted", "Open source" …)
 *   art      true (lattice illustration) | false | node (custom media)
 *   align    'start' (default) | 'center'  (center ignores art)
 *   children extra content under the lede
 */
export default function Hero({ variant = 'page', eyebrow, title, lede, actions, meta, art = variant === 'home', align = 'start', className, children }) {
  const showArt = art && align !== 'center';
  return (
    <section className={cx('tm-hero', s.hero, s[variant], align === 'center' && s.center, showArt && s.withArt, className)}>
      <div className={s.inner}>
        <div className={s.copy}>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className={s.title}>{title}</h1>
          {lede ? <p className={s.lede}>{lede}</p> : null}
          {children}
          {actions ? (
            <div className={s.actions}>
              {Array.isArray(actions)
                ? actions.map((a, i) => (
                    <Button key={`${i}-${a.href}`} href={a.href} variant={a.variant || (i === 0 ? 'primary' : 'secondary')} size={variant === 'home' ? 'lg' : 'md'} arrow={a.arrow}>
                      {a.label}
                    </Button>
                  ))
                : actions}
            </div>
          ) : null}
          {meta?.length ? (
            <ul className={s.meta}>
              {meta.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {showArt ? <div className={s.art}>{art === true ? <LatticeArt /> : art}</div> : null}
      </div>
    </section>
  );
}
