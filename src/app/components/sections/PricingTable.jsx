import { Check } from 'lucide-react';
import styles from './PricingTable.module.scss';
import ActionLink from './ActionLink';

/**
 * Plan cards. plans: [{ name, price, period, description, features[], cta, featured, badge, href }]
 * ctaHref is used when a plan has no href (JSON plans usually only carry a label).
 */
export default function PricingTable({ plans, locale, ctaHref = '/contact-us', popularLabel, headingLevel = 3 }) {
  const list = (plans || []).filter(Boolean);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  const anyFeatured = list.some((p) => p.featured);
  return (
    <ul className={`${styles.plans} ${list.length === 2 ? styles.two : ''}`}>
      {list.map((p, i) => {
        const featured = p.featured || (!anyFeatured && list.length === 3 && i === 1 && popularLabel);
        const badge = p.badge || (featured ? popularLabel : null);
        return (
          <li key={p.name || i} className={`${styles.plan} ${featured ? styles.featured : ''}`}>
            {badge && <p className={styles.badge}>{badge}</p>}
            <H className={styles.name}>{p.name}</H>
            {(p.price || p.starting_from) && (
              <p className={styles.price}>
                <span className={styles.amount}>{p.price || p.starting_from}</span>
                {p.period && <span className={styles.period}>{p.period}</span>}
              </p>
            )}
            {p.description && <p className={styles.desc}>{p.description}</p>}
            {p.features?.length > 0 && (
              <ul className={styles.features}>
                {p.features.map((f, j) => (
                  <li key={j}>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {p.cta && (
              <div className={styles.cta}>
                <ActionLink href={p.href || p.link || ctaHref} locale={locale} variant={featured ? 'primary' : 'secondary'} block>
                  {p.cta}
                </ActionLink>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
