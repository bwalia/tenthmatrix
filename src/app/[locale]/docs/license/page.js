import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocsShell from '@/app/components/docs/DocsShell';
import { slugify } from '@/lib/articleHtml';
import { loadDocsData } from '../docsData';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadDocsData('license.json', locale);
  const tm = await getTranslations({ locale });
  return { title: data?.title || tm('docs.sections.license.title'), description: tm('docs.sections.license.body'), alternates: { canonical: `/${locale}/docs/license` } };
}

export default async function LicensePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await loadDocsData('license.json', locale);
  return (
    <DocsShell locale={locale} current="license" title={data?.title || t('docs.sections.license.title')} lede={data?.lastUpdated}>
      {data?.blocks?.length ? (
        <div className="tm-prose">
          {data.blocks.map((b, i) => {
            if (b.type === 'section') return <h2 key={i} id={slugify(b.text)}>{b.text}</h2>;
            if (b.type === 'list') return <ul key={i}>{(b.items || []).map((x, j) => <li key={j}>{x}</li>)}</ul>;
            return <p key={i}>{b.text}</p>;
          })}
        </div>
      ) : (
        <p className="tm-empty">{t('docs.empty')}</p>
      )}
    </DocsShell>
  );
}
