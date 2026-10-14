import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadArticles } from '@/utils/articlesLocale';
import { articleCard } from '@/lib/contentView';
import { ArticleCard, Eyebrow } from '@/app/components';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return { title: tm('articlesPage.title'), description: tm('articlesPage.subtitle'), alternates: { canonical: `/${locale}/articles` } };
}

export default async function ArticlesPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const articles = await loadArticles(locale);
  const items = (articles?.data?.content || [])
    .filter((a) => a?.code)
    .map((a) => articleCard(a, locale, t))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const [featured, ...rest] = items;

  return (
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Eyebrow>{t('articlesPage.eyebrow')}</Eyebrow>
          <h1>{t('articlesPage.title')}</h1>
          <p className="tm-lede">{t('articlesPage.subtitle')}</p>
          <p className="tm-eyebrow">{t('articlesPage.count', { count: items.length })}</p>
        </div>
      </header>
      <div className="tm-page-body">
        {items.length ? (
          <>
            {featured && rest.length > 2 ? (
              <div style={{ marginBottom: 'var(--tm-grid-gap)' }}>
                <ArticleCard {...featured} locale={locale} headingLevel="h2" variant="feature" />
              </div>
            ) : null}
            <ul className="tm-grid">
              {(rest.length > 2 ? rest : items).map((a) => (
                <li key={a.href}>
                  <ArticleCard {...a} locale={locale} headingLevel="h2" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="tm-empty">{t('articlesPage.empty')}</p>
        )}
      </div>
    </>
  );
}
