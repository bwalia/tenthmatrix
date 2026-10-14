import { getTranslations } from 'next-intl/server';
import { Clock, CalendarDays, User } from 'lucide-react';
import Breadcrumbs from '../ui/Breadcrumbs';
import Eyebrow from '../ui/Eyebrow';
import TagPill from '../ui/TagPill';
import ArticleCard from '../ui/ArticleCard';
import { prepareArticleHtml } from '@/lib/articleHtml';
import { readTime } from '@/utils/text';
import Prose from './Prose';
import Toc from './Toc';
import ShareButtons from './ShareButtons';
import LikeButton from '../blog/LikeButton';
import CommentBox from '../blog/CommentBox';
import s from './ArticleLayout.module.scss';

const SITE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');

function fmtDate(value, locale) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return { iso: d.toISOString(), label: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d) };
}

/**
 * Shared long-form layout for blog posts, technical articles and insights.
 *
 * props:
 *   locale, path (page path for share links, e.g. `/en/articles/x`)
 *   breadcrumbs   [{ label, href? }]
 *   eyebrow       string (series / kind)
 *   tags          [{ label, href? }]
 *   title, lede
 *   author, date, updated, readingMinutes (number) | readingLabel (string)
 *   image         cover image URL
 *   html          article HTML (ids + TOC derived server-side)
 *   headings      explicit outline [{ id, text, level }] when rendering `children`
 *   children      custom body (rendered inside .tm-prose) instead of html
 *   before        node above the body (e.g. key takeaways)
 *   after         node below the body (e.g. sources, FAQs)
 *   engagement    { slug } enables like + comments (blog API)
 *   related       { title, items: [ArticleCard props] }
 */
export default async function ArticleLayout({
  locale,
  path,
  breadcrumbs = [],
  eyebrow,
  tags = [],
  title,
  lede,
  author,
  date,
  updated,
  readingMinutes,
  readingLabel,
  image,
  html,
  headings: givenHeadings,
  children,
  before,
  after,
  engagement,
  related,
}) {
  const t = await getTranslations({ locale });
  const prepared = html != null ? prepareArticleHtml(html) : { html: null, headings: [] };
  const headings = givenHeadings || prepared.headings;
  const published = fmtDate(date, locale);
  const updatedAt = fmtDate(updated, locale);
  const minutes = readingMinutes || (html ? readTime(html) : null);
  const readLabel = readingLabel || (minutes ? t('common.minRead', { minutes }) : null);
  const hasToc = headings.length >= 2;

  return (
    <article className={`tm-article ${s.article}`}>
      <header className={s.head}>
        <div className={s.headInner}>
          <Breadcrumbs items={breadcrumbs} label={t('common.breadcrumb')} />
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className={s.title}>{title}</h1>
          {lede ? <p className={s.lede}>{lede}</p> : null}
          <ul className={s.meta}>
            {author ? (
              <li>
                <User aria-hidden="true" size={16} strokeWidth={1.75} />
                {author}
              </li>
            ) : null}
            {published ? (
              <li>
                <CalendarDays aria-hidden="true" size={16} strokeWidth={1.75} />
                <time dateTime={published.iso}>{published.label}</time>
              </li>
            ) : null}
            {readLabel ? (
              <li>
                <Clock aria-hidden="true" size={16} strokeWidth={1.75} />
                {readLabel}
              </li>
            ) : null}
            {updatedAt && updatedAt.iso !== published?.iso ? (
              <li>
                {t('article.updated')} <time dateTime={updatedAt.iso}>{updatedAt.label}</time>
              </li>
            ) : null}
          </ul>
          {tags.length ? (
            <ul className={s.tags} aria-label={t('blog.tags')}>
              {tags.map((tag) => (
                <li key={tag.label}>
                  <TagPill href={tag.href} size="sm" prefetch={false}>
                    {tag.label}
                  </TagPill>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div className={`${s.layout} ${hasToc ? s.withToc : ''}`}>
        <div className={s.main}>
          {image ? (
            <figure className={s.cover}>
              <img src={image} alt="" width="1200" height="630" fetchPriority="high" decoding="async" />
            </figure>
          ) : null}
          {hasToc ? (
            <div className={s.tocInline}>
              <Toc headings={headings} label={t('article.contents')} variant="inline" />
            </div>
          ) : null}
          {before}
          {prepared.html != null ? <Prose html={prepared.html} /> : <div className="tm-prose">{children}</div>}
          {after}

          <footer className={s.foot}>
            {engagement?.slug ? <LikeButton slug={engagement.slug} /> : null}
            {path ? <ShareButtons url={`${SITE_URL}${path}`} title={typeof title === 'string' ? title : ''} /> : null}
          </footer>
          {engagement?.slug ? <CommentBox slug={engagement.slug} /> : null}
        </div>
        {hasToc ? (
          <aside className={s.rail}>
            <div className={s.railSticky}>
              <Toc headings={headings} label={t('article.contents')} />
            </div>
          </aside>
        ) : null}
      </div>

      {related?.items?.length ? (
        <section className={s.related} aria-labelledby="tm-related-title">
          <div className={s.relatedInner}>
            <h2 id="tm-related-title" className={s.relatedTitle}>
              {related.title}
            </h2>
            <ul className="tm-grid">
              {related.items.map((item) => (
                <li key={item.href}>
                  <ArticleCard {...item} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}
