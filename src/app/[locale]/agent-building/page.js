import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import { heroActions } from '@/app/components/sections/ActionLink';
import { localeHref } from '@/app/components/sections/links';

export const dynamic = 'force-static';

function AgentBuilding({ data, locale }) {
  const btns = (data.cta?.buttons || []).map((b) => ({ label: b.text, href: b.link }));
  return (
    <>
      <Hero title={data.header?.title} lede={data.header?.description} actions={heroActions(btns, locale)} art />
      {data.sections?.length > 0 && (
        <Section id="approach">
          <FeatureGrid
            items={data.sections.map((sec) => ({ title: sec.title, list: sec.points }))}
            locale={locale}
            columns={data.sections.length % 3 === 0 ? 3 : 2}
            variant="numbered"
            headingLevel={2}
          />
        </Section>
      )}
      {data.cta?.title && (
        <CTA
          id="cta"
          title={data.cta.title}
          body={data.cta.description}
          primary={btns[0] ? { label: btns[0].label, href: localeHref(btns[0].href, locale) } : undefined}
          secondary={btns[1] ? { label: btns[1].label, href: localeHref(btns[1].href, locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'agent-building.json', route: '/agent-building', Template: AgentBuilding });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
