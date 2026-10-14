import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import Overview from '../Overview';
import FeatureGrid from '../FeatureGrid';
import Steps from '../Steps';
import CheckList from '../CheckList';
import FaqAccordion from '../FaqAccordion';
import LinkCards from '../LinkCards';
import MediaFigure from '../MediaFigure';
import Workflows from '../Workflows';
import { heroActions } from '../ActionLink';
import { localeHref } from '../links';
import { useUiStrings } from '../ui';

/**
 * Enterprise AI landing (ai-agents, ai-automation, ai-solutions, ai-upskilling,
 * applied-ai, generative-ai). Renders only the sections present in the JSON,
 * in the same order as the source page.
 */
export default function MarketingLanding({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  const visual = h.visual?.src ? (
    <figure className={s.heroMedia}>
      <img src={h.visual.src} alt={h.visual.alt || ''} width={h.visual.width || 1400} height={h.visual.height || 720} fetchPriority="high" />
    </figure>
  ) : (
    true
  );
  const cta = data.cta;

  return (
    <>
      <Hero
        eyebrow={h.eyebrow}
        title={h.title}
        lede={h.subtitle}
        art={visual}
        actions={heroActions(h.cta ? [{ label: h.cta.label, href: h.cta.link }] : [], locale)}
      >
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>

      {data.overview && (
        <Overview
          title={data.overview.title}
          content={data.overview.content}
          media={data.overview.diagram}
          locale={locale}
        />
      )}

      {data.visualStory?.diagram && (
        <Section id="visual-story" title={data.visualStory.title} lede={data.visualStory.intro} tone="sunken">
          <MediaFigure media={data.visualStory.diagram} />
        </Section>
      )}

      {data.challenges?.items?.length > 0 && (
        <Section id="challenges" title={data.challenges.title} lede={data.challenges.intro}>
          <FeatureGrid items={data.challenges.items} locale={locale} columns={3} />
        </Section>
      )}

      {data.workflows?.items?.length > 0 && (
        <Section id="workflows" title={data.workflows.title} lede={data.workflows.subtitle} tone="sunken">
          <Workflows items={data.workflows.items} labels={ui} />
        </Section>
      )}

      {data.pathways?.items?.length > 0 && (
        <Section id="pathways" title={data.pathways.title} lede={data.pathways.subtitle}>
          <FeatureGrid items={data.pathways.items} locale={locale} columns={3} />
        </Section>
      )}

      {data.whoFor?.items?.length > 0 && (
        <Section id="who-for" title={data.whoFor.title} lede={data.whoFor.intro} tone="sunken">
          <FeatureGrid items={data.whoFor.items} locale={locale} columns={3} variant="plain" />
        </Section>
      )}

      {data.benefits?.items?.length > 0 && (
        <Section id="benefits" title={data.benefits.title} lede={data.benefits.intro}>
          <FeatureGrid items={data.benefits.items} locale={locale} columns={data.benefits.items.length === 4 ? 2 : 3} variant="numbered" />
        </Section>
      )}

      {data.controlModel && (
        <Section id="control-model" title={data.controlModel.title} lede={data.controlModel.intro} tone="sunken">
          <div className={s.split}>
            <MediaFigure media={data.controlModel.diagram} />
            <FeatureGrid items={data.controlModel.points} locale={locale} columns={1} variant="plain" />
          </div>
        </Section>
      )}

      {data.coverage?.diagram && (
        <Section id="coverage" title={data.coverage.title} lede={data.coverage.intro}>
          <MediaFigure media={data.coverage.diagram} />
        </Section>
      )}

      {data.programmes?.items?.length > 0 && (
        <Section id="programmes" title={data.programmes.title} lede={data.programmes.subtitle}>
          <FeatureGrid items={data.programmes.items} locale={locale} columns={2} />
        </Section>
      )}

      {data.outcomes?.items?.length > 0 && (
        <Section id="outcomes" title={data.outcomes.title} lede={data.outcomes.intro} tone="sunken">
          <FeatureGrid items={data.outcomes.items} locale={locale} columns={4} variant="plain" />
        </Section>
      )}

      {data.process?.steps?.length > 0 && (
        <Section id="process" title={data.process.title} lede={data.process.intro}>
          {data.process.diagram && (
            <div className={s.stack}>
              <MediaFigure media={data.process.diagram} />
            </div>
          )}
          <div className={data.process.diagram ? s.spacer : undefined}>
            <Steps steps={data.process.steps} />
          </div>
        </Section>
      )}

      {data.whenRight?.items?.length > 0 && (
        <Section id="when-right" title={data.whenRight.title} tone="sunken" width="narrow">
          <CheckList items={data.whenRight.items} />
        </Section>
      )}

      {data.offerings?.items?.length > 0 && (
        <Section id="offerings" title={data.offerings.title} lede={data.offerings.subtitle}>
          <FeatureGrid items={data.offerings.items} locale={locale} columns={3} />
        </Section>
      )}

      {data.faq?.items?.length > 0 && (
        <Section id="faq" title={data.faq.title || ui.faq} tone="sunken">
          <FaqAccordion items={data.faq.items} />
        </Section>
      )}

      {data.related?.items?.length > 0 && (
        <Section id="related" title={data.related.title} lede={data.related.description}>
          <LinkCards items={data.related.items} locale={locale} />
        </Section>
      )}

      {cta?.title && (
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
