import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prettifyTag } from '@/app/utils/blogTags';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import { getPostListPage, getBlogTags } from '@/lib/cms';
import BlogListing from '@/app/components/blog/BlogListing';

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { tag, locale } = await params;
  const label = prettifyTag(tag);
  return {
    title: `${label} · Blog`,
    description: `Posts tagged ${label}.`,
    alternates: { canonical: `/${locale}/docs/blogs/tag/${tag}` },
  };
}

export default async function TagPage({ params }) {
  const { tag, locale } = await params;
  setRequestLocale(locale);
  const { blogs: raw, totalPages } = await getPostListPage({ tag, page: 1 });
  if (!raw.length) notFound();
  const tags = await getBlogTags();
  const label = prettifyTag(tag);
  const t = await getTranslations({ locale, namespace: 'blog' });
  return (
    <BlogListing
      locale={locale}
      blogs={localizeBlogMetaList(raw, locale)}
      totalPages={totalPages}
      currentPage={1}
      tags={tags}
      activeTag={tag}
      heading={label}
      subheading={t('postsTaggedWith', { tag: label })}
      firstHref={`/${locale}/docs/blogs/tag/${tag}`}
      pageHref={`/${locale}/docs/blogs/tag/${tag}/page`}
    />
  );
}
