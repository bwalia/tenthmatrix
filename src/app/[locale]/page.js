import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check, UserCheck, Lock, Server, Bot } from 'lucide-react';
import { Hero, Section, CTA, Button, Reveal, RevealItem } from '@/app/components';
import { loadPage } from '@/app/components/sections/meta';
import LogoStrip from '@/app/components/work/LogoStrip';
import ProofStats from '@/app/components/work/ProofStats';
import CaseCard from '@/app/components/work/CaseCard';
import SolutionCards, { solutionCardItems } from '@/app/components/solutions/SolutionCards';
import Term from '@/app/components/glossary/Term';
import { BOOK_CALL_HREF } from '@/app/components/layout/navConfig';
import s from './home.module.scss';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return {
    title: { absolute: tm('home.meta.title') },
    description: tm('home.meta.description'),
    alternates: { canonical: `/${locale}` },
  };
}

/** 3x3 lattice that fills one row per step; step 4 lights the tenth cell. */
function StepGlyph({ step }) {
  const filled = [3, 6, 9, 9][step - 1];
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    cells.push(<rect key={i} x={c * 8} y={10 + r * 8} width="6" height="6" rx="1" className={i < filled ? s.on : s.off} />);
  }
  return (
    <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true" className={s.glyph}>
      {cells}
      <rect x="26" y="0" width="6" height="6" rx="1" className={step === 4 ? s.tenth : s.off} />
    </svg>
  );
}

// Logo strip under the hero (restructure plan): recognisable clients first.
const LOGO_SLUGS = ['barclays', 'hcl-technologies', 'lexisnexis', 'elsevier', 'norfolk-county-council', 'sothebys-international-realty'];

// What we build: a real screenshot first, then two "how it works" diagrams.
const BUILD_MEDIA = [
  { src: '/img/jobshout-seo-analyst-ai-agent.png', kind: 'screenshot', href: '/jobshout' },
  { src: '/img/ai-automation/sales-followup-recovery.svg', kind: 'diagram', href: '/solutions/sales' },
  { src: '/img/ai-automation/human-in-control.svg', kind: 'diagram', href: '/how-we-work#security' },
];

const TRUST_ICONS = [UserCheck, Lock, Server, Bot];
// Glossary ids for the term each trust point explains (home.trust.points[i].term).
const TRUST_TERMS = ['approval-gate', null, 'open-weight-model', null];

/**
 * Homepage, eight sections (restructure plan, 26 Nov 2026): hero → logos and
 * headline numbers → problems we solve → featured case studies → what we
 * build → how it works → why businesses trust us → book a call. Proof sits in
 * the first screenful; technical depth is one click away.
 */
