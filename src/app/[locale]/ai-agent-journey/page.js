import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import Steps from '@/app/components/sections/Steps';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import CheckList from '@/app/components/sections/CheckList';
import FaqAccordion from '@/app/components/sections/FaqAccordion';
import { localeHref, WORKSTATION_URL } from '@/app/components/sections/links';
import AgentJourney from '@/app/components/journey/AgentJourney';
import s from './journey.module.scss';

export const dynamic = 'force-static';

/**
 * Interactive AI agent journey: the question-by-question configurator first
 * (it ends in a blueprint of agents, models, hosting, connectors and
 * guardrails the visitor can send as a lead), then how agents work, what our
 * forward deployed engineers do, example scenarios (labelled as
 * examples, not client results), the FAQ, and the Jobshout / offline detail
 * last. Copy: src/app/data/en/ai-agent-journey.json.
 */
function AgentJourneyPage({ data, locale }) {
  const { header = {}, how, journey, result, recommend, scenarios, fde, framework, offline, faq, cta } = data;
  const workstation = `${WORKSTATION_URL}/ai-workstations`;
  const links = {
    jobshout: localeHref('/jobshout#features', locale),
    jobshoutAgents: localeHref('/jobshout#agents', locale),
    workstation,
  };
  return (
    <>
      <Hero
        eyebrow={header.eyebrow}
        title={header.title}
        lede={header.lede}
        actions={[
          { label: header.start, href: '#journey' },
          { label: header.how, href: '#how', variant: 'secondary' },
        ]}
        meta={header.meta}
        art
      />

      <Section id="journey" eyebrow={journey.eyebrow} title={journey.title} lede={journey.lede} width="wide">
        <AgentJourney journey={journey} result={result} rec={recommend} links={links} />
      </Section>

      <Section id="how" eyebrow={how.eyebrow} title={how.title} lede={how.lede} tone="sunken">
        <Steps steps={how.loop} />
      </Section>

      <Section id="scenarios" eyebrow={scenarios.eyebrow} title={scenarios.title} lede={scenarios.lede}>
        <FeatureGrid items={scenarios.items} locale={locale} columns={2} />
      </Section>

      <Section id="fde" eyebrow={fde.eyebrow} title={fde.title} lede={fde.lede} tone="sunken">
        <FeatureGrid items={fde.points} locale={locale} columns={3} variant="plain" />
        <h3 className={s.subhead}>{fde.certsTitle}</h3>
        <ul className={s.certs}>
          {fde.certs.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Section>

      {faq?.items?.length > 0 && (
        <Section id="faq" title={faq.title} width="narrow">
          <FaqAccordion items={faq.items} />
        </Section>
      )}

      <Section
        id="framework"
        eyebrow={framework.eyebrow}
        title={framework.title}
        lede={framework.lede}
        tone="sunken"
      >
        <CheckList items={framework.list} columns={2} />
        <p className={s.actions}>
          <a className={s.link} href={links.jobshout}>{framework.primary} →</a>
          <a className={s.link} href={links.jobshoutAgents}>{framework.secondary} →</a>
        </p>
      </Section>

      <Section id="offline" eyebrow={offline.eyebrow} title={offline.title} lede={offline.body} spacing="compact">
        <p className={s.actions}>
          <a className={s.link} href={workstation} target="_blank" rel="noopener noreferrer">
            {offline.link} ↗
          </a>
        </p>
      </Section>

      <CTA
        id="cta"
        title={cta.title}
        body={cta.body}
        primary={{ label: cta.primary, href: localeHref('/start-a-project', locale) }}
        secondary={{ label: cta.secondary, href: localeHref('/about-us', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'ai-agent-journey.json',
  route: '/ai-agent-journey',
  Template: AgentJourneyPage,
  meta: (d) => ({ title: d.header?.title, description: d.header?.lede }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
