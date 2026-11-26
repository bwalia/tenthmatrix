import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import { localeHref } from '@/app/components/sections/links';
import s from '@/app/components/glossary/glossary.module.scss';

export const dynamic = 'force-static';

/**
 * Glossary (Resources): every technical term on the site in plain English.
 * Each term has an anchor (#id) that <Term> tooltips link to.
 */
function Glossary({ data, locale }) {
  const h = data.header;
  const terms = data.terms || [];
  return (
    <>
      <Hero eyebrow={h.eyebrow} title={h.title} lede={h.subtitle} art />
      <Section id="terms" width="narrow">
        <nav aria-label={data.ui.jump}>
          <ul className={s.jump}>
            {terms.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.term}</a>
              </li>
            ))}
          </ul>
        </nav>
        <dl className={s.list}>
          {terms.map((t) => (
            <div key={t.id} id={t.id} className={s.item}>
              <dt className={s.term}>{t.term}</dt>
              <dd className={s.plain}>{t.plain}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <CTA
        id="cta"
        title={data.cta.title}
        body={data.cta.description}
        primary={{ label: data.cta.button, href: localeHref(data.cta.link, locale) }}
        secondary={{ label: data.cta.secondary.label, href: localeHref(data.cta.secondary.link, locale) }}
      />
    </>
  );
}

const route = createRoute({ file: 'glossary.json', route: '/glossary', Template: Glossary });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
