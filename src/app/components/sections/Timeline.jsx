import styles from './Timeline.module.scss';
import Icon from './Icon';
import { isMappedIcon } from './iconMap';
import RichText from './RichText';

/**
 * Dated entries (news, announcements, roadmap).
 * items: [{ date|status, title, summary|excerpt|description, source, icon }]
 */
export default function Timeline({ items, headingLevel = 3 }) {
  const list = (items || []).filter((x) => x && x.title);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <ol className={styles.timeline}>
      {list.map((it, i) => (
        <li key={i} className={styles.item}>
          <div className={styles.when}>
            {it.date && <time dateTime={toIso(it.date)}>{it.date}</time>}
            {it.status && <span className={styles.status}>{it.status}</span>}
          </div>
          <div className={styles.body}>
            <H className={styles.title}>
              {it.icon && isMappedIcon(it.icon) && (
                <span className={styles.icon}>
                  <Icon name={it.icon} size={16} />
                </span>
              )}
              {it.title}
            </H>
            <RichText text={it.summary || it.excerpt || it.description} className={styles.text} />
            {it.source && <p className={styles.source}>{it.source}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function toIso(d) {
  const t = Date.parse(d);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
}
