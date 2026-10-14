import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookOpen } from 'lucide-react';
import { Card, Eyebrow } from '@/app/components';
import { DOCS_NAV } from '@/app/components/docs/DocsShell';
import SearchBox from '@/app/components/search/SearchBox';
import s from './docs.module.scss';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return { title: tm('docs.title'), description: tm('docs.lede'), alternates: { canonical: `/${locale}/docs` } };
}

export default async function DocsHub({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Eyebrow>{t('docs.eyebrow')}</Eyebrow>
          <h1>{t('docs.title')}</h1>
          <p className="tm-lede">{t('docs.lede')}</p>
          <div className={s.search}>
            <SearchBox locale={locale} />
          </div>
        </div>
      </header>
      <div className="tm-page-body">
        <ul className="tm-grid">
          {DOCS_NAV.map(({ key, href, icon: Icon }) => (
            <li key={key}>
              <Card href={`/${locale}${href}`} className={s.card}>
                <span className={s.icon} aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <h2 className={s.cardTitle}>{t(`docs.sections.${key}.title`)}</h2>
                <p className={s.cardBody}>{t(`docs.sections.${key}.body`)}</p>
                <span className={s.more}>{t(`docs.sections.${key}.cta`)} →</span>
              </Card>
            </li>
          ))}
          <li>
            <Card href={`/${locale}/articles`} className={s.card} tone="accent">
              <span className={s.icon} aria-hidden="true">
                <BookOpen size={22} strokeWidth={1.75} />
              </span>
              <h2 className={s.cardTitle}>{t('docs.articlesTitle')}</h2>
              <p className={s.cardBody}>{t('docs.articlesBody')}</p>
              <span className={s.more}>{t('docs.articlesCta')} →</span>
            </Card>
          </li>
        </ul>
      </div>
    </>
  );
}
