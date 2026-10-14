import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPostDetail } from '@/lib/cms';
import { blogPostingSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { readTime, isSample } from '@/utils/text';
import JsonLd from '@/app/components/seo/JsonLd';
import TagList from '@/app/components/blog/TagList';
import Prose from '@/app/components/blog/Prose';
import LikeButton from '@/app/components/blog/LikeButton';
import CommentBox from '@/app/components/blog/CommentBox';

// ISR: served from cache, refreshed hourly, busted on demand via /api/revalidate.
export const revalidate = 3600;

// On-demand ISR: don't prerender every post at build; unknown slugs (e.g. new
// CMS posts) render on first request, then cache.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const blog = await getPostDetail(slug, locale);
  if (!blog) return { title: 'Blog' };
  const title = blog.meta_title || blog.title;
  const description = blog.meta_description || blog.excerpt;
  return {
    title: { absolute: title },
    description,
    keywords: blog.meta_keywords || undefined,
    // The co-located opengraph-image.js supplies og:image / twitter:image.
    openGraph: { title, description, type: 'article', publishedTime: blog.published_date || undefined },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `/${locale}/docs/blogs/${slug}` },
    robots: isSample(slug) ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const blog = await getPostDetail(slug, locale);
  if (!blog) notFound();
  const t = await getTranslations({ locale });

  const when = new Date(blog.published_date || blog.updated_at || '');
  const validDate = !Number.isNaN(when.getTime());

  return (
    <article className="tm-container tm-article">
      <nav aria-label={t('common.breadcrumb')} className="tm-breadcrumb">
        <Link href={`/${locale}`}>{t('common.home')}</Link> / <Link href={`/${locale}/docs/blogs`}>{t('blog.title')}</Link>
      </nav>
      <header className="tm-article__head">
        <h1>{blog.title}</h1>
        {blog.sub_title ? <p className="tm-lede">{blog.sub_title}</p> : null}
        <p className="tm-article__meta">
          {blog.user?.name ? <span>{blog.user.name}</span> : null}
          {validDate ? (
            <>
              {' · '}
              <time dateTime={when.toISOString()}>
                {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(when)}
              </time>
            </>
          ) : null}
          {' · '}
          {t('common.minRead', { minutes: blog.reading_minutes || readTime(blog.content) })}
        </p>
        <TagList tags={blog.tags} locale={locale} label={t('blog.tags')} />
      </header>
      <Prose html={blog.content} />
      <footer className="tm-article__foot">
        <LikeButton slug={slug} />
      </footer>
      <CommentBox slug={slug} />
      <JsonLd
        data={[
          blogPostingSchema(blog, locale),
          breadcrumbSchema([
            { label: 'Home', path: `/${locale}` },
            { label: 'Blog', path: `/${locale}/docs/blogs` },
            { label: blog.title },
          ]),
        ]}
      />
    </article>
  );
}
