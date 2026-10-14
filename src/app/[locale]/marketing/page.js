import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import StatsBand from '@/app/components/sections/StatsBand';
import LogoWall from '@/app/components/sections/LogoWall';
import Testimonials from '@/app/components/sections/Testimonials';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

function Marketing({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  const cta = data.cta || {};
  const actions = [
    { label: cta.primaryButton || ui.startTrial, href: localeHref('/contact-us', locale) },
    { label: cta.secondaryButton || ui.scheduleDemo, href: localeHref('/book-online', locale) },
  ];
  return (
    <>
      <Hero eyebrow={h.title} title={h.heading || h.title} lede={h.description} actions={actions} art />
      {data.stats?.length > 0 && (
        <Section id="at-a-glance" spacing="compact">
          <StatsBand stats={data.stats} />
        </Section>
      )}
      {data.content?.cards?.length > 0 && (
        <Section id="solutions">
          <FeatureGrid
            items={data.content.cards.map((c) => ({ icon: c.icon, title: c.card_title, description: c.card_desc, list: c.card_footer ? [c.card_footer] : undefined }))}
            locale={locale}
            columns={3}
          />
        </Section>
      )}
      {data.features?.items?.length > 0 && (
        <Section id="features" title={data.features.title} lede={data.features.subtitle} tone="sunken">
          <FeatureGrid items={data.features.items} locale={locale} columns={3} variant="plain" />
        </Section>
      )}
      {data.useCases?.length > 0 && (
        <Section id="use-cases" title={ui.useCases}>
          <FeatureGrid items={data.useCases} locale={locale} columns={3} showImages />
        </Section>
      )}
      {data.integrations?.platforms?.length > 0 && (
        <Section id="integrations" title={data.integrations.title} lede={data.integrations.description} tone="sunken">
          <LogoWall items={data.integrations.platforms} locale={locale} />
        </Section>
      )}
      {data.testimonials?.length > 0 && (
        <Section id="testimonials" title={ui.testimonials}>
          <Testimonials items={data.testimonials} />
        </Section>
      )}
      {cta.title && (
        <CTA id="cta" title={cta.title} body={cta.description} primary={actions[0]} secondary={actions[1]} />
      )}
    </>
  );
}

const route = createRoute({
  file: 'marketing.json',
  route: '/marketing',
  Template: Marketing,
  meta: (d) => ({ title: d.header?.title, description: d.header?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
