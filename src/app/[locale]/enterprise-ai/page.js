import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import StatsBand from '@/app/components/sections/StatsBand';
import Steps from '@/app/components/sections/Steps';
import ComparisonTable from '@/app/components/sections/ComparisonTable';
import { heroActions } from '@/app/components/sections/ActionLink';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function EnterpriseAi({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.hero || {};
  const cta = data.cta || {};
  const b = data.budget;
  return (
    <>
      <Hero
        eyebrow={data.header?.title}
        title={h.title}
        lede={h.subtitle}
        actions={heroActions(cta.buttonText ? [{ label: cta.buttonText, href: cta.buttonLink }] : [], locale)}
        art
      >
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>
      {h.stats?.length > 0 && (
        <Section id="at-a-glance" spacing="compact">
          <StatsBand stats={h.stats} />
        </Section>
      )}
      {data.labDesign && (
        <Section id="lab-design" title={data.labDesign.title} lede={data.labDesign.subtitle}>
          <FeatureGrid items={data.labDesign.items} locale={locale} columns={4} />
        </Section>
      )}
      {data.teamStructure && (
        <Section id="team" title={data.teamStructure.title} lede={data.teamStructure.subtitle} tone="sunken">
          <FeatureGrid
            items={data.teamStructure.roles.map((r) => ({ ...r, badge: r.count, list: r.responsibilities }))}
            locale={locale}
            columns={3}
          />
        </Section>
      )}
      {data.infrastructureStack && (
        <Section id="stack" title={data.infrastructureStack.title} lede={data.infrastructureStack.subtitle}>
          <FeatureGrid items={data.infrastructureStack.layers.map((l) => ({ ...l, list: l.items }))} locale={locale} columns={4} variant="plain" />
        </Section>
      )}
      {data.buildVsBuy && (
        <Section id="build-vs-buy" title={data.buildVsBuy.title} lede={data.buildVsBuy.subtitle} tone="sunken">
          <ComparisonTable
            columns={[
              { key: 'aspect', label: ui.aspect },
              { key: 'build', label: ui.build },
              { key: 'buy', label: ui.buy },
              { key: 'recommendation', label: ui.recommendation },
            ]}
            rows={data.buildVsBuy.items}
            highlight="recommendation"
          />
        </Section>
      )}
      {data.governance && (
        <Section id="governance" title={data.governance.title} lede={data.governance.subtitle}>
          <FeatureGrid items={data.governance.categories.map((c) => ({ title: c.title, list: c.items }))} locale={locale} columns={3} />
        </Section>
      )}
      {b?.rows?.length > 0 && (
        <Section id="budget" title={b.title} lede={b.subtitle} tone="sunken">
          <ComparisonTable
            columns={[
              { key: 'category', label: ui.category },
              { key: 'year1', label: ui.year1 },
              { key: 'year2', label: ui.year2 },
              { key: 'notes', label: ui.notes },
            ]}
            rows={b.rows}
            footer={{ category: ui.total, year1: b.totalYear1, year2: b.totalYear2, notes: '' }}
          />
          {b.roiNote && <p className={s.note}>{b.roiNote}</p>}
        </Section>
      )}
      {data.phasedRollout && (
        <Section id="rollout" title={data.phasedRollout.title} lede={data.phasedRollout.subtitle}>
          <Steps steps={data.phasedRollout.phases} />
        </Section>
      )}
      {cta.title && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={cta.buttonText ? { label: cta.buttonText, href: localeHref(cta.buttonLink || '/contact-us', locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'enterprise-ai.json', route: '/enterprise-ai', Template: EnterpriseAi });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
