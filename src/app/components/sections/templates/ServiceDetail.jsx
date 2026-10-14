import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import Overview from '../Overview';
import FeatureGrid from '../FeatureGrid';
import Steps from '../Steps';
import CheckList from '../CheckList';
import LinkCards from '../LinkCards';
import ActionLink, { heroActions } from '../ActionLink';
import { localeHref } from '../links';
import { useUiStrings } from '../ui';

/**
 * Service detail (services/*): hero, overview, deliverables, pricing + inclusions,
 * process, related reading, CTA.
 */
export default function ServiceDetail({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const h = data.header || {};
  const cta = data.cta || {};
  const media = h.image ? (
    <figure className={s.heroMedia}>
      <img src={h.image} alt={h.imageAlt || ''} width={1200} height={800} fetchPriority="high" />
    </figure>
  ) : (
    true
  );
  const p = data.pricing;

  return (
    <>
      <Hero
        eyebrow={h.tagline}
        title={h.title}
        lede={h.subtitle}
        art={media}
        actions={heroActions(cta.button && cta.link ? [{ label: cta.button, href: cta.link }] : [], locale)}
      >
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>

      {data.overview && <Overview title={data.overview.title} content={data.overview.content} locale={locale} />}

      {data.features?.length > 0 && (
        <Section id="deliver" title={data.featuresTitle || ui.whatWeDeliver} tone="sunken">
          <FeatureGrid items={data.features} locale={locale} columns={3} />
        </Section>
      )}

      {p && (
        <Section id="pricing" title={p.title || ui.pricing}>
          <div className={`${s.split} ${s.splitEven}`}>
            <div className={s.price}>
              <p className={s.priceLabel}>{ui.startingFrom}</p>
              <p className={s.priceValue}>{p.starting_from}</p>
              {p.description && <p className={s.priceText}>{p.description}</p>}
              {cta.link && (
                <ActionLink href={cta.link} locale={locale}>
                  {cta.button || ui.contactSales}
                </ActionLink>
              )}
            </div>
            {p.includes?.length > 0 && (
              <div className={s.panel}>
                <h3 className={s.panelTitle}>{ui.whatsIncluded}</h3>
                <CheckList items={p.includes} />
              </div>
            )}
          </div>
        </Section>
      )}

      {data.process?.steps?.length > 0 && (
        <Section id="process" title={data.process.title} tone="sunken">
          <Steps steps={data.process.steps} />
        </Section>
      )}

      {data.relatedReading?.items?.length > 0 && (
        <Section id="related" title={data.relatedReading.title} lede={data.relatedReading.intro}>
          <LinkCards items={data.relatedReading.items} locale={locale} variant="rows" />
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
