import Link from 'next/link';
import cx from './cx';
import TagPill from './TagPill';
import s from './ArticleCard.module.scss';

function formatDate(date, locale) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return { iso: d.toISOString(), label: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d) };
}

/**
 * Listing card for blogs, articles and insights. Whole card is clickable via
 * the title link; tag pills are plain labels (not links) for that reason.
 *
 * props:
 *   title, href, excerpt
 *   date          ISO string | Date
 *   locale        for date formatting (default 'en')
 *   image         cover image URL (optional; 1200x630 ratio)
 *   kind          small label, e.g. "Article", "Blog", "Insight"
 *   readingTime   preformatted string, e.g. "6 min read"
 *   tags          string[] (first 2 shown)
 *   headingLevel  'h3' (default) | 'h2'
 *   variant       'default' | 'feature' (image left on wide screens) | 'compact' (no image, no excerpt)
 *   badge         small extra label (e.g. "Sample")
 */
export default function ArticleCard({ title, href, excerpt, date, locale = 'en', image, kind, readingTime, tags = [], headingLevel: H = 'h3', variant = 'default', badge, className }) {
  const d = formatDate(date, locale);
  const showImage = image && variant !== 'compact';
  return (
    <article className={cx('tm-article-card', s.card, s[variant], showImage && s.hasImage, className)}>
      {showImage ? (
        <div className={s.media}>
          <img src={image} alt="" loading="lazy" decoding="async" width="1200" height="630" />
        </div>
      ) : null}
      <div className={s.body}>
        <p className={s.meta}>
          {kind ? <span className={s.kind}>{kind}</span> : null}
          {d ? <time dateTime={d.iso}>{d.label}</time> : null}
          {readingTime ? <span>{readingTime}</span> : null}
          {badge ? <span className={s.badge}>{badge}</span> : null}
        </p>
        <H className={s.title}>
          <Link href={href} className={s.link}>
            {title}
          </Link>
        </H>
        {excerpt && variant !== 'compact' ? <p className={s.excerpt}>{excerpt}</p> : null}
        {tags.length ? (
          <div className={s.tags}>
            {tags.slice(0, 2).map((t) => (
              <TagPill key={t} size="sm">
                {t}
              </TagPill>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
