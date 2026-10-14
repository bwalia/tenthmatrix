import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import SearchClient from '@/app/components/search/SearchClient';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'searchPage' });
  return {
    title: t('eyebrow'),
    description: t('subtitle'),
    robots: { index: false, follow: true },
    alternates: { canonical: `/${locale}/search` },
  };
}

// The [locale] layout is force-static, so ?q= is read client-side (SearchClient
// under Suspense) and matched against the live CMS search + the Fuse index.
export default async function SearchPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'searchPage' });
  return (
    <div className="tm-container tm-search-page">
      <header className="tm-listing__head">
        <p className="tm-eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="tm-lede">{t('subtitle')}</p>
      </header>
      <Suspense fallback={null}>
        <SearchClient locale={locale} />
      </Suspense>
    </div>
  );
}
