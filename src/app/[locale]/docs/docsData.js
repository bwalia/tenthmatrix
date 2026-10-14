import { loadLocaleData } from '@/utils/loadLocaleData';

/** Docs page data with a null fallback, so a missing file renders an empty state instead of failing the build. */
export async function loadDocsData(file, locale) {
  try {
    return await loadLocaleData(file, locale);
  } catch {
    return null;
  }
}
