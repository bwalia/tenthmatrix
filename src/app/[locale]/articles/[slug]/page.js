import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadArticles } from '@/utils/articlesLocale';
import { articleSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { catToTagSlug } from '@/app/utils/blogTags';
import { isSample } from '@/utils/text';
import { articleCard, articleDate } from '@/lib/contentView';
import JsonLd from '@/app/components/seo/JsonLd';
import ArticleLayout from '@/app/components/article/ArticleLayout';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  // Same slug set in every locale (the EN catalogue is the source of truth).
  const articles = await loadArticles('en');
  return (articles?.data?.content || []).filter((a) => a?.code).map((a) => ({ slug: a.code }));
}

async function getArticle(slug, locale) {
  const articles = await loadArticles(locale);
  const content = articles?.data?.content || [];
  return { article: content.find((a) => a.code === slug) || null, content };
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const { article: a } = await getArticle(slug, locale);
  if (!a) return { title: 'Article' };
  const title = a.meta_title || a.title;
  const description = a.meta_description || a.sub_title;
  return {
    title: { absolute: title },
    description,
    keywords: a.meta_keywords || undefined,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `/${locale}/articles/${slug}` },
    robots: isSample(slug) ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlePage({ params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const { article: a, content } = await getArticle(slug, locale);
  if (!a) notFound();

  const sameIndustry = content.filter((x) => x.code !== a.code && a.industry && x.industry === a.industry);
  const related = (sameIndustry.length >= 3 ? sameIndustry : [...sameIndustry, ...content.filter((x) => x.code !== a.code && !sameIndustry.includes(x))])
    .slice(0, 3)
    .map((x) => articleCard(x, locale, t));
  const tags = (a.cats || [])
    .filter((c) => c?.cat_name)
    .map((c) => {
      const tag = catToTagSlug(c.cat_name);
      return { label: c.cat_name, href: tag ? `/${locale}/docs/blogs/tag/${tag}` : undefined };
    });

  return (
    <>
      <ArticleLayout
        locale={locale}
        path={`/${locale}/articles/${slug}`}
        breadcrumbs={[
          { label: t('common.home'), href: `/${locale}` },
          { label: t('articlesPage.title'), href: `/${locale}/articles` },
          { label: a.title },
        ]}
        eyebrow={t('kinds.article')}
        tags={tags}
        title={a.title}
        lede={a.sub_title}
        date={articleDate(a)}
        image={a.image}
        html={a.content}
        related={{ title: t('article.moreArticles'), items: related }}
      />
      <JsonLd
        data={[
          articleSchema(a, locale),
          breadcrumbSchema([
            { label: 'Home', path: `/${locale}` },
            { label: 'Articles', path: `/${locale}/articles` },
            { label: a.title },
          ]),
        ]}
      />
    </>
  );
}
