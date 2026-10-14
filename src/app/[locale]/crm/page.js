import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import Overview from '@/app/components/sections/Overview';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import StatsBand from '@/app/components/sections/StatsBand';
import LogoWall from '@/app/components/sections/LogoWall';
import PricingTable from '@/app/components/sections/PricingTable';
import Testimonials from '@/app/components/sections/Testimonials';
import ComparisonTable from '@/app/components/sections/ComparisonTable';
import FaqAccordion from '@/app/components/sections/FaqAccordion';
import VideoGrid from '@/app/components/sections/VideoGrid';
import CheckList from '@/app/components/sections/CheckList';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function Crm({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.hero || {};
  const plans = data.pricing?.plans || [];
  const yes = (v) => (v ? `✓ ${ui.included}` : `– ${ui.notIncluded}`);
  const cta = data.cta || {};
  return (
    <>
      <Hero
        eyebrow={data.header?.title}
        title={h.title}
        lede={h.subtitle}
        actions={[
          { label: cta.primaryButton || ui.startTrial, href: localeHref('/contact-us', locale) },
          { label: cta.secondaryButton || ui.scheduleDemo, href: localeHref('/book-online', locale) },
        ]}
        art
      />
      {h.stats?.length > 0 && (
        <Section id="at-a-glance" spacing="compact">
          <StatsBand stats={h.stats} />
        </Section>
      )}
      {data.content && (
        <Overview title={data.content.heading} content={data.content.description} locale={locale} />
      )}
      {h.video && (
        <Section id="video" title={ui.video} tone="sunken" width="narrow">
          <VideoGrid videos={[{ title: h.title, embedUrl: h.video }]} columns={1} playLabel={ui.playVideo} watchLabel={ui.watchOnYouTube} />
        </Section>
      )}
      {data.features?.length > 0 && (
        <Section id="features" title={ui.features}>
          <FeatureGrid items={data.features} locale={locale} columns={3} />
        </Section>
      )}
      {data.useCases?.length > 0 && (
        <Section id="use-cases" title={ui.useCases} tone="sunken">
          <FeatureGrid items={data.useCases} locale={locale} columns={4} showImages showIcons={false} />
        </Section>
      )}
      {data.integrations?.platforms?.length > 0 && (
        <Section id="integrations" title={data.integrations.title} lede={data.integrations.description}>
          <LogoWall items={data.integrations.platforms} locale={locale} />
        </Section>
      )}
      {plans.length > 0 && (
        <Section id="pricing" title={data.pricing.title} lede={data.pricing.subtitle} tone="sunken">
          <PricingTable plans={plans} locale={locale} popularLabel={ui.mostPopular} />
        </Section>
      )}
      {data.modulesTable?.categories?.length > 0 && (
        <Section id="modules" title={data.modulesTable.title} lede={data.modulesTable.subtitle}>
          <FaqAccordion
            wide
            items={data.modulesTable.categories.map((cat) => ({
              question: cat.name,
              content: (
                <ComparisonTable
                  columns={[
                    { key: 'feature', label: ui.module },
                    { key: 'starter', label: plans[0]?.name || ui.starter },
                    { key: 'professional', label: plans[1]?.name || ui.professional },
                    { key: 'enterprise', label: plans[2]?.name || ui.enterprise },
                  ]}
                  rows={cat.modules.map((m) => ({
                    feature: m.description ? `<strong>${m.feature}</strong><br>${m.description}` : m.feature,
                    starter: yes(m.starter),
                    professional: yes(m.professional),
                    enterprise: yes(m.enterprise),
                  }))}
                />
              ),
            }))}
          />
        </Section>
      )}
      {data.testimonials?.length > 0 && (
        <Section id="testimonials" title={ui.testimonials} tone="sunken">
          <Testimonials items={data.testimonials} />
        </Section>
      )}
      {cta.title && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={{ label: cta.primaryButton || ui.startTrial, href: localeHref('/contact-us', locale) }}
          secondary={{ label: cta.secondaryButton || ui.scheduleDemo, href: localeHref('/book-online', locale) }}
        >
          {cta.features?.length > 0 && (
            <div className={s.ctaList}>
              <CheckList items={cta.features} columns={2} variant="cell" />
            </div>
          )}
        </CTA>
      )}
    </>
  );
}

const route = createRoute({
  file: 'crm.json',
  route: '/crm',
  Template: Crm,
  meta: (d) => ({ title: d.header?.title, description: d.content?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
