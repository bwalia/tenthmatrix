'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ClipboardCopy,
  Cpu,
  Database,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Workflow,
  CalendarClock,
  BookOpen,
} from 'lucide-react';
import ContactForm from '@/app/components/contact/ContactForm';
import s from './AgentJourney.module.scss';

const fill = (str, vars) => String(str || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/**
 * Works out the blueprint from the answers. Pure: same answers, same result.
 * The rules are the ones a forward deployed engineer applies in a first meeting.
 */
export function recommend(answers, rec) {
  const role = answers.role || 'default';
  const work = asList(answers.work);
  const sources = asList(answers.sources);
  const sensitivity = asList(answers.sensitivity);
  const provider = answers.provider && answers.provider !== 'any' ? answers.provider : null;
  const hosting = answers.hosting || 'tenant';
  const offline = hosting === 'airgap';

  // Agents: the role's PA agent first, then up to three specialists for the work picked.
  const agents = [rec.roleAgents[role] || rec.roleAgents.default];
  for (const w of work) {
    const a = rec.workAgents[w];
    if (a && agents.length < 4) agents.push(a);
  }

  // Models.
  const autoPick = () => {
    if (role === 'cto' || work.includes('engineering')) return 'anthropic';
    if (sources.includes('m365')) return 'microsoft';
    if (sources.includes('google')) return 'google';
    if (work.includes('research') && !work.includes('documents')) return 'xai';
    return 'anthropic';
  };
  let primary;
  let support = null;
  let note = null;
  if (offline) {
    primary = 'open';
    if (provider) note = fill(rec.airgapNote, { provider: rec.models[provider]?.name || provider });
  } else if (answers.openSource === 'yes') {
    primary = 'open';
    support = provider || autoPick();
  } else {
    primary = provider || autoPick();
    if (answers.openSource === 'mix' || (hosting === 'onprem' && answers.openSource !== 'no')) support = 'openRoutine';
    else if (sensitivity.some((x) => ['health', 'privileged'].includes(x)) && answers.openSource !== 'no') support = 'openRoutine';
  }

  const controls = [
    rec.controls[answers.autonomy || 'gated'],
    ...sensitivity.filter((x) => rec.controls[x]).map((x) => rec.controls[x]),
    rec.controls.always,
  ];

  return {
    agents,
    primary: rec.models[primary],
    support: support ? rec.models[support] : null,
    note,
    hosting: rec.hosting[hosting],
    connectors: sources.map((x) => rec.connectors[x]).filter(Boolean),
    controls,
    plan: rec.plan[answers.speed || 'now'] || [],
    scenario: rec.scenarios[role] || rec.scenarios.default,
    showWorkstation: offline || hosting === 'onprem' || answers.openSource === 'yes',
  };
}

const Q_ICONS = {
  role: UserRoundCheck,
  work: CalendarClock,
  sources: Database,
  autonomy: ShieldCheck,
  provider: Sparkles,
  openSource: BookOpen,
  hosting: HardDrive,
  sensitivity: ShieldCheck,
  speed: Workflow,
};

/**
 * Interactive "design your AI agent" journey: one question per screen, a live
 * summary beside it, and a blueprint at the end that can be sent as a lead.
 * All copy comes from the page JSON (`journey`, `result`, `recommend`).
 */
export default function AgentJourney({ journey, result, rec, links }) {
  const questions = journey.questions;
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef(null);
  const rootRef = useRef(null);
  const firstRender = useRef(true);

  // Move focus to the new question (or the result) so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    rootRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [index, done]);

  const q = questions[index];
  const value = answers[q?.id];
  const answered = q?.type === 'multi' ? asList(value).length > 0 : Boolean(value);

  const choose = (opt) => {
    setAnswers((a) => {
      if (q.type !== 'multi') return { ...a, [q.id]: opt };
      const cur = asList(a[q.id]);
      return { ...a, [q.id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
  };

  const next = () => (index < total - 1 ? setIndex(index + 1) : setDone(true));
  const back = () => (done ? setDone(false) : setIndex(Math.max(0, index - 1)));
  const restart = () => {
    setAnswers({});
    setIndex(0);
    setDone(false);
  };

  const labelOf = (qq, v) => qq.options.find((o) => o.value === v)?.label || v;
  const picked = questions
    .map((qq) => ({ qq, vals: asList(answers[qq.id]) }))
    .filter((p) => p.vals.length);

  const bp = useMemo(() => recommend(answers, rec), [answers, rec]);

  const summaryText = (() => {
    const lines = [result.summaryHeading, ''];
    for (const { qq, vals } of picked) lines.push(`${qq.title} ${vals.map((v) => labelOf(qq, v)).join(', ')}`);
    lines.push('', `${result.agentsTitle}: ${bp.agents.map((a) => a.name).join('; ')}`);
    lines.push(`${result.modelTitle}: ${bp.primary?.name}${bp.support ? ` + ${bp.support.name}` : ''}`);
    lines.push(`${result.hostingTitle}: ${bp.hosting}`);
    if (bp.connectors.length) lines.push(`${result.connectorsTitle}: ${bp.connectors.join('; ')}`);
    return lines.join('\n');
  })();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the text is still in the form below */
    }
  };

  const Stepper = (
    <ol className={s.stepper} aria-label={fill(journey.progress, { current: done ? total : index + 1, total })}>
      {questions.map((qq, i) => {
        const state = done || i < index ? 'done' : i === index ? 'current' : 'todo';
        return (
          <li key={qq.id} className={s[`dot-${state}`]} aria-current={state === 'current' ? 'step' : undefined}>
            <button
              type="button"
              className={s.dot}
              onClick={() => {
                setDone(false);
                setIndex(i);
              }}
              disabled={!done && i > index && !asList(answers[questions[i - 1]?.id]).length}
              aria-label={`${i + 1}. ${qq.title}`}
            >
              {state === 'done' ? <Check size={14} strokeWidth={2.25} aria-hidden="true" /> : i + 1}
            </button>
          </li>
        );
      })}
      <li className={done ? s['dot-current'] : s['dot-todo']}>
        <span className={s.dot} aria-hidden="true">
          <Bot size={14} strokeWidth={2} />
        </span>
      </li>
    </ol>
  );

  if (done) {
    return (
      <div className={s.journey} ref={rootRef}>
        {Stepper}
        <div className={s.result}>
          <header className={s.resultHead}>
            <p className={s.eyebrow}>{result.eyebrow}</p>
            <h3 ref={headingRef} tabIndex={-1} className={s.resultTitle}>
              {result.title}
            </h3>
            <p className={s.lede}>{result.lede}</p>
          </header>

          <div className={s.resultGrid}>
            <article className={`${s.card} ${s.wide}`}>
              <h4 className={s.cardTitle}>
                <Bot aria-hidden="true" size={20} strokeWidth={1.75} /> {result.agentsTitle}
              </h4>
              <ul className={s.agents}>
                {bp.agents.map((a) => (
                  <li key={a.name}>
                    <strong>{a.name}</strong>
                    <span>{a.description}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <Sparkles aria-hidden="true" size={20} strokeWidth={1.75} /> {result.modelTitle}
              </h4>
              <dl className={s.models}>
                <dt>{result.primaryLabel}</dt>
                <dd>
                  <strong>{bp.primary?.name}</strong>
                  <span>{bp.primary?.why}</span>
                </dd>
                {bp.support && (
                  <>
                    <dt>{result.supportLabel}</dt>
                    <dd>
                      <strong>{bp.support.name}</strong>
                      <span>{bp.support.why}</span>
                    </dd>
                  </>
                )}
              </dl>
              {bp.note && <p className={s.note}>{bp.note}</p>}
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <Cpu aria-hidden="true" size={20} strokeWidth={1.75} /> {result.hostingTitle}
              </h4>
              <p>{bp.hosting}</p>
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <Database aria-hidden="true" size={20} strokeWidth={1.75} /> {result.connectorsTitle}
              </h4>
              {bp.connectors.length ? (
                <ul className={s.ticks}>
                  {bp.connectors.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p>{result.connectorsNone}</p>
              )}
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <ShieldCheck aria-hidden="true" size={20} strokeWidth={1.75} /> {result.controlsTitle}
              </h4>
              <ul className={s.ticks}>
                {bp.controls.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <CalendarClock aria-hidden="true" size={20} strokeWidth={1.75} /> {result.planTitle}
              </h4>
              <ol className={s.plan}>
                {bp.plan.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </article>

            <article className={s.card}>
              <h4 className={s.cardTitle}>
                <UserRoundCheck aria-hidden="true" size={20} strokeWidth={1.75} /> {result.fdeTitle}
              </h4>
              <p>{result.fdeBody}</p>
            </article>

            <article className={`${s.card} ${s.night} ${s.wide}`}>
              <h4 className={s.cardTitle}>
                <UserRoundCheck aria-hidden="true" size={20} strokeWidth={1.75} /> {result.scenarioTitle}
              </h4>
              <p className={s.scenario}>{bp.scenario}</p>
            </article>

            <article className={`${s.card} ${s.wide}`}>
              <h4 className={s.cardTitle}>
                <Workflow aria-hidden="true" size={20} strokeWidth={1.75} /> {result.frameworkTitle}
              </h4>
              <p>{result.frameworkBody}</p>
              <p className={s.links}>
                <a href={links.jobshout}>
                  {result.frameworkLink} <ArrowRight aria-hidden="true" size={16} />
                </a>
                <a href={links.jobshoutAgents}>
                  {result.frameworkAgentsLink} <ArrowRight aria-hidden="true" size={16} />
                </a>
              </p>
            </article>

            {bp.showWorkstation && (
              <article className={`${s.card} ${s.accent} ${s.wide}`}>
                <h4 className={s.cardTitle}>
                  <HardDrive aria-hidden="true" size={20} strokeWidth={1.75} /> {result.workstationTitle}
                </h4>
                <p>{result.workstationBody}</p>
                <p className={s.links}>
                  <a href={links.workstation} target="_blank" rel="noopener noreferrer">
                    {result.workstationLink} <ArrowRight aria-hidden="true" size={16} />
                  </a>
                </p>
              </article>
            )}

          </div>

          <div className={s.actions}>
            <button type="button" className={s.ghost} onClick={back}>
              <ArrowLeft aria-hidden="true" size={18} /> {journey.back}
            </button>
            <button type="button" className={s.ghost} onClick={copy}>
              <ClipboardCopy aria-hidden="true" size={18} /> {copied ? result.copied : result.copy}
            </button>
            <button type="button" className={s.ghost} onClick={restart}>
              <RotateCcw aria-hidden="true" size={18} /> {journey.restart}
            </button>
          </div>

          <div className={s.send} id="send-blueprint">
            <h4 className={s.sendTitle}>{result.sendTitle}</h4>
            <p className={s.lede}>{result.sendBody}</p>
            <ContactForm
              source={result.sendSource}
              initialMessage={summaryText}
              messageLabel={result.sendMessageLabel}
            />
          </div>
        </div>
      </div>
    );
  }

  const Icon = Q_ICONS[q.id] || Sparkles;
  return (
    <div className={s.journey} ref={rootRef}>
      {Stepper}
      <div className={s.layout}>
        <fieldset className={s.question}>
          <legend className={s.legend}>
            <span className={s.progress}>{fill(journey.progress, { current: index + 1, total })}</span>
            <span className={s.qTitle} ref={headingRef} tabIndex={-1}>
              <Icon aria-hidden="true" size={24} strokeWidth={1.75} className={s.qIcon} />
              {q.title}
            </span>
          </legend>
          <p className={s.help}>
            {q.help} <span className={s.hint}>{q.type === 'multi' ? journey.multiHint : journey.singleHint}</span>
          </p>
          <div className={s.options}>
            {q.options.map((o) => {
              const checked = q.type === 'multi' ? asList(value).includes(o.value) : value === o.value;
              return (
                <label key={o.value} className={`${s.option} ${checked ? s.checked : ''}`}>
                  <input
                    type={q.type === 'multi' ? 'checkbox' : 'radio'}
                    name={`tm-journey-${q.id}`}
                    value={o.value}
                    checked={checked}
                    onChange={() => choose(o.value)}
                    className={s.input}
                  />
                  <span className={s.tick} aria-hidden="true">
                    {checked ? <Check size={14} strokeWidth={2.5} /> : null}
                  </span>
                  <span className={s.optCopy}>
                    <span className={s.optLabel}>{o.label}</span>
                    {o.description && <span className={s.optDesc}>{o.description}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          <div className={s.actions}>
            {index > 0 && (
              <button type="button" className={s.ghost} onClick={back}>
                <ArrowLeft aria-hidden="true" size={18} /> {journey.back}
              </button>
            )}
            <span className={s.spacer} />
            {!answered && (
              <button type="button" className={s.ghost} onClick={next}>
                {journey.skip}
              </button>
            )}
            <button type="button" className={s.primary} onClick={next} disabled={!answered}>
              {index === total - 1 ? journey.seeResult : journey.next} <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        </fieldset>

        <aside className={s.summary} aria-live="polite">
          <h3 className={s.summaryTitle}>{journey.summaryTitle}</h3>
          {picked.length ? (
            <dl className={s.summaryList}>
              {picked.map(({ qq, vals }) => (
                <div key={qq.id}>
                  <dt>{qq.title}</dt>
                  <dd>{vals.map((v) => labelOf(qq, v)).join(', ')}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={s.summaryEmpty}>{journey.summaryEmpty}</p>
          )}
          {answers.role && (
            <div className={s.preview}>
              <p className={s.previewLabel}>{result.agentsTitle}</p>
              <p className={s.previewValue}>{bp.agents.map((a) => a.name).join(' · ')}</p>
              {(answers.provider || answers.hosting || answers.openSource) && (
                <>
                  <p className={s.previewLabel}>{result.modelTitle}</p>
                  <p className={s.previewValue}>
                    {bp.primary?.name}
                    {bp.support ? ` + ${bp.support.name}` : ''}
                  </p>
                </>
              )}
            </div>
          )}
          <p className={s.workstation}>
            <HardDrive aria-hidden="true" size={16} strokeWidth={1.75} />{' '}
            <a href={links.workstation} target="_blank" rel="noopener noreferrer">
              {result.workstationLink}
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
