import { getTranslations, getLocale } from 'next-intl/server';
import ErrorState from '@/app/components/feedback/ErrorState';
import SearchBox from '@/app/components/search/SearchBox';
import { Button } from '@/app/components';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'errors' });
  return (
    <ErrorState
      code="404"
      eyebrow={t('notFoundEyebrow')}
      title={t('notFoundTitle')}
      body={t('notFoundBody')}
      actions={
        <>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <SearchBox locale={locale} id="tm-404-search" />
          </div>
          <Button href={`/${locale}`} variant="primary">
            {t('goHome')}
          </Button>
          <Button href={`/${locale}/articles`} variant="secondary">
            {t('browseArticles')}
          </Button>
        </>
      }
    />
  );
}
