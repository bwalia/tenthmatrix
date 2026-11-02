import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import Timeline from '@/app/components/sections/Timeline';
import { localeHref } from '@/app/components/sections/links';

export const dynamic = 'force-static';

function OurStory({ data, locale }) {
  const { header = {}, intro, founders, timeline, cta } = data;
  return (
    <>
      <Hero eyebrow={header.eyebrow} title={header.title} lede={header.subtitle} art />
      {intro && (
        <Section id="intro" title={intro.title} width="narrow">
          {(intro.paragraphs || []).map((p, i) => (
            <p key={i} style={{ margin: i ? 'var(--tm-space-4) 0 0' : 0 }}>
              {p}
            </p>
          ))}
        </Section>
      )}
      {founders?.people?.length > 0 && (
        <Section id="people" title={founders.title} lede={founders.subtitle} tone="sunken">
          <FeatureGrid
            items={founders.people.map((p) => ({ title: p.name, badge: p.role, description: p.description }))}
            locale={locale}
            columns={4}
          />
        </Section>
      )}
      {timeline?.entries?.length > 0 && (
        <Section id="journey" title={timeline.title} lede={timeline.subtitle}>
          <Timeline
            items={timeline.entries.map((e) => ({ ...e, status: e.year }))}
            creditLabels={{ label: timeline.creditLabel, via: timeline.creditVia }}
          />
        </Section>
      )}
      {cta && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={{ label: cta.contactLabel, href: localeHref('/contact-us', locale) }}
          secondary={{ label: cta.backLabel, href: localeHref('/about-us', locale) }}
        />
      )}
    </>
  );
}

const route = createRoute({
  file: 'our-story.json',
  route: '/about-us/our-story',
  Template: OurStory,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
