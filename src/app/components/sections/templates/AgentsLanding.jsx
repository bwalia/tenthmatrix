import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import Overview from '../Overview';
import FeatureGrid from '../FeatureGrid';
import StatsBand from '../StatsBand';
import Steps from '../Steps';
import FaqAccordion from '../FaqAccordion';
import PricingTable from '../PricingTable';
import ComparisonTable from '../ComparisonTable';
import Timeline from '../Timeline';
import VideoGrid from '../VideoGrid';
import { heroActions } from '../ActionLink';
import { localeHref, isShopLink } from '../links';
import { uiStrings } from '../ui';

const stripColon = (t) => (t ? String(t).replace(/:\s*$/, '') : t);

/**
 * Agent platform pages (claude-agents, grok-bot, openai-agents):
 * hero + stats, video, introduction, features, use cases, technical details,
 * comparison, implementation, news, pricing, FAQ, CTA.
 */
export default function AgentsLanding({ data, locale }) {
  const ui = uiStrings();
  const pageUi = data.ui || {};
  const hero = data.hero || {};
  const header = data.header || {};
  const buttons = (data.cta?.buttons || []).filter((b) => b?.text && b?.link && !isShopLink(b.link));
  const actions = heroActions(buttons.slice(0, 2).map((b) => ({ label: b.text, href: b.link })), locale);
  const meta = [header.lastUpdated && `${ui.lastUpdated}: ${header.lastUpdated}`, header.announcementDate].filter(Boolean);
  const cols = data.comparison?.columns || [ui.aspect, ui.traditional, ui.agentWorkflow, ui.improvement];
  const videoHeading = hero.videoHeading || pageUi.videoHeading || ui.video;

  return (
    <>
      <Hero eyebrow={hero.badge || header.title} title={hero.title || header.title} lede={hero.subtitle || header.subtitle} actions={actions} meta={meta} art>
        {hero.description && <p className={s.heroText}>{hero.description}</p>}
      </Hero>

      {hero.stats?.length > 0 && (
        <Section id="at-a-glance" spacing="compact">
          <StatsBand stats={hero.stats} />
        </Section>
      )}

      {data.introduction && (
        <Overview title={data.introduction.title} content={data.introduction.content} points={data.introduction.keyPoints} locale={locale} />
      )}

      {hero.video && (
        <Section id="video" title={videoHeading} tone="sunken" width="narrow">
          <VideoGrid
            videos={[{ title: hero.videoTitle || videoHeading, embedUrl: hero.video }]}
            columns={1}
            playLabel={ui.playVideo}
            watchLabel={ui.watchOnYouTube}
          />
        </Section>
      )}

      {data.features?.length > 0 && (
        <Section id="features" title={pageUi.featuresHeading || ui.features}>
          <FeatureGrid items={data.features} locale={locale} columns={2} listLabel={ui.capabilities} />
        </Section>
      )}

      {data.useCases?.length > 0 && (
        <Section id="use-cases" title={pageUi.useCasesHeading || ui.realWorldUseCases} lede={pageUi.useCasesSubtitle} tone="sunken">
          <FeatureGrid
            items={data.useCases}
            locale={locale}
            columns={data.useCases.length % 3 === 0 ? 3 : 2}
            listLabel={stripColon(pageUi.keyBenefits) || ui.keyBenefits}
          />
        </Section>
      )}

      {data.technicalDetails?.components?.length > 0 && (
        <Section id="technical" title={data.technicalDetails.title || ui.technical} lede={data.technicalDetails.subtitle}>
          <FeatureGrid items={data.technicalDetails.components} locale={locale} columns={3} variant="plain" />
        </Section>
      )}

      {data.comparison?.items?.length > 0 && (
        <Section id="comparison" title={data.comparison.title} tone="sunken">
          <ComparisonTable
            columns={[
              { key: 'aspect', label: cols[0] },
              { key: 'traditional', label: cols[1] },
              { key: 'agentWorkflow', label: cols[2] },
              { key: 'improvement', label: cols[3] },
            ]}
            rows={data.comparison.items}
            highlight="agentWorkflow"
          />
        </Section>
      )}

      {data.implementation?.phases?.length > 0 && (
        <Section id="implementation" title={data.implementation.title || ui.implementation} lede={data.implementation.subtitle}>
          <Steps steps={data.implementation.phases} />
        </Section>
      )}

      {data.news?.length > 0 && (
        <Section id="news" title={pageUi.newsHeading || ui.news} width="narrow">
          <Timeline items={data.news} />
        </Section>
      )}

      {data.pricing?.plans?.length > 0 && (
        <Section id="pricing" title={data.pricing.title || ui.pricing} lede={data.pricing.subtitle} tone="sunken">
          <PricingTable plans={data.pricing.plans} locale={locale} popularLabel={pageUi.mostPopular || ui.mostPopular} />
        </Section>
      )}

      {data.faq?.length > 0 && (
        <Section id="faq" title={pageUi.faqHeading || ui.faq}>
          <FaqAccordion items={data.faq} />
        </Section>
      )}

      {data.cta?.title && (
        <CTA
          id="cta"
          title={data.cta.title}
          body={data.cta.description}
          primary={buttons[0] ? { label: buttons[0].text, href: localeHref(buttons[0].link, locale) } : undefined}
          secondary={buttons[1] ? { label: buttons[1].text, href: localeHref(buttons[1].link, locale) } : undefined}
        />
      )}
    </>
  );
}
