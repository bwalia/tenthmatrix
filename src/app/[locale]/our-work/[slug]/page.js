import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Hero, Section, CTA } from '@/app/components';
import { loadPage, pageMetadata } from '@/app/components/sections/meta';
import { localeHref } from '@/app/components/sections/links';
import TechDetails from '@/app/components/sections/TechDetails';
import ProofStats from '@/app/components/work/ProofStats';
import CaseCard from '@/app/components/work/CaseCard';
import w from '@/app/components/work/work.module.scss';
import enWork from '@/app/data/en/our-work.json';

export const dynamic = 'force-static';
export const dynamicParams = false;

const FILE = 'our-work.json';

/** One page per AI & automation case (our-work.json → cases[]). */
export function generateStaticParams() {
  return enWork.cases.map((c) => ({ slug: c.slug }));
}

async function load(locale, slug) {
  const data = await loadPage(FILE, locale);
  const item = data?.cases?.find((c) => c.slug === slug);
  return item ? { data, item } : null;
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const hit = await load(locale, slug);
  if (!hit) return {};
  const { item } = hit;
  return pageMetadata({
    locale,
    route: `/our-work/${slug}`,
    data: { meta: { title: `${item.company}: ${item.summary.replace(/\.$/, '')}`, description: item.built } },
  });
}

/**
 * Case study template (restructure plan): client & sector, the problem, what
 * we built, three results, the quote, how long it took, then technical
 * details in an expander.
 */
export default async function CaseStudyPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const hit = await load(locale, slug);
  if (!hit) notFound();
  const { data, item } = hit;
  const ui = data.ui;
  const others = data.cases.filter((c) => c.slug !== slug).slice(0, 3);
  const facts = [
    [ui.sector, item.sector],
    [ui.location, item.location],
    [ui.size, item.size],
    [ui.duration, item.duration],
  ].filter(([, v]) => v);

  return (
    <>
      <Hero eyebrow={`${data.header.eyebrow} · ${item.industryLabel}`} title={item.company} lede={item.summary} art={false}>
        <dl className={w.caseHeader}>
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Hero>

      <Section id="results" tone="sunken" title={ui.results}>
        <ProofStats items={item.results} />
      </Section>

      <Section id="story">
        <div className={w.caseBody}>
          <div>
            <h2>{ui.problem}</h2>
            <p>{item.problem}</p>
          </div>
          <div>
            <h2>{ui.built}</h2>
            <p>{item.built}</p>
            {item.image ? <img src={item.image} alt="" className={w.caseImage} loading="lazy" /> : null}
          </div>
        </div>
        {item.quote?.text ? (
          <blockquote className={`${w.quote} ${w.caseExtra}`}>
            <p>{item.quote.text}</p>
            {item.quote.by ? <footer>{item.quote.by}</footer> : null}
          </blockquote>
        ) : null}
        <div className={w.caseExtra}>
          {item.disclosure ? (
            <p className={w.note}>
              <strong>{ui.disclosure}</strong>
              {item.disclosure}
            </p>
          ) : null}
          <TechDetails summary={ui.technical} items={item.technical} />
          <p className={w.caseLinks}>
            {item.story ? (
              <Link href={localeHref(item.story, locale)} prefetch={false}>
                {ui.readStory}
              </Link>
            ) : null}
            {item.website ? (
              <a href={item.website} target="_blank" rel="noopener noreferrer">
                {ui.visit.replace('{name}', item.company)}
                <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
              </a>
            ) : null}
            <Link href={`/${locale}/our-work`} prefetch={false}>
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={2} />
              {ui.back}
            </Link>
          </p>
        </div>
      </Section>

      <Section id="more" tone="sunken" title={ui.related}>
        <ul className={w.caseGrid}>
          {others.map((c) => (
            <li key={c.slug}>
              <CaseCard item={c} locale={locale} ui={ui} />
            </li>
          ))}
        </ul>
      </Section>

      <CTA
        id="cta"
        title={data.cta.title}
        body={data.cta.description}
        primary={{ label: data.cta.button, href: localeHref(data.cta.link, locale) }}
        secondary={data.cta.secondary ? { label: data.cta.secondary.label, href: localeHref(data.cta.secondary.link, locale) } : undefined}
      />
    </>
  );
}
