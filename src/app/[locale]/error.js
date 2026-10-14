'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ErrorState from '@/app/components/feedback/ErrorState';
import { Button } from '@/app/components';

export default function Error({ error, reset }) {
  const t = useTranslations('errors');
  const locale = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      variant="error"
      eyebrow={t('errorEyebrow')}
      title={t('somethingWrong')}
      body={t('errorBody')}
      actions={
        <>
          <Button onClick={() => reset()}>{t('tryAgain')}</Button>
          <Button href={`/${locale}/articles`} variant="secondary">
            {t('browseArticles')}
          </Button>
        </>
      }
    />
  );
}
