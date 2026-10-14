import styles from './Steps.module.scss';
import RichText from './RichText';

/**
 * Ordered process. steps: [{ step|n|phase, title, description|text, duration, items|tasks|steps }]
 * layout: "row" (horizontal on desktop) | "list" (vertical rail)
 */
export default function Steps({ steps, layout = 'row', headingLevel = 3 }) {
  const list = (steps || []).filter(Boolean);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <ol className={`${styles.steps} ${styles[layout] || ''}`} style={{ '--steps-cols': list.length <= 4 ? list.length : list.length % 4 === 0 ? 4 : 3 }}>
      {list.map((s, i) => {
        if (typeof s === 'string') s = { title: s };
        const sub = s.items || s.tasks || s.steps;
        return (
          <li key={i} className={styles.step}>
            <span className={styles.marker} aria-hidden="true">
              {String(s.step || s.n || i + 1).replace(/^0?(\d)$/, '0$1')}
            </span>
            <div className={styles.body}>
              {s.phase && s.title && <p className={styles.phase}>{s.phase}</p>}
              <H className={styles.title}>{s.title || s.phase}</H>
              {s.duration && <p className={styles.duration}>{s.duration}</p>}
              <RichText text={s.description || s.text} className={styles.text} />
              {Array.isArray(sub) && sub.length > 0 && (
                <ul className={styles.sub}>
                  {sub.map((t, j) => (
                    <li key={j}>
                      <RichText as="span" text={t} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
