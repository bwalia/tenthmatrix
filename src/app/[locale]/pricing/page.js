import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import PricingTable from '@/app/components/sections/PricingTable';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import FaqAccordion from '@/app/components/sections/FaqAccordion';
import CheckList from '@/app/components/sections/CheckList';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function Pricing({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  return (
    <>
      <Hero eyebrow={h.title} title={h.subtitle || h.title} lede={h.description} align="center" />
      <Section id="plans" spacing="compact">
        <PricingTable plans={data.plans} locale={locale} popularLabel={ui.mostPopular} />
      </Section>
      {data.addons?.length > 0 && (
        <Section id="addons" title={ui.addons} tone="sunken">
          <FeatureGrid items={data.addons.map((a) => ({ ...a, badge: a.price }))} locale={locale} columns={data.addons.length === 4 ? 2 : 3} />
        </Section>
      )}
      {data.faq?.length > 0 && (
        <Section id="faq" title={ui.faq}>
          <FaqAccordion items={data.faq} />
        </Section>
      )}
      {data.enterprise?.title && (
        <CTA
          id="enterprise"
          eyebrow={ui.enterprise}
          title={data.enterprise.title}
          body={data.enterprise.description}
          primary={{ label: ui.contactSales, href: localeHref('/contact-us', locale) }}
          secondary={{ label: ui.bookNow, href: localeHref('/book-online', locale) }}
        >
          {data.enterprise.features?.length > 0 && (
            <div className={s.ctaList}>
              <CheckList items={data.enterprise.features} columns={2} variant="cell" />
            </div>
          )}
        </CTA>
      )}
    </>
  );
}

const route = createRoute({
  file: 'pricing.json',
  route: '/pricing',
  Template: Pricing,
  meta: (d) => ({ title: d.header?.title, description: d.header?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
