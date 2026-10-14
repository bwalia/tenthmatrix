import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import FaqAccordion from '@/app/components/sections/FaqAccordion';
import { localeHref } from '@/app/components/sections/links';

export const dynamic = 'force-static';

const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Faq({ data, locale }) {
  const c = data.content || {};
  const cats = c.categories || [];
  return (
    <>
      <Hero title={data.hero?.title} lede={data.hero?.description} art={false} />
      {cats.map((cat, i) => (
        <Section key={cat.name} id={slug(cat.name)} title={cat.name} tone={i % 2 ? 'sunken' : 'default'} width="narrow">
          <FaqAccordion items={cat.questions} />
        </Section>
      ))}
      {c.cta?.title && (
        <CTA
          id="cta"
          title={c.cta.title}
          body={c.cta.description}
          primary={c.cta.buttonText ? { label: c.cta.buttonText, href: localeHref(c.cta.buttonLink || '/contact-us', locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'faq.json', route: '/faq', Template: Faq });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
