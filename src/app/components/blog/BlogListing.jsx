import { getTranslations } from 'next-intl/server';
import PostCard from './PostCard';
import TagList from './TagList';
import Pagination from './Pagination';

/** One listing view for /docs/blogs, /page/N, /tag/X and /tag/X/page/N. */
export default async function BlogListing({
  locale,
  blogs,
  totalPages,
  currentPage,
  tags,
  activeTag,
  heading,
  subheading,
  firstHref,
  pageHref,
}) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  return (
    <div className="tm-container tm-listing">
      <header className="tm-listing__head">
        <h1>{heading || t('title')}</h1>
        <p className="tm-lede">{subheading || t('subtitle')}</p>
      </header>
      <TagList tags={tags} locale={locale} activeTag={activeTag} label={t('tags')} />
      {blogs.length ? (
        <ul className="tm-post-list">
          {blogs.map((b) => (
            <li key={b.slug}>
              <PostCard post={b} locale={locale} href={`/${locale}/docs/blogs/${b.slug}`} />
            </li>
          ))}
        </ul>
      ) : (
        <p>{t('noPostsYet')}</p>
      )}
      <Pagination
        locale={locale}
        currentPage={currentPage}
        totalPages={totalPages}
        firstHref={firstHref}
        pageHref={pageHref}
      />
    </div>
  );
}
