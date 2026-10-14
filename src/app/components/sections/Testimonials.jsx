import styles from './Testimonials.module.scss';
import RichText from './RichText';

/**
 * Quotes. items: [{ quote|message, author|by, position, company, avatar|logo, website, metrics{}, tags[] }]
 */
export default function Testimonials({ items, columns = 3, metricLabels = {} }) {
  const list = (items || []).filter((t) => t && (t.quote || t.message));
  if (!list.length) return null;
  return (
    <ul className={`${styles.grid} ${columns === 2 ? styles.two : ''}`}>
      {list.map((t, i) => {
        const who = t.author || t.by;
        const org = [t.position, t.company].filter(Boolean).join(', ');
        const img = t.avatar || t.logo;
        return (
          <li key={i} className={styles.item}>
            <figure className={styles.card}>
              {(t.company || t.industry) && t.message && (
                <p className={styles.org}>
                  {t.company}
                  {t.industry && <span>{t.industry}</span>}
                </p>
              )}
              <blockquote className={styles.quote}>
                <RichText text={t.quote || t.message} />
              </blockquote>
              {t.metrics && (
                <dl className={styles.metrics}>
                  {Object.entries(t.metrics).map(([k, v]) => (
                    <div key={k}>
                      <dt>{metricLabels[k] || k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(who || org) && (
                <figcaption className={styles.cite}>
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" loading="lazy" className={styles.avatar} />
                  )}
                  <span>
                    {who && <strong>{who}</strong>}
                    {org && t.quote && <span>{org}</span>}
                    {t.location && <span>{t.location}</span>}
                  </span>
                </figcaption>
              )}
              {t.tags?.length > 0 && (
                <ul className={styles.tags}>
                  {t.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
