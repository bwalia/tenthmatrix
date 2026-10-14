import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import SearchClient from '@/app/components/search/SearchClient';
import { Eyebrow } from '@/app/components';

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
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h1>{t('title')}</h1>
          <p className="tm-lede">{t('subtitle')}</p>
        </div>
      </header>
      <div className="tm-page-body">
        <Suspense fallback={null}>
          <SearchClient locale={locale} suggestions={t.raw('suggestions')} />
        </Suspense>
      </div>
    </>
  );
}
