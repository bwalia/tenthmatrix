import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBlogTags } from '@/lib/cms';
import TagList from '@/app/components/blog/TagList';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: 'Blog topics', alternates: { canonical: `/${locale}/docs/blogs/tags` } };
}

export default async function TagsIndex({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const tags = await getBlogTags(500);
  return (
    <div className="tm-container tm-listing">
      <h1>{t('tags')}</h1>
      {tags.length ? <TagList tags={tags} locale={locale} label={t('tags')} /> : <p>{t('noPostsYet')}</p>}
    </div>
  );
}
