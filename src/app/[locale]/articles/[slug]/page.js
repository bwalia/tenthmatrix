import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadArticles } from '@/utils/articlesLocale';
import { articleSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { catToTagSlug } from '@/app/utils/blogTags';
import { readTime, isSample } from '@/utils/text';
import JsonLd from '@/app/components/seo/JsonLd';
import Prose from '@/app/components/blog/Prose';

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

  const date = a.publish_date ? new Date(Number(a.publish_date) * 1000) : null;
  const related = content.filter((x) => x.industry === a.industry && x.code !== a.code).slice(0, 3);

  return (
    <article className="tm-container tm-article">
      <nav aria-label={t('common.breadcrumb')} className="tm-breadcrumb">
        <Link href={`/${locale}`}>{t('common.home')}</Link> /{' '}
        <Link href={`/${locale}/articles`}>{t('articlesPage.title')}</Link>
      </nav>
      <header className="tm-article__head">
        {a.cats?.length ? (
          <ul className="tm-tags">
            {a.cats.map((c) => {
              const tag = catToTagSlug(c.cat_name);
              return (
                <li key={c.cat_name}>
                  {tag ? <Link href={`/${locale}/docs/blogs/tag/${tag}`}>{c.cat_name}</Link> : c.cat_name}
                </li>
              );
            })}
          </ul>
        ) : null}
        <h1>{a.title}</h1>
        {a.sub_title ? <p className="tm-lede">{a.sub_title}</p> : null}
        <p className="tm-article__meta">
          {date ? (
            <time dateTime={date.toISOString()}>
              {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)}
            </time>
          ) : null}
          {' · '}
          {t('common.minRead', { minutes: readTime(a.content) })}
        </p>
      </header>
      <Prose html={a.content} />
      {related.length ? (
        <aside className="tm-related">
          <h2>{t('nav.articles')}</h2>
          <ul>
            {related.map((r) => (
              <li key={r.code}>
                <Link href={`/${locale}/articles/${r.code}`}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
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
    </article>
  );
}
