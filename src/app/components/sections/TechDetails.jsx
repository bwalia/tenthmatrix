import { ChevronDown } from 'lucide-react';
import s from './TechDetails.module.scss';

/**
 * Layer 3 of every page: the technical detail, closed by default so the plain
 * story reads first. Native <details> (keyboard and screen-reader friendly,
 * works without JS in the static export).
 *   items: string[] (bullets) and/or children
 */
export default function TechDetails({ summary, intro, items, children, open = false }) {
  const list = (items || []).filter(Boolean);
  if (!list.length && !children && !intro) return null;
  return (
    <details className={s.details} open={open}>
      <summary className={s.summary}>
        <span>{summary}</span>
        <ChevronDown aria-hidden="true" size={18} strokeWidth={2} className={s.chev} />
      </summary>
      <div className={s.body}>
        {intro ? <p className={s.intro}>{intro}</p> : null}
        {list.length ? (
          <ul className={s.list}>
            {list.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        ) : null}
        {children}
      </div>
    </details>
  );
}
