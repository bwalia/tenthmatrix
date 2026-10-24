import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMessages, isValidLocale, locales } from '@/utils/getMessages';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';
import CookieConsent from '../components/layout/CookieConsent';
import ChatDock from '../components/chat/ChatDock';
import JsonLd from '../components/seo/JsonLd';
import Document from '../Document';
import { organizationSchema, websiteSchema } from '../utils/schemaMarkup';

// Same model as Workstation: every locale is prerendered; routes that need
// fresh data opt into ISR with `revalidate`.
export const dynamic = 'force-static';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    other: { 'content-language': locale },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <Document lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <a className="tm-skip-link" href="#main">
          {t('skipToContent')}
        </a>
        <SiteHeader locale={locale} />
        <main id="main" className="tm-main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} />
        <CookieConsent locale={locale} />
        <ChatDock />
        <JsonLd data={[organizationSchema(), websiteSchema(locale)]} />
      </NextIntlClientProvider>
    </Document>
  );
}
