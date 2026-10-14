import { getPostDetail } from '@/lib/cms';
import { renderOgImage, OG_SIZE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'TenthMatrix blog post';
export const revalidate = 3600;

export default async function Image({ params }) {
  const { slug, locale } = await params;
  const blog = await getPostDetail(slug, locale);
  return renderOgImage({ title: blog?.title || 'TenthMatrix blog', eyebrow: 'Blog' });
}
