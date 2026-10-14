/* global process */
import fs from 'fs';
import path from 'path';

const BLOG_LOCALES = [
  'ar', 'bn', 'en', 'es', 'fr', 'hi', 'nl', 'pa', 'pt', 'ru', 'th', 'ur', 'zh',
];

/**
 * Load a blog JSON for a locale.
 * Prefers src/app/data/{locale}/blogs/{slug}.json, falls back to shared EN
 * src/app/data/blogs/{slug}.json.
 */
// A corrupt/half-written committed JSON must not 500 the page (this is the
// fallback path for when the CMS is down) — parse defensively and return null
// so the caller can notFound() cleanly.
function readBlogJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadBlog(slug, locale = 'en') {
  const root = process.cwd();
  const localePath = path.join(root, 'src/app/data', locale, 'blogs', `${slug}.json`);
  const sharedPath = path.join(root, 'src/app/data', 'blogs', `${slug}.json`);

  if (locale !== 'en' && fs.existsSync(localePath)) {
    return readBlogJson(localePath);
  }
  if (fs.existsSync(sharedPath)) {
    return readBlogJson(sharedPath);
  }
  if (fs.existsSync(localePath)) {
    return readBlogJson(localePath);
  }
  return null;
}

export function blogExists(slug) {
  const sharedPath = path.join(process.cwd(), 'src/app/data', 'blogs', `${slug}.json`);
  return fs.existsSync(sharedPath);
}

export function listBlogSlugs() {
  const blogDir = path.join(process.cwd(), 'src/app/data', 'blogs');
  if (!fs.existsSync(blogDir)) return [];
  return fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

/**
 * Overlay title/excerpt/meta from locale blog files onto listing meta entries.
 */
export function localizeBlogMetaList(blogs, locale = 'en') {
  if (!Array.isArray(blogs) || !locale || locale === 'en') return blogs;
  return blogs.map((entry) => {
    const slug = entry?.slug;
    if (!slug) return entry;
    const localized = loadBlog(slug, locale);
    if (!localized) return entry;
    return {
      ...entry,
      title: localized.title || entry.title,
      excerpt: localized.excerpt || entry.excerpt,
      sub_title: localized.sub_title || entry.sub_title,
      meta_title: localized.meta_title || entry.meta_title,
      meta_description: localized.meta_description || entry.meta_description,
    };
  });
}

export { BLOG_LOCALES };
