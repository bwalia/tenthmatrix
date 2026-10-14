/**
 * JSON-LD builders (schema.org). Render with <JsonLd data={…} />.
 * Every page carries Organization + WebSite (from the [locale] layout);
 * blog posts add BlogPosting, articles Article, insights TechArticle, and all
 * detail pages a BreadcrumbList.
 *
 * Detail pages still copied from Workstation point mainEntityOfPage / url at
 * the Workstation original (src/lib/seoCanonical.js), matching their canonical.
 */
import { workstationCanonical } from '@/lib/seoCanonical';

export const BASE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');
// TODO(brand): point at the final raster logo once public/brand/ lands.
const LOGO_URL = `${BASE_URL}/brand/icon-512.png`;

/** Canonical page URL for JSON-LD: Workstation's for copied pages, else ours. */
const pageUrl = (route, locale) => workstationCanonical(route, locale) || `${BASE_URL}/${locale}${route}`;

const abs = (p) => (!p ? undefined : /^https?:\/\//.test(p) ? p : `${BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`);

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'TenthMatrix',
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
    email: 'hello@tenthmatrix.com',
    description:
      'TenthMatrix builds AI agents, AI tools, AI applications and software products.',
    sameAs: [],
  };
}

export function websiteSchema(locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'TenthMatrix',
    url: BASE_URL,
    inLanguage: locale,
    publisher: { '@id': `${BASE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/${locale}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

const publisher = () => ({
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'TenthMatrix',
  logo: { '@type': 'ImageObject', url: LOGO_URL },
});

export function blogPostingSchema(blog, locale) {
  const coverImage =
    blog.images?.find((i) => i?.is_cover && i?.url)?.url ||
    blog.images?.find((i) => i?.url)?.url ||
    blog.cover_image;
  const author =
    blog.user?.name ||
    (blog.user ? `${blog.user.first_name || ''} ${blog.user.last_name || ''}`.trim() : '') ||
    'TenthMatrix';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || blog.meta_description || '',
    image: abs(coverImage),
    author: { '@type': author === 'TenthMatrix' ? 'Organization' : 'Person', name: author },
    publisher: publisher(),
    datePublished: blog.published_date || blog.created_at || undefined,
    dateModified: blog.updated_at || blog.published_date || undefined,
    inLanguage: locale,
    url: pageUrl(`/docs/blogs/${blog.slug}`, locale),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl(`/docs/blogs/${blog.slug}`, locale) },
    keywords: (blog.tags || []).map((t) => t.name).filter(Boolean).join(', '),
  };
}

export function articleSchema(article, locale) {
  const datePublished = article.publish_date
    ? new Date(Number(article.publish_date) * 1000).toISOString()
    : article.created || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description || article.sub_title || '',
    image: abs(article.image),
    author: { '@type': 'Organization', name: 'TenthMatrix' },
    publisher: publisher(),
    datePublished,
    inLanguage: locale,
    url: pageUrl(`/articles/${article.code}`, locale),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl(`/articles/${article.code}`, locale) },
    articleSection: article.industry || '',
    keywords: article.meta_keywords || '',
  };
}

export function insightSchema(insight, locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: insight.title,
    description: insight.meta?.description || insight.subtitle || '',
    image: abs(insight.hero_image),
    author: { '@type': 'Organization', name: 'TenthMatrix' },
    publisher: publisher(),
    datePublished: insight.published_iso || undefined,
    dateModified: insight.updated_iso || insight.published_iso || undefined,
    inLanguage: locale,
    url: pageUrl(`/insights/${insight.slug}`, locale),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl(`/insights/${insight.slug}`, locale) },
  };
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.path ? abs(item.path) : undefined,
    })),
  };
}
