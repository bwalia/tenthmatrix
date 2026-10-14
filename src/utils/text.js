export const stripHtml = (html = '') => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const readTime = (html = '') =>
  Math.max(1, Math.round(stripHtml(html).split(' ').filter(Boolean).length / 200));
export const truncate = (s = '', n = 160) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
export const isSample = (slug = '') => /^__.*__$/.test(String(slug));
