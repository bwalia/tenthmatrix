/**
 * Shared configuration for the locale-data translation pipeline.
 *
 * The site's page copy lives in src/app/data/{locale}/*.json. English is the
 * source of truth; every other locale is *generated* from English plus a
 * translation memory (scripts/i18n/dict/{locale}.json) so that:
 *
 *   - editing English copy propagates to all 13 locales on the next build step,
 *   - a locale can never silently drift out of structural sync with English,
 *   - a string that has no translation yet is reported instead of hidden.
 */
export const SOURCE_LOCALE = 'en';
export const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
export const TARGET_LOCALES = LOCALES.filter((l) => l !== SOURCE_LOCALE);

/**
 * Message-catalog paths whose values must stay byte-identical in every locale.
 * The language switcher lists endonyms — "Français" stays "Français" in Thai.
 */
export const FROZEN_MESSAGE_PATHS = new Set(
  LOCALES.map((l) => `language.${l}`)
);

/** Right-to-left locales (used for dir="rtl" on the document). */
export const RTL_LOCALES = new Set(['ar', 'ur']);

/**
 * Data files that are not page copy and must not be regenerated from English.
 * `blogs/` is a directory of fetched CMS posts; articles.json has its own
 * merge path (src/utils/articlesLocale.js) and its own publish tooling.
 */
export const SKIP_FILES = new Set(['articles.json']);

/**
 * JSON keys whose values are identifiers, URLs, assets, colours, dates or
 * other machine-facing data. Translating these breaks routing or rendering.
 */
export const NON_TRANSLATABLE_KEYS = new Set([
  'id', 'uuid', 'uuid_business_id', 'slug', 'code', 'codes', 'key',
  'link', 'href', 'url', 'external', 'canonical', 'website', 'buttonLink',
  'image', 'icon', 'avatar', 'logo', 'src', 'thumbnail', 'cover_image', 'asset',
  'video', 'embedUrl', 'watchUrl', 'source',
  'color', 'theme', 'type', 'card', 'robots', 'locale', 'language', 'language_code',
  'created', 'created_at', 'updated', 'updated_at', 'publish_date', 'published_date',
  'status', 'blog_type', 'step', 'number', 'emoji', 'site', 'creator',
  'email', 'phone', 'siteName', 'publisher', 'author',
]);

/** A value is only worth translating if it contains actual prose. */
export function isTranslatable(key, value) {
  if (typeof value !== 'string') return false;
  if (NON_TRANSLATABLE_KEYS.has(key)) return false;
  const v = value.trim();
  if (!v) return false;
  if (!/[A-Za-z]{2}/.test(v)) return false;          // no Latin letters => nothing to translate
  if (/^https?:\/\//.test(v)) return false;           // URL
  if (/^[./]/.test(v)) return false;                  // path
  if (/^[\w.-]+\.(json|svg|png|jpe?g|webp|gif|mp4|pdf)$/i.test(v)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return false;      // colour
  if (/^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(v)) return false; // email
  if (/^(git|npm|npx|curl|wget|sudo|docker|kubectl|helm|bash|sh|yarn|pnpm)\s/.test(v)) return false; // shell
  // A bare lowercase token is an identifier, never prose: blog tag names that
  // must stay equal to their routing slug (all-meta.json {name,slug}), the
  // promotion-ring names int/test/acc/prod, and config keys documented by name
  // (wsl-proxy "signatures.stage"/"signatures.disable"). Translating any of
  // these silently breaks routing or misdocuments the config.
  if (/^[a-z][a-z0-9_]*$/.test(v)) return false;
  return true;
}

/** Walk every translatable string in a JSON tree, in a stable path order. */
export function walkStrings(node, visit, key = '', path = '') {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkStrings(v, visit, key, `${path}[${i}]`));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      walkStrings(v, visit, k, path ? `${path}.${k}` : k);
    }
  } else if (isTranslatable(key, node)) {
    visit(node, path, key);
  }
}

/** Deep-clone a JSON tree, mapping every translatable string through `fn`. */
export function mapStrings(node, fn, key = '', path = '') {
  if (Array.isArray(node)) return node.map((v, i) => mapStrings(v, fn, key, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = mapStrings(v, fn, k, path ? `${path}.${k}` : k);
    return out;
  }
  if (isTranslatable(key, node)) return fn(node, path, key);
  return node;
}
