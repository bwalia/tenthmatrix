import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadInsight, insightSlugMap, listInsights } from '@/utils/loadInsight';
import { insightSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { isSample } from '@/utils/text';
import { insightCard } from '@/lib/contentView';
import JsonLd from '@/app/components/seo/JsonLd';
import ArticleLayout from '@/app/components/article/ArticleLayout';
import InsightBody from '@/app/components/insights/InsightBody';
import { Takeaways, InsightFooter } from '@/app/components/insights/InsightExtras';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(insightSlugMap()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const data = await loadInsight(slug, locale);
  if (!data) return {};
  return {
    title: { absolute: data.meta?.title || data.title },
    description: data.meta?.description,
    keywords: data.meta?.keywords,
    openGraph: {
      title: data.meta?.title || data.title,
      description: data.meta?.description,
      images: data.hero_image ? [{ url: data.hero_image }] : undefined,
      type: 'article',
      publishedTime: data.published_iso,
      modifiedTime: data.updated_iso,
    },
    // Aliases canonicalise to the primary slug.
    alternates: { canonical: `/${locale}/insights/${data.slug}` },
    robots: isSample(slug) ? { index: false, follow: true } : undefined,
  };
}

export default async function InsightPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await loadInsight(slug, locale);
  if (!data) notFound();
  const t = await getTranslations({ locale });

  // Outline: the file's toc, else every h2/h3 block with an id.
  const headings = (data.toc || []).filter((x) => x?.id).map((x) => ({ id: x.id, text: x.label, level: 2 }));
  const fallback = (data.body || []).filter((b) => (b.type === 'h2' || b.type === 'h3') && b.id).map((b) => ({ id: b.id, text: b.text, level: b.type === 'h3' ? 3 : 2 }));
  const all = await listInsights(locale);
  const more = all.filter((x) => x.slug !== data.slug).slice(0, 3).map((x) => insightCard(x, locale, t));

  return (
    <>
      <ArticleLayout
        locale={locale}
        path={`/${locale}/insights/${data.slug}`}
        breadcrumbs={[
          { label: t('common.home'), href: `/${locale}` },
          { label: t('nav.items.insights.label'), href: `/${locale}/insights` },
          { label: data.title },
        ]}
        eyebrow={data.series || t('kinds.insight')}
        title={data.title}
        lede={data.subtitle}
        date={data.published_iso}
        updated={data.updated_iso}
        readingLabel={data.reading_time}
        image={data.hero_image}
        headings={headings.length ? headings : fallback}
        before={<Takeaways title={t('insightsPage.takeaways')} items={data.takeaways} />}
        after={
          <InsightFooter
            locale={locale}
            labels={{ faqs: t('insightsPage.faqs'), sources: t('insightsPage.sources'), related: t('insightsPage.related') }}
            sources={data.sources}
            faqs={data.faqs}
            related={data.related}
          />
        }
        related={{ title: t('insightsPage.more'), items: more }}
      >
        <InsightBody blocks={data.body} />
      </ArticleLayout>
      <JsonLd
        data={[
          insightSchema(data, locale),
          breadcrumbSchema([
            { label: 'Home', path: `/${locale}` },
            { label: 'Insights', path: `/${locale}/insights` },
            { label: data.title },
          ]),
        ]}
      />
    </>
  );
}
