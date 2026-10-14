import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FeatureGrid from '@/app/components/sections/FeatureGrid';
import StatsBand from '@/app/components/sections/StatsBand';
import ComparisonTable from '@/app/components/sections/ComparisonTable';
import CheckList from '@/app/components/sections/CheckList';
import VideoGrid from '@/app/components/sections/VideoGrid';
import ActionLink from '@/app/components/sections/ActionLink';
import { localeHref, WORKSTATION_URL } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

const isHardwareItem = (it) =>
  it?.category === 'hardware' || /workstation\.co\.uk/i.test(it?.href || it?.link || '');

// Software half of the Workstation products page: hardwareProducts and
// hardware catalogue cards are dropped, replaced by one link to Workstation.
function Products({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const f = data.featured;
  const software = data.content?.filter((c) => !isHardwareItem(c)) || [];
  const softwareProducts = data.softwareProducts?.items?.filter((i) => !isHardwareItem(i)) || [];
  const fw = data.agenticFrameworks;
  const ca = data.codingAgents;
  return (
    <>
      <Hero
        eyebrow={data.sections?.software?.title}
        title={data.header?.title}
        lede={data.sections?.software?.description || data.header?.description}
        art
      />

      {softwareProducts.length > 0 && (
        <Section id="software" title={data.softwareProducts.title} lede={data.softwareProducts.subtitle}>
          <FeatureGrid items={softwareProducts} locale={locale} columns={3} />
        </Section>
      )}

      {fw?.items?.length > 0 && (
        <Section id="frameworks" eyebrow={fw.subtitle} title={fw.title} lede={fw.description} tone="sunken">
          <FeatureGrid items={fw.items} locale={locale} columns={4} listLabel={ui.useCases} />
          {fw.articleHref && (
            <div className={s.spacer}>
              <ActionLink href={fw.articleHref} locale={locale} variant="tertiary">
                {fw.articleLabel}
              </ActionLink>
            </div>
          )}
        </Section>
      )}

      {ca?.items?.length > 0 && (
        <Section id="coding-agents" eyebrow={ca.subtitle} title={ca.title} lede={ca.description}>
          <FeatureGrid items={ca.items} locale={locale} columns={4} listLabel={ui.capabilities} />
          {ca.articleHref && (
            <div className={s.spacer}>
              <ActionLink href={ca.articleHref} locale={locale} variant="tertiary">
                {ca.articleLabel}
              </ActionLink>
            </div>
          )}
        </Section>
      )}

      {f && (
        <Section id="featured" eyebrow={f.prehead} title={f.title} lede={f.subtitle} tone="sunken">
          <div className={s.stack}>
            <div className={`${s.split} ${s.splitEven}`}>
              <p className={s.muted}>{f.description}</p>
              {f.video && <VideoGrid videos={[{ title: f.title, embedUrl: f.video }]} columns={1} playLabel={ui.playVideo} />}
            </div>
            <StatsBand stats={f.stats} />
          </div>
        </Section>
      )}

      {f?.deployment?.options?.length > 0 && (
        <Section id="approach" title={f.deployment.title}>
          <FeatureGrid
            items={f.deployment.options.map((o) => ({ ...o, badge: o.ideal }))}
            locale={locale}
            columns={3}
          />
        </Section>
      )}

      {f?.aiAgents?.agents?.length > 0 && (
        <Section id="tools" title={f.aiAgents.title} lede={f.aiAgents.description} tone="sunken">
          <FeatureGrid items={f.aiAgents.agents} locale={locale} columns={f.aiAgents.agents.length === 4 ? 4 : 3} variant="plain" />
        </Section>
      )}

      {f?.competitive?.challenges?.length > 0 && (
        <Section id="why" title={f.competitive.title} lede={f.competitive.subtitle}>
          <ComparisonTable
            columns={[
              { key: 'problem', label: ui.challenge },
              { key: 'solution', label: ui.approach },
              { key: 'impact', label: ui.impact },
            ]}
            rows={f.competitive.challenges}
            highlight="solution"
          />
        </Section>
      )}

      {software.length > 0 && (
        <Section id="catalogue" title={data.sections?.software?.title} lede={data.sections?.software?.description} tone="sunken">
          <FeatureGrid
            items={software.map((c) => ({ ...c, href: c.external || c.link, linkLabel: c.cta, badge: undefined }))}
            locale={locale}
            columns={3}
          />
        </Section>
      )}

      {(data.customerService || data.qualityAssurance) && (
        <Section id="quality" title={data.qualityAssurance?.title} lede={data.qualityAssurance?.description}>
          <div className={s.stack}>
            {data.qualityAssurance && (
              <div className={`${s.split} ${s.splitEven}`}>
                <CheckList items={data.qualityAssurance.certifications} />
                <CheckList items={data.qualityAssurance.metrics} variant="cell" />
              </div>
            )}
            {data.customerService?.features?.length > 0 && (
              <div>
                <h3 className={s.panelTitle}>{data.customerService.title}</h3>
                <FeatureGrid items={data.customerService.features} columns={4} variant="plain" headingLevel={4} />
              </div>
            )}
          </div>
        </Section>
      )}

      <Section id="hardware" spacing="compact">
        <div className={s.hardware}>
          <div>
            <h2>{ui.hardwareTitle}</h2>
            <p>{ui.hardwareBody}</p>
          </div>
          <ActionLink href={`${WORKSTATION_URL}/ai-workstations`} locale={locale} variant="secondary">
            {ui.hardwareLink}
          </ActionLink>
        </div>
      </Section>

      {f?.cta?.primary && (
        <CTA
          id="cta"
          title={f.title}
          body={f.subtitle}
          primary={{ label: f.cta.primary, href: localeHref(f.cta.link || '/contact-us', locale) }}
          secondary={f.cta.secondary ? { label: f.cta.secondary, href: localeHref('/book-online', locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'products.json', route: '/products', Template: Products });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
