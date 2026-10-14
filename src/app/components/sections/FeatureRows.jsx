import { PlayCircle } from 'lucide-react';
import styles from './FeatureRows.module.scss';
import { Paragraphs } from './RichText';
import ActionLink from './ActionLink';
import CheckList from './CheckList';

const img = (src) => (!src ? null : /^(https?:)?\/\//.test(src) || src.startsWith('/') ? src : `/img/${src}`);
const watchUrl = (v) => {
  const m = String(v || '').match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
};

/**
 * Alternating image + copy rows.
 * items: [{ eyebrow|prehead|section, title, description, image|asset, imageAlt, href|link, cta, video, list }]
 */
export default function FeatureRows({ items, locale, watchLabel, headingLevel = 3 }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <ol className={styles.rows}>
      {list.map((it, i) => {
        const src = img(it.image || it.asset);
        const eyebrow = it.eyebrow || it.prehead || (it.title ? it.section : null);
        const title = it.title || it.section;
        const watch = watchUrl(it.video);
        return (
          <li key={i} className={`${styles.row} ${i % 2 ? styles.reverse : ''} ${src ? styles.withMedia : ''}`}>
            {src && (
              <div className={styles.media}>
                <img src={src} alt={it.imageAlt || ''} loading="lazy" width={1200} height={800} />
              </div>
            )}
            <div className={styles.copy}>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              {title && <H className={styles.title}>{title}</H>}
              <Paragraphs text={it.description} className={styles.text} />
              {it.list?.length > 0 && (
                <div className={styles.list}>
                  <CheckList items={it.list} columns={2} variant="cell" />
                </div>
              )}
              {(it.cta || watch) && (
                <div className={styles.actions}>
                  {it.cta && (it.href || it.link) && (
                    <ActionLink href={it.href || it.link} locale={locale} variant="secondary">
                      {it.cta}
                    </ActionLink>
                  )}
                  {watch && watchLabel && (
                    <a href={watch} target="_blank" rel="noopener noreferrer" className={styles.watch}>
                      <PlayCircle size={18} strokeWidth={1.75} aria-hidden="true" />
                      {watchLabel}
                      <span className="tm-visually-hidden">: {title}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
