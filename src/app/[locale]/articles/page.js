import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadArticles } from '@/utils/articlesLocale';
import { stripHtml, truncate } from '@/utils/text';
import PostCard from '@/app/components/blog/PostCard';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'articlesPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: `/${locale}/articles` } };
}

export default async function ArticlesPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'articlesPage' });
  const articles = await loadArticles(locale);
  const items = (articles?.data?.content || []).map((a) => ({
    slug: a.code,
    title: a.title,
    excerpt: truncate(stripHtml(a.sub_title || a.content || '')),
    cover_image: a.image,
    published_date: a.publish_date ? new Date(Number(a.publish_date) * 1000).toISOString() : null,
  }));

  return (
    <div className="tm-container tm-listing">
      <header className="tm-listing__head">
        <p className="tm-eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="tm-lede">{t('subtitle')}</p>
      </header>
      {items.length ? (
        <ul className="tm-post-list">
          {items.map((a) => (
            <li key={a.slug}>
              <PostCard post={a} locale={locale} href={`/${locale}/articles/${a.slug}`} />
            </li>
          ))}
        </ul>
      ) : (
        <p>{t('empty')}</p>
      )}
    </div>
  );
}
