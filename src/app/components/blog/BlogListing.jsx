import { getTranslations } from 'next-intl/server';
import { ArticleCard, TagPill, Eyebrow } from '@/app/components';
import { blogCard } from '@/lib/contentView';
import { prettifyTag } from '@/app/utils/blogTags';
import Pagination from './Pagination';
import s from './BlogListing.module.scss';

/** One listing view for /docs/blogs, /page/N, /tag/X and /tag/X/page/N. */
export default async function BlogListing({ locale, blogs, totalPages, currentPage, tags, activeTag, heading, subheading, firstHref, pageHref }) {
  const t = await getTranslations({ locale });
  const cards = blogs.map((b) => blogCard(b, locale, t));
  const featured = currentPage === 1 && !activeTag && cards.length > 3 ? cards[0] : null;
  const rest = featured ? cards.slice(1) : cards;

  return (
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Eyebrow>{activeTag ? t('blog.topic') : t('nav.items.blog.label')}</Eyebrow>
          <h1>{heading || t('blog.title')}</h1>
          <p className="tm-lede">{subheading || t('blog.subtitle')}</p>
          {tags?.length ? (
            <nav aria-label={t('blog.tags')} className={s.tagsNav}>
              <ul className={s.tags}>
                <li>
                  <TagPill href={`/${locale}/docs/blogs`} active={!activeTag}>
                    {t('blog.allPosts')}
                  </TagPill>
                </li>
                {tags.map((tag) => (
                  <li key={tag.slug}>
                    <TagPill href={`/${locale}/docs/blogs/tag/${tag.slug}`} active={tag.slug === activeTag} count={tag.count} prefetch={false}>
                      {prettifyTag(tag.slug)}
                    </TagPill>
                  </li>
                ))}
                <li>
                  <TagPill href={`/${locale}/docs/blogs/tags`} prefetch={false}>
                    {t('blog.allTopics')}
                  </TagPill>
                </li>
              </ul>
            </nav>
          ) : null}
        </div>
      </header>
      <div className="tm-page-body">
        {cards.length ? (
          <>
            {featured ? (
              <div className={s.featured}>
                <ArticleCard {...featured} locale={locale} headingLevel="h2" variant="feature" />
              </div>
            ) : null}
            <ul className="tm-grid">
              {rest.map((c) => (
                <li key={c.href}>
                  <ArticleCard {...c} locale={locale} headingLevel="h2" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="tm-empty">{t('blog.noPostsYet')}</p>
        )}
        <Pagination locale={locale} currentPage={currentPage} totalPages={totalPages} firstHref={firstHref} pageHref={pageHref} />
      </div>
    </>
  );
}
