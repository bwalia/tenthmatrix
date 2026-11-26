import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import s from './work.module.scss';

/**
 * One piece of client work. AI cases (with a page) link to /our-work/<slug>;
 * track-record cards show the sector, a summary and up to three results.
 */
export default function CaseCard({ item, locale, ui, compact = false }) {
  const headline = item.headline || item.results?.[0];
  const href = item.groupKey === 'ai' ? `/${locale}/our-work/${item.slug}` : null;
  return (
    <article className={s.case}>
      <div className={s.caseTop}>
        <span className={s.caseTag}>{item.industryLabel}</span>
        {item.size && item.disclosure ? <span className={s.caseTag}>{item.size.split('(')[0].trim()}</span> : null}
      </div>
      <h3 className={s.caseTitle}>{item.company}</h3>
      <p className={s.caseSummary}>{item.summary}</p>
      {item.groupKey === 'ai' && headline ? (
        <p className={s.caseFigure}>
          <strong>{headline.value}</strong> <span>{String(headline.label).replace(/\s*\([^)]*\)$/, '')}</span>
        </p>
      ) : null}
      {item.groupKey !== 'ai' && !compact && item.results?.length ? (
        <ul className={s.caseResults}>
          {item.results.map((r) => (
            <li key={r.value}>{r.label ? `${r.value} ${r.label}` : r.value}</li>
          ))}
        </ul>
      ) : null}
      {href ? (
        <Link href={href} className={s.caseLink} prefetch={false}>
          <span>{ui.readCase}</span>
          <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
          <span className="tm-visually-hidden">: {item.company}</span>
        </Link>
      ) : null}
    </article>
  );
}
