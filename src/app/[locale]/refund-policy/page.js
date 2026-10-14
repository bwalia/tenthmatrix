import { Hero, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import LegalDocument from '@/app/components/sections/LegalDocument';
import { localeHref } from '@/app/components/sections/links';
import { uiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

function Refund({ data, locale }) {
  const ui = uiStrings(data.ui);
  const c = data.content || {};
  return (
    <>
      <Hero
        title={data.hero?.title}
        lede={data.hero?.description}
        meta={c.lastUpdated ? [`${ui.lastUpdated}: ${c.lastUpdated}`] : undefined}
        art={false}
      />
      <LegalDocument data={{ sections: c.sections }} ui={ui} locale={locale} />
      {c.cta?.title && (
        <CTA
          id="cta"
          title={c.cta.title}
          body={c.cta.description}
          primary={c.cta.buttonText ? { label: c.cta.buttonText, href: localeHref(c.cta.buttonLink || '/contact-us', locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'refund-policy.json', route: '/refund-policy', Template: Refund });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
