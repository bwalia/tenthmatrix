import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureRows from '@/app/components/sections/FeatureRows';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

// Renamed from Workstation's /why-workstation (migration/redirects.json).
function WhyTenthMatrix({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const items = data.content || [];
  const [first, ...rest] = items;
  return (
    <>
      <Hero
        eyebrow={data.header?.title}
        title={first?.title || data.header?.title}
        lede={first?.description}
        actions={first?.cta ? [{ label: first.cta, href: localeHref(first.link || '/contact-us', locale) }] : undefined}
        art
      />
      <Section id="reasons">
        <FeatureRows items={rest} locale={locale} watchLabel={ui.watchVideo} />
      </Section>
      <CTA
        id="cta"
        title={ui.whyCtaTitle}
        body={ui.whyCtaBody}
        primary={{ label: ui.contactSales, href: localeHref('/contact-us', locale) }}
        secondary={{ label: ui.bookNow, href: localeHref('/book-online', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'why-tenthmatrix.json',
  route: '/why-tenthmatrix',
  Template: WhyTenthMatrix,
  meta: (d) => ({ title: d.header?.title, description: d.content?.[0]?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
