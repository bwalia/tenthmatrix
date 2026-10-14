import { ogImage } from '@/app/components/sections/og';
import { localeParams } from '@/lib/staticSlugs';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Prerendered at build time (also required for the S3 static export).
export const dynamic = 'force-static';

export function generateStaticParams() {
  return localeParams();
}
export const alt = 'TenthMatrix';

export default ogImage('products.json', 'TenthMatrix · Products');
