import { Check } from 'lucide-react';
import styles from './CheckList.module.scss';
import RichText from './RichText';

/** Bulleted list with check marks. columns: 1 | 2 */
export default function CheckList({ items, columns = 1, variant = 'check' }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <ul className={`${styles.list} ${columns === 2 ? styles.two : ''} ${styles[variant] || ''}`}>
      {list.map((it, i) => (
        <li key={i}>
          {variant === 'check' ? (
            <Check size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <span className={styles.cell} aria-hidden="true" />
          )}
          <RichText as="span" text={typeof it === 'string' ? it : it.title || it.label} />
        </li>
      ))}
    </ul>
  );
}