export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const href = (p) => `/${locale}${p}`;

  const [work, solutions, glossary] = await Promise.all([
    loadPage('our-work.json', locale),
    loadPage('solutions.json', locale),
    loadPage('glossary.json', locale),
  ]);
  const everyone = [...(work.cases || []), ...(work.track || [])];
  const logos = LOGO_SLUGS.map((slug) => everyone.find((c) => c.slug === slug)).filter(Boolean);
  const featured = work.cases.filter((c) => c.featured).slice(0, 3);
  const tip = (id) => glossary?.terms?.find((g) => g.id === id)?.plain;

  const steps = t.raw('home.steps.items');
  const build = t.raw('home.build.items');
  const trust = t.raw('home.trust.points');

  return (
    <div className="tm-home">
      <Hero
        variant="home"
        eyebrow={t('home.hero.eyebrow')}
        title={t('home.hero.title')}
        lede={t('home.hero.lede')}
        actions={[
          { label: t('home.hero.primary'), href: href(BOOK_CALL_HREF), arrow: true },
          { label: t('home.hero.secondary'), href: href('/our-work') },
        ]}
        meta={[t('home.hero.name')]}
        art
        compact
      />

      <section id="proof" className={s.proof} aria-labelledby="proof-title">
        <div className={s.proofInner}>
          <p className={s.proofEyebrow} id="proof-title">
            {t('home.proof.eyebrow')}
          </p>
          <LogoStrip items={logos} label={t('home.proof.logos')} />
          <div className={s.proofStats}>
            <ProofStats items={work.stats} />
          </div>
        </div>
      </section>

      <Section
        id="problems"
        eyebrow={t('home.problems.eyebrow')}
        title={t('home.problems.title')}
        lede={t('home.problems.lede')}
        actions={
          <Button href={href('/solutions')} variant="tertiary" prefetch={false}>
            {t('home.problems.all')}
          </Button>
        }
      >
        <SolutionCards items={solutionCardItems(solutions)} locale={locale} linkLabel={t('home.problems.see')} />
      </Section>

      <Section
        id="case-studies"
        tone="sunken"
        eyebrow={t('home.featured.eyebrow')}
        title={t('home.featured.title')}
        lede={t('home.featured.lede')}
        actions={
          <Button href={href('/our-work')} variant="tertiary" prefetch={false}>
            {t('home.featured.all')}
          </Button>
        }
      >
        <Reveal as="ul" stagger className={s.cases}>
          {featured.map((c) => (
            <RevealItem as="li" key={c.slug}>
              <CaseCard item={c} locale={locale} ui={work.ui} />
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section id="what-we-build" eyebrow={t('home.build.eyebrow')} title={t('home.build.title')} lede={t('home.build.lede')}>
        <ul className={s.build}>
          {BUILD_MEDIA.map((m, i) => (
            <li key={m.src}>
              <a href={href(m.href)} className={s.buildCard}>
                <span className={`${s.buildMedia} ${m.kind === 'diagram' ? s.buildContain : ''}`}>
                  <img src={m.src} alt="" loading="lazy" />
                  <span className={s.buildKind}>{t(`home.build.${m.kind}`)}</span>
                </span>
                <span className={s.buildTitle}>{build[i]?.title}</span>
                <span className={s.buildBody}>{build[i]?.body}</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="process"
        tone="sunken"
        eyebrow={t('home.steps.eyebrow')}
        title={t('home.steps.title')}
        lede={t('home.steps.lede')}
        actions={
          <Button href={href('/how-we-work')} variant="tertiary" prefetch={false}>
            {t('home.steps.more')}
          </Button>
        }
      >
        <Reveal as="ol" stagger className={s.steps}>
          {steps.map((step, i) => (
            <RevealItem as="li" key={step.title} className={s.step}>
              <StepGlyph step={i + 1} />
              <p className={s.stepNum}>
                {String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
              </p>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepBody}>{step.body}</p>
            </RevealItem>
          ))}
        </Reveal>
        <p className={s.reassure}>
          <Check aria-hidden="true" size={20} strokeWidth={2} />
          <span>{t('home.steps.reassure')}</span>
        </p>
      </Section>

      <Section id="trust" eyebrow={t('home.trust.eyebrow')} title={t('home.trust.title')}>
        <ul className={s.trust}>
          {trust.map((p, i) => {
            const Icon = TRUST_ICONS[i] || Check;
            const termId = TRUST_TERMS[i];
            return (
              <li key={p.title} className={s.trustItem}>
                <span className={s.trustIcon} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className={s.trustTitle}>{p.title}</h3>
                <p className={s.trustBody}>
                  {p.body}
                  {termId && p.term && tip(termId) ? (
                    <>
                      {' '}
                      (
                      <Term id={termId} tip={tip(termId)} locale={locale}>
                        {p.term}
                      </Term>
                      )
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
        <p className={s.techLink}>
          <Button href={href('/products')} variant="tertiary" arrow prefetch={false}>
            {t('home.trust.tech')}
          </Button>
        </p>
      </Section>

      <CTA
        id="cta"
        eyebrow={t('home.cta.eyebrow')}
        title={t('home.cta.title')}
        body={t('home.cta.body')}
        primary={{ label: t('home.cta.primary'), href: href(BOOK_CALL_HREF) }}
        secondary={{ label: t('home.cta.secondary'), href: href('/ai-agent-journey') }}
      />
    </div>
  );
}
