import { getTranslations } from 'next-intl/server';
import { renderOgImage, OG_SIZE } from '@/lib/ogImage';
import { localeParams } from '@/lib/staticSlugs';

export const size = OG_SIZE;
export const contentType = 'image/png';
// Prerendered at build time (also required for the S3 static export).
export const dynamic = 'force-static';
export const alt = 'TenthMatrix';

export function generateStaticParams() {
  return localeParams();
}

export default async function Image({ params }) {
  const { locale } = await params;
  const title = (await getTranslations({ locale }))('home.meta.title');
  const fallbackTitle = locale === 'en' ? title : (await getTranslations({ locale: 'en' }))('home.meta.title');
  return renderOgImage({ title, fallbackTitle, eyebrow: 'AI agents · Generative AI' });
}
