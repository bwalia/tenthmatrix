import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadInsight, insightSlugMap } from '@/utils/loadInsight';
import { insightSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { isSample } from '@/utils/text';
import JsonLd from '@/app/components/seo/JsonLd';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(insightSlugMap()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const data = await loadInsight(slug, locale);
  if (!data) return {};
  return {
    title: { absolute: data.meta?.title || data.title },
    description: data.meta?.description,
    keywords: data.meta?.keywords,
    openGraph: {
      title: data.meta?.title || data.title,
      description: data.meta?.description,
      images: data.hero_image ? [{ url: data.hero_image }] : undefined,
      type: 'article',
      publishedTime: data.published_iso,
      modifiedTime: data.updated_iso,
    },
    // Aliases canonicalise to the primary slug.
    alternates: { canonical: `/${locale}/insights/${data.slug}` },
    robots: isSample(slug) ? { index: false, follow: true } : undefined,
  };
}

/** Typed body blocks: h2, h3, p, ul, ol, code, quote. Unknown types are skipped. */
function Block({ block }) {
  switch (block.type) {
    case 'h2':
      return <h2 id={block.id}>{block.text}</h2>;
    case 'h3':
      return <h3 id={block.id}>{block.text}</h3>;
    case 'p':
      return <p>{block.text}</p>;
    case 'ul':
      return <ul>{(block.items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>;
    case 'ol':
      return <ol>{(block.items || []).map((x, i) => <li key={i}>{x}</li>)}</ol>;
    case 'code':
      return (
        <pre>
          <code className={block.lang ? `language-${block.lang}` : undefined}>{block.text}</code>
        </pre>
      );
    case 'quote':
      return <blockquote>{block.text}</blockquote>;
    default:
      return null;
  }
}

export default async function InsightPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await loadInsight(slug, locale);
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: 'insightsPage' });

  return (
    <article className="tm-container tm-article">
      <header className="tm-article__head">
        {data.series ? <p className="tm-eyebrow">{data.series}</p> : null}
        <h1>{data.title}</h1>
        {data.subtitle ? <p className="tm-lede">{data.subtitle}</p> : null}
        <p className="tm-article__meta">
          {data.published_iso ? <time dateTime={data.published_iso}>{data.published}</time> : null}
          {data.reading_time ? ` · ${data.reading_time}` : null}
        </p>
      </header>
      {data.takeaways?.length ? (
        <section className="tm-takeaways" aria-labelledby="tm-takeaways">
          <h2 id="tm-takeaways">{t('takeaways')}</h2>
          <ul>{data.takeaways.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </section>
      ) : null}
      {data.toc?.length ? (
        <nav className="tm-toc" aria-label={t('contents')}>
          <ol>
            {data.toc.map((x) => (
              <li key={x.id}>
                <a href={`#${x.id}`}>{x.label}</a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="tm-prose">
        {(data.body || []).map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
      <JsonLd
        data={[
          insightSchema(data, locale),
          breadcrumbSchema([
            { label: 'Home', path: `/${locale}` },
            { label: 'Insights', path: `/${locale}/insights` },
            { label: data.title },
          ]),
        ]}
      />
    </article>
  );
}
