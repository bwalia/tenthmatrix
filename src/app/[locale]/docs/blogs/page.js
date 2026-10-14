import { setRequestLocale } from 'next-intl/server';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import { getPostListPage, getBlogTags } from '@/lib/cms';
import BlogListing from '@/app/components/blog/BlogListing';

// ISR: served from cache, refreshed hourly, busted on demand via /api/revalidate.
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: 'Blog', alternates: { canonical: `/${locale}/docs/blogs` } };
}

export default async function BlogsHome({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { blogs: raw, totalPages } = await getPostListPage({ page: 1 });
  const tags = await getBlogTags();
  return (
    <BlogListing
      locale={locale}
      blogs={localizeBlogMetaList(raw, locale)}
      totalPages={totalPages}
      currentPage={1}
      tags={tags}
      firstHref={`/${locale}/docs/blogs`}
      pageHref={`/${locale}/docs/blogs/page`}
    />
  );
}
