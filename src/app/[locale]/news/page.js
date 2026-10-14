import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import Timeline from '@/app/components/sections/Timeline';
import { localeHref } from '@/app/components/sections/links';

export const dynamic = 'force-static';

function News({ data, locale }) {
  const c = data.content || {};
  return (
    <>
      <Hero title={data.hero?.title} lede={data.hero?.description} art={false} />
      <Section id="news" width="narrow">
        <Timeline items={c.articles} headingLevel={2} />
      </Section>
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

const route = createRoute({ file: 'news.json', route: '/news', Template: News });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
