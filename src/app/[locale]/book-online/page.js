import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import Steps from '@/app/components/sections/Steps';
import { localeHref, withoutShop } from '@/app/components/sections/links';

export const dynamic = 'force-static';

// TenthMatrix version: consultations only, never the shop option.
function BookOnline({ data, locale }) {
  const c = data.content || {};
  const services = withoutShop(c.services).filter((sv) => !/shop/i.test(`${sv.buttonText || ''}`));
  return (
    <>
      <Hero title={data.hero?.title} lede={data.hero?.description} art />
      <Section id="services" lede={c.intro}>
        <FeatureGrid
          items={services.map((sv) => ({
            ...sv,
            badge: sv.duration,
            href: sv.buttonLink || '/contact-us',
            linkLabel: sv.buttonText,
          }))}
          locale={locale}
          columns={services.length === 4 ? 2 : 3}
        />
      </Section>
      {c.process?.steps?.length > 0 && (
        <Section id="process" title={c.process.title} tone="sunken">
          <Steps steps={c.process.steps} />
        </Section>
      )}
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

const route = createRoute({ file: 'book-online.json', route: '/book-online', Template: BookOnline });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
