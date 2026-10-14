import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import Overview from '../Overview';
import FeatureGrid from '../FeatureGrid';
import Steps from '../Steps';
import CheckList from '../CheckList';
import FaqAccordion from '../FaqAccordion';
import LinkCards from '../LinkCards';
import ComparisonTable from '../ComparisonTable';
import { heroActions } from '../ActionLink';
import { localeHref } from '../links';

/**
 * Ordered-sections landing (outsourcing and build-service pages). The page
 * JSON lists its sections in render order, so copy decides the flow:
 *
 *   { header: { eyebrow, title, subtitle, description, cta: [{ label, link }] },
 *     sections: [{ type, id, title, intro, tone, ... }], cta: { title, description, button, link, secondary } }
 *
 * type: overview { content, points, links } | grid { items, columns, variant } |
 *       steps { steps } | checklist { items, columns } |
 *       comparison { columns, rows, highlight, caption } | faq { items } | links { items }
 * Tones alternate default/sunken unless a section sets `tone`.
 */
function Body({ sec, locale }) {
  switch (sec.type) {
    case 'grid':
      return (
        <FeatureGrid
          items={sec.items}
          locale={locale}
          columns={sec.columns || (sec.items?.length === 4 ? 2 : 3)}
          variant={sec.variant || 'card'}
        />
      );
    case 'steps':
      return <Steps steps={sec.steps} />;
    case 'checklist':
      return <CheckList items={sec.items} columns={sec.columns || 1} />;
    case 'comparison':
      return <ComparisonTable columns={sec.columns} rows={sec.rows} highlight={sec.highlight} caption={sec.caption} />;
    case 'faq':
      return <FaqAccordion items={sec.items} />;
    case 'links':
      return <LinkCards items={sec.items} locale={locale} />;
    default:
      return null;
  }
}

export default function SectionsLanding({ data, locale }) {
  const h = data.header || {};
  const cta = data.cta;
  const actions = Array.isArray(h.cta) ? h.cta : h.cta ? [h.cta] : [];
  let band = 0;

  return (
    <>
      <Hero
        eyebrow={h.eyebrow}
        title={h.title}
        lede={h.subtitle}
        meta={Array.isArray(h.meta) ? h.meta : undefined}
        art
        actions={heroActions(actions.map((a) => ({ label: a.label, href: a.link })), locale)}
      >
        {h.description && <p className={s.heroText}>{h.description}</p>}
      </Hero>

      {(data.sections || []).map((sec, i) => {
        const id = sec.id || `section-${i + 1}`;
        if (sec.type === 'overview') {
          return (
            <Overview
              key={id}
              id={id}
              eyebrow={sec.eyebrow}
              title={sec.title}
              content={sec.content}
              points={sec.points}
              links={sec.links}
              locale={locale}
            />
          );
        }
        const tone = sec.tone || (band++ % 2 === 0 ? 'default' : 'sunken');
        return (
          <Section
            key={id}
            id={id}
            eyebrow={sec.eyebrow}
            title={sec.title}
            lede={sec.intro}
            tone={tone}
            width={sec.width || (sec.type === 'checklist' && sec.columns !== 2 ? 'narrow' : 'default')}
          >
            <Body sec={sec} locale={locale} />
          </Section>
        );
      })}

      {cta?.title && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={cta.button && cta.link ? { label: cta.button, href: localeHref(cta.link, locale) } : undefined}
          secondary={
            cta.secondary?.label && cta.secondary?.link
              ? { label: cta.secondary.label, href: localeHref(cta.secondary.link, locale) }
              : undefined
          }
        />
      )}
    </>
  );
}
