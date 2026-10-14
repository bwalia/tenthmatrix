'use client';

import { useTranslations } from 'next-intl';

export default function Error({ reset }) {
  const t = useTranslations('errors');
  return (
    <section className="tm-container tm-error">
      <h1>{t('somethingWrong')}</h1>
      <button type="button" className="tm-button tm-tap" onClick={() => reset()}>
        {t('tryAgain')}
      </button>
    </section>
  );
}
