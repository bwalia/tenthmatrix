import { Plus } from 'lucide-react';
import styles from './FaqAccordion.module.scss';
import RichText from './RichText';

/** Native <details> accordion: works without JS, keyboard accessible. An item may pass `content` (a node) instead of `answer`. */
export default function FaqAccordion({ items, headingLevel = 3, wide = false }) {
  const list = (items || []).filter((q) => q && (q.question || q.q));
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <div className={`${styles.faq} ${wide ? styles.wide : ''}`}>
      {list.map((q, i) => (
        <details key={i} className={styles.item}>
          <summary className={styles.summary}>
            <H className={styles.q}>{q.question || q.q}</H>
            <Plus size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          </summary>
          <div className={styles.answer}>
            {q.content ? q.content : <RichText text={q.answer || q.a} />}
          </div>
        </details>
      ))}
    </div>
  );
}
