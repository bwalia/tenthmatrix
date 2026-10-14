import { loadArticles } from '@/utils/articlesLocale';
import { renderOgImage, OG_SIZE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'TenthMatrix technical article';

export async function generateStaticParams() {
  const articles = await loadArticles('en');
  return (articles?.data?.content || []).filter((a) => a?.code).map((a) => ({ slug: a.code }));
}

export default async function Image({ params }) {
  const { slug, locale } = await params;
  const articles = await loadArticles(locale);
  const a = (articles?.data?.content || []).find((x) => x.code === slug);
  return renderOgImage({ title: a?.title || 'TenthMatrix article', eyebrow: 'Technical article' });
}
