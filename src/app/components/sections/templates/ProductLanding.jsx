import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import Overview from '../Overview';
import FeatureGrid from '../FeatureGrid';
import Steps from '../Steps';
import CheckList from '../CheckList';
import LinkCards from '../LinkCards';
import MediaFigure from '../MediaFigure';
import VideoGrid from '../VideoGrid';
import ComparisonTable from '../ComparisonTable';
import RichText from '../RichText';
import ActionLink, { heroActions } from '../ActionLink';
import { localeHref, isShopLink } from '../links';
import { useUiStrings } from '../ui';

const act = (a) => (a ? { label: a.text || a.label, href: a.href || a.link } : null);

/**
 * Our software products (ring-promoter, proxy10x, wsl-vault, jobshout, sysops247).
 * Shared shape: header, intro{links}, videos, pillars, steps, howItWorks, features,
 * agents, waf, aiAngle, roadmap, architecture, visuals, screenshot, deploy,
 * externalSite, related/relatedReading, cta{primary,secondary,tertiary,quaternary}.
 */
export default function ProductLanding({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  const c = data.cta || {};
  const ctaActions = [c.primary, c.secondary, c.tertiary, c.quaternary].map(act).filter((a) => a && a.label && a.href && !isShopLink(a.href));
  const related = data.related || data.relatedReading;
  // CTA shows two buttons; extra CTA links join the related list.
  const relatedItems = [
    ...(related?.items || []),
    ...ctaActions.slice(2).map((a) => ({ title: a.label, href: a.href })),
  ];
  const features = data.features;
  const how = data.howItWorks;
  const waf = data.waf;

  return (
    <>
      <Hero eyebrow={h.eyebrow} title={h.title} lede={h.subtitle} actions={heroActions(ctaActions.slice(0, 2), locale)} art>
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>

      {data.intro && (
        <Overview title={data.intro.title} content={data.intro.body} links={data.intro.links} locale={locale} />
      )}

      {data.videos?.length > 0 && (
        <Section id="videos" title={data.videosTitle || ui.video} tone="sunken">
          <VideoGrid videos={data.videos} columns={data.videos.length === 1 ? 1 : 2} playLabel={ui.playVideo} watchLabel={ui.watchOnYouTube} />
        </Section>
      )}

      {data.screenshot?.src && (
        <Section id="screenshot" title={data.screenshot.title}>
          <MediaFigure media={data.screenshot} />
        </Section>
      )}

      {data.pillars?.items?.length > 0 && (
        <Section id="pillars" title={data.pillars.title}>
          <FeatureGrid items={data.pillars.items} locale={locale} columns={4} />
        </Section>
      )}

      {data.steps?.items?.length > 0 && (
        <Section id="steps" title={data.steps.title} tone="sunken">
          <Steps steps={data.steps.items} />
        </Section>
      )}

      {how && (
        <Section id="how-it-works" title={how.title} lede={how.intro} tone="sunken">
          <div className={s.stack}>
            {how.flow?.length > 0 && <Steps steps={how.flow.map((f) => ({ ...f, title: String(f.title).replace(/^\d+\.\s*/, '') }))} />}
            {how.rings?.length > 0 && (
              <FeatureGrid items={how.rings.map((r) => ({ title: r.name, badge: r.label, description: r.role }))} columns={4} />
            )}
            {how.responseCodes?.length > 0 && (
              <ComparisonTable
                columns={[
                  { key: 'code', label: ui.code },
                  { key: 'meaning', label: ui.meaning },
                ]}
                rows={how.responseCodes}
              />
            )}
          </div>
        </Section>
      )}

      {(features?.items?.length > 0 || Array.isArray(features)) && (
        <Section id="features" title={features.title || ui.features} lede={features.intro}>
          <FeatureGrid items={features.items || features} locale={locale} columns={3} />
        </Section>
      )}

      {data.agents?.items?.length > 0 && (
        <Section id="agents" title={data.agents.title} lede={data.agents.intro} tone="sunken">
          <FeatureGrid items={data.agents.items} locale={locale} columns={data.agents.items.length % 4 === 0 ? 4 : 3} variant="plain" />
        </Section>
      )}

      {waf && (
        <Section id="waf" title={waf.title} lede={waf.intro} tone="sunken">
          <div className={s.stack}>
            {waf.pipeline?.length > 0 && (
              <div>
                <h3 className={s.panelTitle}>{waf.pipelineTitle}</h3>
                <ol className={s.codeList}>
                  {waf.pipeline.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            )}
            {waf.stages?.length > 0 && (
              <div>
                <h3 className={s.panelTitle}>{waf.stagesTitle}</h3>
                <ComparisonTable
                  columns={[
                    { key: 'code', label: ui.code },
                    { key: 'name', label: ui.stage },
                    { key: 'detail', label: ui.detail },
                  ]}
                  rows={waf.stages}
                />
              </div>
            )}
            {(waf.signaturesTitle || waf.governance?.length > 0) && (
              <div>
                {waf.signaturesTitle && <h3 className={s.panelTitle}>{waf.signaturesTitle}</h3>}
                {waf.signaturesIntro && <RichText text={waf.signaturesIntro} className={s.muted} />}
                <FeatureGrid items={waf.governance} columns={2} variant="plain" headingLevel={4} />
              </div>
            )}
            {waf.modes?.length > 0 && (
              <div>
                {waf.bindingTitle && <h3 className={s.panelTitle}>{waf.bindingTitle}</h3>}
                {waf.bindingIntro && <RichText text={waf.bindingIntro} className={s.muted} />}
                <FeatureGrid items={waf.modes} columns={2} headingLevel={4} />
              </div>
            )}
          </div>
        </Section>
      )}

      {data.aiAngle && (
        <Section id="ai" title={data.aiAngle.title} lede={data.aiAngle.intro} width="narrow">
          <CheckList items={data.aiAngle.points} />
        </Section>
      )}

      {data.roadmap?.items?.length > 0 && (
        <Section id="roadmap" title={data.roadmap.title} lede={data.roadmap.intro}>
          <FeatureGrid items={data.roadmap.items.map((r) => ({ ...r, badge: r.status }))} locale={locale} columns={3} />
        </Section>
      )}

      {data.architecture?.steps?.length > 0 && (
        <Section id="architecture" title={data.architecture.title} lede={data.architecture.intro} tone="sunken">
          <Steps steps={data.architecture.steps} layout="list" />
        </Section>
      )}

      {data.visuals?.items?.length > 0 && (
        <Section id="visuals" title={data.visuals.title} lede={data.visuals.intro}>
          <div className={s.stack}>
            {data.visuals.items.map((v, i) => (
              <MediaFigure key={i} media={v} />
            ))}
          </div>
        </Section>
      )}

      {data.deploy && (
        <Section id="deploy" spacing="compact">
          <div className={s.hardware}>
            <div>
              <h2>{data.deploy.title}</h2>
              <p>{data.deploy.body}</p>
            </div>
            {data.deploy.ctaHref && (
              <ActionLink href={data.deploy.ctaHref} locale={locale} variant="secondary">
                {data.deploy.ctaLabel}
              </ActionLink>
            )}
          </div>
        </Section>
      )}

      {data.externalSite?.href && (
        <Section id="product-site" spacing="compact">
          <div className={s.hardware}>
            <div>
              <h2>{data.externalSite.label}</h2>
              <p>{data.externalSite.text}</p>
            </div>
            <ActionLink href={data.externalSite.href} locale={locale} variant="secondary">
              {data.externalSite.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </ActionLink>
          </div>
        </Section>
      )}

      {relatedItems.length > 0 && (
        <Section id="related" title={related?.title || ui.learnMore} lede={related?.intro}>
          <LinkCards items={relatedItems} locale={locale} />
        </Section>
      )}

      {c.title && (
        <CTA
          id="cta"
          title={c.title}
          body={c.body || c.description}
          primary={ctaActions[0] ? { label: ctaActions[0].label, href: localeHref(ctaActions[0].href, locale) } : undefined}
          secondary={ctaActions[1] ? { label: ctaActions[1].label, href: localeHref(ctaActions[1].href, locale) } : undefined}
        />
      )}
    </>
  );
}
