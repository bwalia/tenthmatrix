import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './utils/getMessages';

// next-intl v4: the [locale] segment arrives as `requestLocale`; an explicit
// `locale` (getTranslations({ locale })) wins when given.
export default getRequestConfig(async ({ requestLocale, locale: explicit }) => {
  let locale = explicit || (await requestLocale);
  if (!locale || !locales.includes(locale)) locale = defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
