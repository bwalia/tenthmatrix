import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import LogoWall from '@/app/components/sections/LogoWall';
import { localeHref } from '@/app/components/sections/links';
import { uiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

// Software partners only; hardware partners (e.g. Boston) live on Workstation.
const isHardware = (p) => /hardware|gpu|workstation/i.test(`${p.category || ''}`) || /partners\/boston/.test(p.detailPage || '');

function Partners({ data, locale }) {
  const ui = uiStrings(data.ui);
  const ai = (data.aiPartners || []).filter((p) => !isHardware(p));
  const tech = (data.content || []).filter((p) => !isHardware(p));
  return (
    <>
      <Hero title={data.header?.title} lede={data.header?.subtitle} art />
      {ai.length > 0 && (
        <Section id="ai-partners" title={ui.aiPartners}>
          <LogoWall items={ai.map((p) => ({ name: p.name, logo: p.logo, category: p.integration }))} locale={locale} />
          <div className={s.spacer}>
            <FeatureGrid items={ai.map((p) => ({ title: p.name, badge: p.tagline, description: p.description }))} locale={locale} columns={3} variant="plain" />
          </div>
        </Section>
      )}
      {tech.length > 0 && (
        <Section id="technology-partners" title={ui.technologyPartners} tone="sunken">
          <FeatureGrid
            items={tech.map((p) => ({
              title: p.name,
              badge: p.partnership || p.category,
              description: p.description,
              list: p.benefits,
              href: p.website,
              linkLabel: ui.visitSite,
            }))}
            locale={locale}
            columns={3}
            listLabel={ui.benefits}
          />
        </Section>
      )}
      <CTA
        id="cta"
        title={ui.partnerCtaTitle}
        body={ui.partnerCtaBody}
        primary={{ label: ui.contactSales, href: localeHref('/contact-us', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'partners.json',
  route: '/partners',
  Template: Partners,
  meta: (d) => ({ title: d.header?.title, description: d.header?.subtitle }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
