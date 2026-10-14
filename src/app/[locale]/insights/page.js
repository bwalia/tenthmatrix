import { setRequestLocale } from 'next-intl/server';
import { loadLocaleData } from '@/utils/loadLocaleData';
import { listInsights } from '@/utils/loadInsight';
import PostCard from '@/app/components/blog/PostCard';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadLocaleData('insights/index.json', locale);
  return {
    title: { absolute: data.meta.title },
    description: data.meta.description,
    keywords: data.meta.keywords,
    alternates: { canonical: `/${locale}/insights` },
  };
}

export default async function InsightsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await loadLocaleData('insights/index.json', locale);
  const items = await listInsights(locale);
  return (
    <div className="tm-container tm-listing">
      <header className="tm-listing__head">
        <p className="tm-eyebrow">{data.eyebrow}</p>
        <h1>{data.title}</h1>
        <p className="tm-lede">{data.lede}</p>
      </header>
      <ul className="tm-post-list">
        {items.map((a) => (
          <li key={a.slug}>
            <PostCard
              locale={locale}
              href={`/${locale}/insights/${a.slug}`}
              post={{
                slug: a.slug,
                title: a.title,
                excerpt: a.subtitle,
                cover_image: a.hero_image,
                published_date: a.published_iso,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
