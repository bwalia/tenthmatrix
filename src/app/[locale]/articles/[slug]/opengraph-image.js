import { loadArticles } from '@/utils/articlesLocale';
import { renderOgImage, OG_SIZE } from '@/lib/ogImage';
import { localeParams } from '@/lib/staticSlugs';

export const size = OG_SIZE;
export const contentType = 'image/png';
// Prerendered at build time (also required for the S3 static export).
export const dynamic = 'force-static';
export const alt = 'TenthMatrix technical article';

// Metadata image routes need the full param set (locale and slug).
export async function generateStaticParams() {
  const articles = await loadArticles('en');
  const slugs = (articles?.data?.content || []).filter((a) => a?.code).map((a) => a.code);
  return localeParams().flatMap(({ locale }) => slugs.map((slug) => ({ locale, slug })));
}

export default async function Image({ params }) {
  const { slug, locale } = await params;
  const articles = await loadArticles(locale);
  const a = (articles?.data?.content || []).find((x) => x.code === slug);
  const enList = locale === 'en' ? articles : await loadArticles('en');
  const en = (enList?.data?.content || []).find((x) => x.code === slug);
  return renderOgImage({ title: a?.title || 'TenthMatrix article', fallbackTitle: en?.title, eyebrow: 'Technical article' });
}
