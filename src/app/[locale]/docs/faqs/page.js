import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocsShell from '@/app/components/docs/DocsShell';
import JsonLd from '@/app/components/seo/JsonLd';
import { TagPill } from '@/app/components';
import { slugify } from '@/lib/articleHtml';
import { loadDocsData } from '../docsData';
import s from '../docs.module.scss';
import { seoAlternates } from '@/lib/seoCanonical';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  const data = await loadDocsData('faqs.json', locale);
  return { title: data?.header?.title || tm('docs.sections.faqs.title'), description: data?.header?.subtitle || tm('docs.sections.faqs.body'), alternates: seoAlternates('/docs/faqs', locale, { selfCanonical: `/${locale}/docs/faqs` }) };
}

export default async function FaqsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await loadDocsData('faqs.json', locale);
  const cats = (data?.categories || []).filter((c) => c?.faqs?.length);

  return (
    <DocsShell locale={locale} current="faqs" title={data?.header?.title || t('docs.sections.faqs.title')} lede={data?.header?.subtitle || t('docs.sections.faqs.body')}>
      {cats.length ? (
        <>
          <ul className={s.faqCats} aria-label={t('docs.faqCategories')}>
            {cats.map((c) => (
              <li key={c.name}>
                <TagPill href={`#${slugify(c.name)}`}>{c.name}</TagPill>
              </li>
            ))}
          </ul>
          {cats.map((c) => (
            <section key={c.name} className={s.faqGroup} aria-labelledby={slugify(c.name)}>
              <h2 id={slugify(c.name)} className={s.faqGroupTitle}>
                {c.name}
              </h2>
              <div className={s.faqList}>
                {c.faqs.map((f) => (
                  <details key={f.question} className={s.faq}>
                    <summary>{f.question}</summary>
                    <p className={s.faqAnswer}>{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: cats.flatMap((c) => c.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))),
            }}
          />
        </>
      ) : (
        <p className="tm-empty">{t('docs.empty')}</p>
      )}
    </DocsShell>
  );
}
