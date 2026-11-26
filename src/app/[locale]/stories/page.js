import { permanentRedirect } from 'next/navigation';
import { locales } from '@/utils/getMessages';

// Customer stories became Our work (/our-work), now in the main menu. Keeps old
// links working: a 308 on k3s, a meta-refresh page in the S3 static export.
export const dynamic = 'force-static';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function StoriesRedirect({ params }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/our-work`);
}
