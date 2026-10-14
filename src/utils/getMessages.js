// Locale list + message loading, shared by src/i18n.js, src/proxy.js and the
// [locale] layout. Keep in sync with scripts/i18n/config.mjs (verify:i18n
// checks every catalog exists).
const locales = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const defaultLocale = 'en';
const rtlLocales = ['ar', 'ur'];

export async function getMessages(locale) {
  const validLocale = locales.includes(locale) ? locale : defaultLocale;
  try {
    return (await import(`../messages/${validLocale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${validLocale}:`, error);
    return (await import('../messages/en.json')).default;
  }
}

export function isValidLocale(locale) {
  return locales.includes(locale);
}

export function isRtl(locale) {
  return rtlLocales.includes(locale);
}

export { locales, defaultLocale, rtlLocales };
