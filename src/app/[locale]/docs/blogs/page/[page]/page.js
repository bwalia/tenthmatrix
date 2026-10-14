import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import { getPostListPage, getBlogTags } from '@/lib/cms';
import BlogListing from '@/app/components/blog/BlogListing';

export const revalidate = 3600;

// On-demand ISR (as Workstation's K3S build): pages render on first request.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { page, locale } = await params;
  const n = parseInt(page || '1', 10);
  return {
    title: `Blog — page ${n}`,
    alternates: { canonical: `/${locale}/docs/blogs/page/${n}` },
  };
}

export default async function BlogPage({ params }) {
  const { page, locale } = await params;
  setRequestLocale(locale);
  const currentPage = parseInt(page || '1', 10);
  if (!Number.isFinite(currentPage) || currentPage < 1) notFound();
  const { blogs: raw, totalPages } = await getPostListPage({ page: currentPage });
  if (currentPage > totalPages) notFound();
  const tags = await getBlogTags();
  return (
    <BlogListing
      locale={locale}
      blogs={localizeBlogMetaList(raw, locale)}
      totalPages={totalPages}
      currentPage={currentPage}
      tags={tags}
      firstHref={`/${locale}/docs/blogs`}
      pageHref={`/${locale}/docs/blogs/page`}
    />
  );
}
