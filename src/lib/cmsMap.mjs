/**
 * Shared mappers: OPSAPI CMS post -> the blog shapes the site renders.
 * Plain ESM (no framework imports) so both scripts/fetchBlogs.mjs (build time)
 * and src/lib/cms.js (request time, ISR) can use it.
 */

// lua-cjson can encode an empty list as `{}` (object) rather than `[]`, so guard
// every list before .map — otherwise a tag-less post would throw.
const asArray = (v) => (Array.isArray(v) ? v : []);

/** Full post -> blog document shape (detail pages, generateMetadata). */
export function mapCmsPost(post) {
  // Guard the lua-cjson "200 with data:{}" case too: an empty object is truthy,
  // so without the slug check a missing post would map to a blank, titleless
  // article instead of falling through to a clean 404.
  if (!post || !post.slug) return null;
  const author = (post.author_name || '').trim();
  const [firstName, ...restName] = author ? author.split(/\s+/) : [];
  return {
    uuid: post.uuid,
    id: post.uuid,
    internal_id: post.uuid,
    slug: post.slug,
    title: post.title,
    sub_title: '',
    excerpt: post.excerpt || '',
    content: post.content_html || '',
    images: post.featured_image_url ? [{ url: post.featured_image_url, is_cover: true }] : [],
    tags: asArray(post.tags).map((t) => ({ name: t.name, slug: t.slug, uuid: t.uuid })),
    categories: asArray(post.categories).map((c) => ({ name: c.name, slug: c.slug, uuid: c.uuid })),
    meta_title: post.seo_title || post.title || '',
    meta_description: post.seo_description || post.excerpt || '',
    meta_keywords: post.seo_keywords || '',
    published_date: post.published_at || null,
    created_at: post.published_at || null,
    updated_at: post.published_at || null,
    status: 'published',
    reading_minutes: post.reading_minutes || 0,
    user: author
      ? { first_name: firstName || author, last_name: restName.join(' '), name: author, avatar: null }
      : null,
  };
}

/** List summary -> blog listing-metadata shape (list/pagination/tag pages). */
export function mapCmsSummary(post) {
  if (!post) return null;
  const author = (post.author_name || '').trim();
  return {
    uuid: post.uuid,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    published_date: post.published_at || null,
    tags: asArray(post.tags).map((t) => ({ name: t.name, slug: t.slug })),
    cover_image: post.featured_image_url || null,
    reading_minutes: post.reading_minutes || 0,
    is_featured: post.is_featured || false,
    user: author ? { name: author, avatar: null } : null,
  };
}
