import s from './work.module.scss';

/** Headline numbers: [{ value, label }]. Value first, big; label underneath. */
export default function ProofStats({ items }) {
  const list = (items || []).filter((i) => i?.value);
  if (!list.length) return null;
  return (
    <dl className={s.stats}>
      {list.map((st) => (
        <div key={`${st.value}-${st.label}`} className={s.stat}>
          <dt className={s.statLabel}>{st.label}</dt>
          <dd className={s.statValue}>{st.value}</dd>
        </div>
      ))}
    </dl>
  );
}
