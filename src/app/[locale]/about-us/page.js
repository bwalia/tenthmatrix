import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureRows from '@/app/components/sections/FeatureRows';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import StatsBand from '@/app/components/sections/StatsBand';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

function AboutUs({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  return (
    <>
      <Hero eyebrow={h.title} title={h.tagline || h.title} art />
      {data.numbers?.length > 0 && (
        <Section id="numbers" spacing="compact">
          <StatsBand stats={data.numbers} />
        </Section>
      )}
      {data.content?.length > 0 && (
        <Section id="story">
          <FeatureRows items={data.content} locale={locale} watchLabel={ui.watchVideo} />
        </Section>
      )}
      {data.expertise?.length > 0 && (
        <Section id="expertise" title={ui.expertise} tone="sunken">
          <FeatureGrid
            items={data.expertise.map((e) => ({ ...e, list: e.technologies }))}
            locale={locale}
            columns={3}
            showImages
          />
        </Section>
      )}
      {data.values?.length > 0 && (
        <Section id="values" title={ui.values}>
          <FeatureGrid items={data.values} locale={locale} columns={4} variant="plain" />
        </Section>
      )}
      {data.teams?.length > 0 && (
        <Section id="team" title={ui.team} tone="sunken">
          <FeatureGrid
            items={data.teams.map((t) => ({ title: t.name, badge: t.designation, description: t.about, image: t.image, list: t.expertise }))}
            locale={locale}
            columns={4}
            showImages
          />
        </Section>
      )}
      {data.achievements?.length > 0 && (
        <Section id="achievements" title={ui.achievements}>
          <FeatureGrid items={data.achievements} locale={locale} columns={4} variant="numbered" />
        </Section>
      )}
      <CTA
        id="cta"
        title={ui.aboutCtaTitle}
        body={ui.aboutCtaBody}
        primary={{ label: ui.startProject, href: localeHref('/start-a-project', locale) }}
        secondary={{ label: ui.whyLink, href: localeHref('/why-tenthmatrix', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'about-us.json',
  route: '/about-us',
  Template: AboutUs,
  meta: (d) => ({ title: d.header?.title, description: d.header?.tagline }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
