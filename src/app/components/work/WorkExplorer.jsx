'use client';

import { useMemo, useState } from 'react';
import CaseCard from './CaseCard';
import s from './work.module.scss';

/**
 * Our work, filterable by industry and by problem. Two groups (AI &
 * automation work, Track record) keep their anchors (#ai-work,
 * #track-record) so menu links land on them. Filters are buttons with
 * aria-pressed; the result count is announced politely.
 */
export default function WorkExplorer({ cases, track, groups, filters, ui, locale }) {
  const all = useMemo(() => [...cases, ...track], [cases, track]);
  const industries = useMemo(() => {
    const seen = new Map();
    for (const c of all) if (!seen.has(c.industryKey)) seen.set(c.industryKey, c.industryLabel);
    return [...seen.entries()];
  }, [all]);
  const problems = Object.entries(filters.problems || {});
  const [industry, setIndustry] = useState('');
  const [problem, setProblem] = useState('');

  const match = (c) => (!industry || c.industryKey === industry) && (!problem || c.problemKeys?.includes(problem));
  const ai = cases.filter(match);
  const tr = track.filter(match);
  const shown = ai.length + tr.length;
  const filtered = Boolean(industry || problem);

  const chip = (active, onClick, label, key) => (
    <button key={key} type="button" className={s.chip} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <>
      <div className={s.filters} role="group" aria-label={filters.label}>
        <div className={s.filterRow}>
          <span className={s.filterName}>{filters.industry}</span>
          {chip(!industry, () => setIndustry(''), filters.all, 'all')}
          {industries.map(([key, label]) => chip(industry === key, () => setIndustry(industry === key ? '' : key), label, key))}
        </div>
        <div className={s.filterRow}>
          <span className={s.filterName}>{filters.problem}</span>
          {chip(!problem, () => setProblem(''), filters.all, 'all')}
          {problems.map(([key, label]) => chip(problem === key, () => setProblem(problem === key ? '' : key), label, key))}
        </div>
        <p className={s.filterCount} aria-live="polite">
          {filtered ? filters.count.replace('{n}', shown).replace('{total}', all.length) : ''}
          {filtered ? (
            <button type="button" className={s.clear} onClick={() => { setIndustry(''); setProblem(''); }}>
              {filters.clear}
            </button>
          ) : null}
        </p>
      </div>

      {!shown ? <p className="tm-empty">{filters.none}</p> : null}

      {ai.length ? (
        <section id="ai-work" className={s.group} aria-labelledby="ai-work-title">
          <p className={s.groupEyebrow}>{groups.ai.eyebrow}</p>
          <h2 id="ai-work-title" className={s.groupTitle}>{groups.ai.title}</h2>
          <p className={s.groupIntro}>{groups.ai.intro}</p>
          <ul className={s.caseGrid}>
            {ai.map((c) => (
              <li key={c.slug}>
                <CaseCard item={c} locale={locale} ui={ui} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tr.length ? (
        <section id="track-record" className={s.group} aria-labelledby="track-record-title">
          <p className={s.groupEyebrow}>{groups.track.eyebrow}</p>
          <h2 id="track-record-title" className={s.groupTitle}>{groups.track.title}</h2>
          <p className={s.groupIntro}>{groups.track.intro}</p>
          <ul className={s.caseGrid}>
            {tr.map((c) => (
              <li key={c.slug}>
                <CaseCard item={c} locale={locale} ui={ui} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
