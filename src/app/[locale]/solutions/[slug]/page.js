import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Hero, Section, CTA, Button } from '@/app/components';
import { loadPage, pageMetadata } from '@/app/components/sections/meta';
import { localeHref } from '@/app/components/sections/links';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import Steps from '@/app/components/sections/Steps';
import TechDetails from '@/app/components/sections/TechDetails';
import CaseCard from '@/app/components/work/CaseCard';
import SolutionCards, { solutionCardItems } from '@/app/components/solutions/SolutionCards';
import s from '@/app/components/solutions/solutions.module.scss';
import enSolutions from '@/app/data/en/solutions.json';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return enSolutions.slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const data = await loadPage('solutions.json', locale);
  const page = data?.pages?.[slug];
  return page ? pageMetadata({ locale, route: `/solutions/${slug}`, data: page }) : {};
}

/**
 * Solution page template (restructure plan): the problem → what the agent or
 * app does → an example → a client with the same problem → how we deliver →
 * Book a call. Technical details sit in an expander at the bottom.
 */
export default async function SolutionPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await loadPage('solutions.json', locale);
  const page = data?.pages?.[slug];
  if (!page) notFound();
  const work = await loadPage('our-work.json', locale);
  const story = [...(work?.cases || []), ...(work?.track || [])].find((c) => c.slug === page.storySlug);
  const ui = data.ui;
  const others = solutionCardItems(data).filter((c) => c.slug !== slug).slice(0, 3);

  return (
    <>
      <Hero
        eyebrow={page.header.eyebrow}
        title={page.header.title}
        lede={page.header.subtitle}
        actions={[
          { label: data.cta.button, href: localeHref(data.cta.link, locale), arrow: true },
          { label: data.journey.button, href: localeHref(data.journey.link, locale) },
        ]}
        art
      />

      <Section id="problem" eyebrow={ui.problem} title={page.problem.title}>
        <ul className={s.problems}>
          {page.problem.items.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section id="what" tone="sunken" title={page.does.title}>
        <FeatureGrid items={page.does.items} locale={locale} columns={page.does.items.length === 4 ? 2 : 3} variant="plain" showIcons={false} />
      </Section>

      <Section id="example" title={page.example.title}>
        <p className={s.exampleNote}>{page.example.intro}</p>
        <Steps steps={page.example.steps} />
      </Section>

      <Section id="proof" tone="sunken" eyebrow={story?.groupKey === 'ai' ? ui.story : ui.storyTrack}>
        <div className={s.storyRow}>
          {story ? <CaseCard item={story} locale={locale} ui={work.ui} /> : null}
          <div className={s.deliver}>
            <h3>{ui.deliverTitle}</h3>
            <p>{ui.deliverBody}</p>
            <div>
              <Button href={localeHref('/how-we-work', locale)} variant="tertiary" arrow>
                {ui.deliverLink}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="details" width="narrow">
        <TechDetails summary={ui.technical} items={page.technical} />
        <p className={s.glossaryNote}>
          <Link href={`/${locale}/glossary`} prefetch={false}>
            {ui.glossary}
          </Link>
        </p>
        {page.related?.length ? (
          <ul className={s.related} aria-label={ui.related}>
            {page.related.map((r) => (
              <li key={r.href}>
                <Link href={localeHref(r.href, locale)} prefetch={false}>
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section id="other" tone="sunken" title={ui.other}>
        <SolutionCards items={others} locale={locale} linkLabel={ui.see} />
      </Section>

      <CTA
        id="cta"
        title={data.cta.title}
        body={data.cta.description}
        primary={{ label: data.cta.button, href: localeHref(data.cta.link, locale) }}
        secondary={{ label: data.cta.secondary.label, href: localeHref(data.cta.secondary.link, locale) }}
      />
    </>
  );
}
