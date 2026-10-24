import { permanentRedirect } from 'next/navigation';
import { locales } from '@/utils/getMessages';

// WSL Proxy is now Proxy10x (/proxy10x). Keeps old links and bookmarks working:
// a 308 on k3s, a meta-refresh page in the S3 static export.
export const dynamic = 'force-static';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function WslProxyRedirect({ params }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/proxy10x`);
}
