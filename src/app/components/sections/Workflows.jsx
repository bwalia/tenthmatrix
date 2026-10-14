import styles from './Workflows.module.scss';
import MediaFigure from './MediaFigure';
import RichText from './RichText';

/**
 * Alternating story rows: [{ eyebrow, title, pain, solution, result, steps[], diagram }]
 * labels: { pain, solution, result }
 */
export default function Workflows({ items, labels = {}, headingLevel = 3 }) {
  const list = (items || []).filter((i) => i && i.title);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <ol className={styles.list}>
      {list.map((it, i) => (
        <li key={i} className={`${styles.row} ${it.diagram?.src ? styles.withMedia : ''} ${i % 2 ? styles.reverse : ''}`}>
          <div className={styles.copy}>
            {it.eyebrow && <p className={styles.eyebrow}>{it.eyebrow}</p>}
            <H className={styles.title}>{it.title}</H>
            <dl className={styles.facts}>
              {it.pain && (
                <div>
                  <dt>{labels.pain}</dt>
                  <dd>
                    <RichText as="span" text={it.pain} />
                  </dd>
                </div>
              )}
              {it.solution && (
                <div>
                  <dt className={styles.good}>{labels.solution}</dt>
                  <dd>
                    <RichText as="span" text={it.solution} />
                  </dd>
                </div>
              )}
              {it.result && (
                <div>
                  <dt>{labels.result}</dt>
                  <dd>
                    <RichText as="span" text={it.result} />
                  </dd>
                </div>
              )}
            </dl>
            {it.steps?.length > 0 && (
              <ol className={styles.steps}>
                {it.steps.map((s, j) => (
                  <li key={j}>
                    <RichText as="span" text={s} />
                  </li>
                ))}
              </ol>
            )}
          </div>
          {it.diagram?.src && (
            <div className={styles.media}>
              <MediaFigure media={it.diagram} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
