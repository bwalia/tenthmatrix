import Link from 'next/link';
import { prettifyTag } from '@/app/utils/blogTags';

/** Tag pills → /{locale}/docs/blogs/tag/{slug}. Accepts {slug,label|name}. */
export default function TagList({ tags = [], locale, activeTag, label }) {
  const items = tags
    .map((t) => (typeof t === 'string' ? { slug: t } : t))
    .filter((t) => t?.slug || t?.name);
  if (!items.length) return null;
  return (
    <ul className="tm-tags" aria-label={label}>
      {items.map((t) => {
        const slug = t.slug || String(t.name).toLowerCase().replace(/[^\w]+/g, '-');
        return (
          <li key={slug}>
            <Link
              href={`/${locale}/docs/blogs/tag/${slug}`}
              aria-current={slug === activeTag ? 'page' : undefined}
              className="tm-tag"
            >
              {t.label || prettifyTag(slug)}
              {typeof t.count === 'number' ? ` (${t.count})` : ''}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
