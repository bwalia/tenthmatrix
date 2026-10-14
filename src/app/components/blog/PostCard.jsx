import Link from 'next/link';

const isSample = (slug = '') => /^__.*__$/.test(String(slug));

/**
 * Listing card shared by blogs, articles and insights. `post` is the listing
 * meta shape ({ slug, title, excerpt, published_date, cover_image, tags }).
 * Headings are h2 inside listings (each page owns exactly one h1).
 */
export default function PostCard({ post, href, locale = 'en', headingLevel = 'h2' }) {
  const H = headingLevel;
  const date = post.published_date ? new Date(post.published_date) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  return (
    <article className="tm-card">
      {post.cover_image ? (
        <img className="tm-card__media" src={post.cover_image} alt="" loading="lazy" width="1200" height="630" />
      ) : null}
      <H className="tm-card__title">
        <Link href={href}>{post.title}</Link>
        {isSample(post.slug) ? <span className="tm-badge"> (sample)</span> : null}
      </H>
      {validDate ? (
        <time className="tm-card__date" dateTime={date.toISOString()}>
          {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)}
        </time>
      ) : null}
      {post.excerpt ? <p className="tm-card__excerpt">{post.excerpt}</p> : null}
    </article>
  );
}
