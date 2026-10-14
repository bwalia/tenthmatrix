// View-model helpers shared by listing and detail pages: turn data-layer
// records (blog meta/detail, articles.json items, insights) into the props the
// design-system cards and ArticleLayout expect. No I/O here.
import { prettifyTag } from '@/app/utils/blogTags';
import { stripHtml, truncate, isSample } from '@/utils/text';

const tagSlug = (t) => t?.slug || String(t?.name || t || '').toLowerCase().trim().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');

/** [{label, href}] for blog tag pills. */
export function blogTagLinks(tags = [], locale) {
  return (Array.isArray(tags) ? tags : [])
    .map((t) => (typeof t === 'string' ? { slug: tagSlug(t), name: t } : { slug: tagSlug(t), name: t?.name }))
    .filter((t) => t.slug)
    .map((t) => ({ label: t.name ? prettifyTag(tagSlug(t)) : prettifyTag(t.slug), href: `/${locale}/docs/blogs/tag/${t.slug}` }));
}

const tagLabels = (tags = []) =>
  (Array.isArray(tags) ? tags : []).map((t) => prettifyTag(tagSlug(typeof t === 'string' ? { name: t } : t))).filter(Boolean);

/** Display name for a blog author; CMS placeholder accounts are hidden. */
export function blogAuthor(user) {
  if (!user) return null;
  const name = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ');
  if (!name || /super user|admin|administrator/i.test(name)) return null;
  return name;
}

export function blogCover(blog) {
  if (!blog) return null;
  if (blog.cover_image) return blog.cover_image;
  const imgs = Array.isArray(blog.images) ? blog.images : [];
  return (imgs.find((i) => i?.is_cover) || imgs[0])?.url || null;
}

/** articles.json publish_date is unix seconds (string). */
export function articleDate(a) {
  const n = Number(a?.publish_date);
  if (Number.isFinite(n) && n > 0) return new Date(n * 1000).toISOString();
  return a?.published_date || null;
}

export function blogCard(b, locale, t) {
  return {
    title: b.title,
    href: `/${locale}/docs/blogs/${b.slug}`,
    excerpt: b.excerpt,
    date: b.published_date,
    image: blogCover(b),
    kind: t('kinds.blog'),
    readingTime: b.reading_minutes ? t('common.minRead', { minutes: b.reading_minutes }) : undefined,
    tags: tagLabels(b.tags),
    badge: isSample(b.slug) ? t('common.sample') : undefined,
  };
}

export function articleCard(a, locale, t) {
  return {
    title: a.title,
    href: `/${locale}/articles/${a.code}`,
    excerpt: truncate(stripHtml(a.sub_title || a.meta_description || a.content || ''), 170),
    date: articleDate(a),
    image: a.image || undefined,
    kind: t('kinds.article'),
    tags: (a.cats || []).map((c) => c.cat_name).filter(Boolean),
    badge: isSample(a.code) ? t('common.sample') : undefined,
  };
}

export function insightCard(i, locale, t) {
  return {
    title: i.title,
    href: `/${locale}/insights/${i.slug}`,
    excerpt: i.subtitle,
    date: i.published_iso,
    image: i.hero_image || undefined,
    kind: i.series || t('kinds.insight'),
    readingTime: i.reading_time || undefined,
    badge: isSample(i.slug) ? t('common.sample') : undefined,
  };
}
