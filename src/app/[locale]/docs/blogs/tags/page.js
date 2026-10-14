import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBlogTags } from '@/lib/cms';
import { prettifyTag } from '@/app/utils/blogTags';
import { Breadcrumbs, Eyebrow, TagPill } from '@/app/components';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return { title: tm('blog.topicsTitle'), description: tm('blog.topicsLede'), alternates: { canonical: `/${locale}/docs/blogs/tags` } };
}

export default async function TagsIndex({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const tags = await getBlogTags(500);
  return (
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Breadcrumbs
            label={t('common.breadcrumb')}
            items={[
              { label: t('common.home'), href: `/${locale}` },
              { label: t('blog.title'), href: `/${locale}/docs/blogs` },
              { label: t('blog.topicsTitle') },
            ]}
          />
          <Eyebrow>{t('nav.items.blog.label')}</Eyebrow>
          <h1>{t('blog.topicsTitle')}</h1>
          <p className="tm-lede">{t('blog.topicsLede')}</p>
        </div>
      </header>
      <div className="tm-page-body">
        {tags.length ? (
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--tm-space-3)', margin: 0, padding: 0, listStyle: 'none' }}>
            {tags.map((tag) => (
              <li key={tag.slug}>
                <TagPill href={`/${locale}/docs/blogs/tag/${tag.slug}`} count={tag.count} prefetch={false}>
                  {prettifyTag(tag.slug)}
                </TagPill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tm-empty">{t('blog.noPostsYet')}</p>
        )}
      </div>
    </>
  );
}
