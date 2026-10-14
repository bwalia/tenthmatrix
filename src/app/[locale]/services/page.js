import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import Overview from '@/app/components/sections/Overview';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import LinkCards from '@/app/components/sections/LinkCards';
import { heroActions } from '@/app/components/sections/ActionLink';
import { localeHref } from '@/app/components/sections/links';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function Services({ data, locale }) {
  const h = data.header || {};
  const cta = data.cta || {};
  return (
    <>
      <Hero
        eyebrow={h.title}
        title={h.subtitle || h.title}
        actions={heroActions(cta.button ? [{ label: cta.button, href: cta.link }] : [], locale)}
        art
      >
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>

      {data.overview && <Overview title={data.overview.title} content={data.overview.content} locale={locale} />}

      {data.pillars?.length > 0 && (
        <Section id="pillars" tone="sunken" spacing="compact">
          <FeatureGrid items={data.pillars} locale={locale} columns={3} variant="plain" />
        </Section>
      )}

      {data.engines?.items?.length > 0 && (
        <Section id="engines" eyebrow={data.engines.eyebrow} title={data.engines.title} lede={data.engines.subtitle}>
          <FeatureGrid
            items={data.engines.items.map((e) => ({ ...e, badge: e.tagline, linkLabel: e.cta }))}
            locale={locale}
            columns={data.engines.items.length === 4 ? 2 : 3}
            showImages
            showIcons={false}
          />
        </Section>
      )}

      {data.offerings?.items?.length > 0 && (
        <Section id="offerings" title={data.offerings.title} lede={data.offerings.subtitle} tone="sunken">
          <FeatureGrid items={data.offerings.items} locale={locale} columns={3} />
        </Section>
      )}

      {data.related?.items?.length > 0 && (
        <Section id="related" title={data.related.title} lede={data.related.description}>
          <LinkCards items={data.related.items} locale={locale} />
        </Section>
      )}

      {cta.title && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={cta.button && cta.link ? { label: cta.button, href: localeHref(cta.link, locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'services.json', route: '/services', Template: Services });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
