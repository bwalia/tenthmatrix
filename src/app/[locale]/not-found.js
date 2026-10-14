import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'errors' });
  return (
    <section className="tm-container tm-error">
      <h1>{t('notFoundTitle')}</h1>
      <p>{t('notFoundBody')}</p>
      <p>
        <Link href={`/${locale}`}>{t('goHome')}</Link>
      </p>
    </section>
  );
}
