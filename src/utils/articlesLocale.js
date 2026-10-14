/**
 * Locale-aware article loading with English merge-by-code fallback.
 * Non-EN articles.json files often exist but are incomplete; this restores catalog parity.
 */

import { loadLocaleData } from './loadLocaleData';

const ARTICLE_LOCALES = [
  'ar', 'bn', 'en', 'es', 'fr', 'hi', 'nl', 'pa', 'pt', 'ru', 'th', 'ur', 'zh',
];

/**
 * Merge locale articles with English by `code`.
 * Locale entries win; EN-only codes are appended in EN order.
 */
export function mergeArticlesWithEnglish(localeData, enData, locale = 'en') {
  const localeContent = Array.isArray(localeData?.data?.content)
    ? localeData.data.content
    : [];
  const enContent = Array.isArray(enData?.data?.content) ? enData.data.content : [];

  if (locale === 'en' || localeContent.length === 0) {
    return {
      ...(enData || localeData || {}),
      data: {
        ...((enData || localeData)?.data || {}),
        content: enContent.length ? enContent : localeContent,
      },
    };
  }

  const byCode = new Map();
  for (const article of localeContent) {
    if (article?.code) byCode.set(article.code, article);
  }

  const merged = [];
  const seen = new Set();

  // Prefer EN order so new publishes appear at the top everywhere
  for (const enArticle of enContent) {
    const code = enArticle?.code;
    if (!code) continue;
    seen.add(code);
    if (byCode.has(code)) {
      merged.push(byCode.get(code));
    } else {
      merged.push({ ...enArticle, language_code: locale });
    }
  }

  // Keep any locale-only extras (translated stubs not in EN)
  for (const article of localeContent) {
    const code = article?.code;
    if (code && !seen.has(code)) {
      merged.push(article);
    }
  }

  return {
    ...localeData,
    data: {
      ...(localeData?.data || {}),
      content: merged,
    },
  };
}

/**
 * Load articles for a locale, merged with English catalog.
 */
export async function loadArticles(locale = 'en') {
  const [localeData, enData] = await Promise.all([
    loadLocaleData('articles.json', locale),
    locale === 'en'
      ? Promise.resolve(null)
      : loadLocaleData('articles.json', 'en'),
  ]);

  if (locale === 'en') {
    return localeData;
  }

  return mergeArticlesWithEnglish(localeData, enData, locale);
}

export function getArticleLocales() {
  return [...ARTICLE_LOCALES];
}
