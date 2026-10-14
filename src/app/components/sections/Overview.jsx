import styles from './Overview.module.scss';
import { Paragraphs } from './RichText';
import CheckList from './CheckList';
import MediaFigure from './MediaFigure';
import LinkCards from './LinkCards';

/**
 * Split intro band: heading left, copy right. Optional key points, links and a diagram.
 */
export default function Overview({ id = 'overview', eyebrow, title, content, points, links, media, locale, tone = 'plain' }) {
  if (!title && !content) return null;
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={`${styles.band} ${styles[tone] || ''}`}>
      <div className={styles.inner}>
        <div className={styles.head}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && (
            <h2 id={`${id}-title`} className={styles.title}>
              {title}
            </h2>
          )}
        </div>
        <div className={styles.body}>
          <Paragraphs text={content} className={styles.p} />
          {points?.length > 0 && (
            <div className={styles.points}>
              <CheckList items={points} />
            </div>
          )}
          {links?.length > 0 && (
            <div className={styles.links}>
              <LinkCards items={links} locale={locale} variant="rows" />
            </div>
          )}
        </div>
        {media?.src && (
          <div className={styles.media}>
            <MediaFigure media={media} />
          </div>
        )}
      </div>
    </section>
  );
}
