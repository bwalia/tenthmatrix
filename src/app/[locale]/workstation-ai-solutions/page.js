import { Hero, Section } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import CheckList from '@/app/components/sections/CheckList';
import { useUiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

// Path kept from Workstation for a straight 301 host swap (manifest: no rename).
// Renders the products.json catalogue without the hardware package cards.
function Solutions({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const items = (data.content || []).filter(
    (c) => c.category !== 'hardware' && !/workstation package|sme package/i.test(c.title || '')
  );
  return (
    <>
      <Hero eyebrow={data.header?.title} title={ui.solutionsTitle} lede={data.sections?.software?.description} art />
      <Section id="solutions" title={data.sections?.software?.title}>
        <FeatureGrid
          items={items.map((c) => ({ ...c, href: c.external || c.link, linkLabel: c.cta }))}
          locale={locale}
          columns={3}
          showImages
          showIcons={false}
          listLabel={ui.keyBenefits}
        />
      </Section>
      {data.customerService?.features?.length > 0 && (
        <Section id="support" title={data.customerService.title} lede={data.customerService.description} tone="sunken">
          <FeatureGrid items={data.customerService.features} columns={4} variant="plain" />
        </Section>
      )}
      {data.qualityAssurance && (
        <Section id="quality" title={data.qualityAssurance.title} lede={data.qualityAssurance.description}>
          <div className={`${s.split} ${s.splitEven}`}>
            <div className={s.panel}>
              <h3 className={s.panelTitle}>{ui.certifications}</h3>
              <CheckList items={data.qualityAssurance.certifications} />
            </div>
            <div className={s.panel}>
              <h3 className={s.panelTitle}>{ui.performanceMetrics}</h3>
              <CheckList items={data.qualityAssurance.metrics} variant="cell" />
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

const route = createRoute({
  file: 'products.json',
  route: '/workstation-ai-solutions',
  Template: Solutions,
  meta: () => ({ title: 'AI solutions catalogue' }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
