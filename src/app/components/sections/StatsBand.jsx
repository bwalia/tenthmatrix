import styles from './StatsBand.module.scss';

/** Row of figures: [{ number|count|value, label|title }]. */
export default function StatsBand({ stats, variant = 'band' }) {
  const list = (stats || []).filter((s) => s && (s.number || s.count || s.value));
  if (!list.length) return null;
  return (
    <dl className={`${styles.stats} ${styles[variant] || ''}`} style={{ '--stats-n': Math.min(list.length, 6) }}>
      {list.map((s, i) => (
        <div key={i} className={styles.stat}>
          <dt className={styles.label}>{s.label || s.title}</dt>
          <dd className={styles.value}>{s.number || s.count || s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
