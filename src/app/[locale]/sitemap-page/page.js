import { Hero, Section } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import SitemapTree from '@/app/components/sections/SitemapTree';
import ActionLink from '@/app/components/sections/ActionLink';
import s from '@/app/components/sections/templates/Templates.module.scss';

export const dynamic = 'force-static';

function SitemapPage({ data, locale }) {
  const h = data.header || {};
  return (
    <>
      <Hero eyebrow={h.title} title={h.subtitle || h.title} lede={h.description} art={false} />
      <Section id="tree">
        <SitemapTree tree={data.tree} locale={locale} />
      </Section>
      {h.xmlTitle && (
        <Section id="xml" spacing="compact">
          <div className={s.hardware}>
            <div>
              <h2>{h.xmlTitle}</h2>
              <p>{h.xmlDescription}</p>
            </div>
            <ActionLink href="/sitemap.xml" locale={locale} variant="secondary">
              {h.xmlButton}
            </ActionLink>
          </div>
        </Section>
      )}
    </>
  );
}

const route = createRoute({
  file: 'sitemap-pages.json',
  route: '/sitemap-page',
  Template: SitemapPage,
  meta: (d) => ({ title: d.header?.title, description: d.header?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
