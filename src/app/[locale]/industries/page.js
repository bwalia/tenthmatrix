import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import { localeHref } from '@/app/components/sections/links';
import { uiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function Industries({ data, locale }) {
  const ui = uiStrings(data.ui);
  const h = data.header || {};
  return (
    <>
      <Hero eyebrow={ui.industries} title={h.title} lede={h.subtitle} art>
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>
      <Section id="industries">
        <FeatureGrid
          items={(data.industries || []).map((i) => ({ ...i, title: i.name, list: i.benefits, metrics: i.stats }))}
          locale={locale}
          columns={2}
          listLabel={ui.keyBenefits}
        />
      </Section>
      <CTA
        id="cta"
        title={ui.ctaIndustriesTitle}
        body={ui.ctaIndustriesBody}
        primary={{ label: ui.contactSales, href: localeHref('/contact-us', locale) }}
        secondary={{ label: ui.bookNow, href: localeHref('/book-online', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'industries.json',
  route: '/industries',
  Template: Industries,
  meta: (d) => ({ title: d.header?.title, description: d.header?.subtitle }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
