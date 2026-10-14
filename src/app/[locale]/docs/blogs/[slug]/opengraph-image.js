import { getPostDetail } from '@/lib/cms';
import { renderOgImage, OG_SIZE } from '@/lib/ogImage';
import { STATIC_EXPORT, exportBlogSlugs, localeParams } from '@/lib/staticSlugs';

export const size = OG_SIZE;
export const contentType = 'image/png';
// Prerendered at build time (also required for the S3 static export).
export const dynamic = 'force-static';
export const alt = 'TenthMatrix blog post';
export const revalidate = 3600;

export async function generateStaticParams() {
  // [] on k3s (on-demand ISR); every slug for the S3 static export.
  // Metadata image routes need the full param set (locale and slug).
  if (!STATIC_EXPORT) return [];
  const slugs = exportBlogSlugs();
  return localeParams().flatMap(({ locale }) => slugs.map(({ slug }) => ({ locale, slug })));
}

export default async function Image({ params }) {
  const { slug, locale } = await params;
  const blog = await getPostDetail(slug, locale);
  const en = locale === 'en' ? blog : await getPostDetail(slug, 'en');
  return renderOgImage({ title: blog?.title || 'TenthMatrix blog', fallbackTitle: en?.title, eyebrow: 'Blog' });
}
