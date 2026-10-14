import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPostDetail, getPostListPage } from '@/lib/cms';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import { blogPostingSchema, breadcrumbSchema } from '@/app/utils/schemaMarkup';
import { isSample } from '@/utils/text';
import { blogAuthor, blogCard, blogCover, blogTagLinks } from '@/lib/contentView';
import JsonLd from '@/app/components/seo/JsonLd';
import ArticleLayout from '@/app/components/article/ArticleLayout';

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

  const tags = blogTagLinks(blog.tags, locale);
  const { blogs: recent } = await getPostListPage({ page: 1 });
  const related = localizeBlogMetaList(recent, locale)
    .filter((b) => b.slug !== slug)
    .slice(0, 3)
    .map((b) => blogCard(b, locale, t));

  return (
    <>
      <ArticleLayout
        locale={locale}
        path={`/${locale}/docs/blogs/${slug}`}
        breadcrumbs={[
          { label: t('common.home'), href: `/${locale}` },
          { label: t('blog.title'), href: `/${locale}/docs/blogs` },
          { label: blog.title },
        ]}
        eyebrow={t('kinds.blog')}
        tags={tags}
        title={blog.title}
        lede={blog.sub_title && blog.sub_title !== blog.title ? blog.sub_title : null}
        author={blogAuthor(blog.user)}
        date={blog.published_date || blog.created_at}
        updated={blog.updated_at}
        readingMinutes={blog.reading_minutes}
        image={blogCover(blog)}
        html={blog.content}
        engagement={{ slug }}
        related={{ title: t('article.morePosts'), items: related }}
      />
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
    </>
  );
}
