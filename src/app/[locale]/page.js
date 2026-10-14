import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadLocaleData } from '@/utils/loadLocaleData';
import { getPostListPage } from '@/lib/cms';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import PostCard from '../components/blog/PostCard';

// Placeholder home. The narrative (agents, tools, apps, featured products,
// services, CTA) is built in the design phase — this only proves the data path.
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadLocaleData('home.json', locale);
  return {
    title: { absolute: data.meta.title },
    description: data.meta.description,
    alternates: { canonical: `/${locale}` },
  };
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await loadLocaleData('home.json', locale);
  const { blogs } = await getPostListPage({ page: 1 });
  const latest = localizeBlogMetaList(blogs, locale).slice(0, 3);

  return (
    <div className="tm-home">
      <section className="tm-hero tm-container">
        <p className="tm-eyebrow">{data.hero.eyebrow}</p>
        <h1>{data.hero.title}</h1>
        <p className="tm-lede">{data.hero.lede}</p>
      </section>

      <section className="tm-container tm-home__sections" aria-label={data.hero.eyebrow}>
        <ul>
          {data.sections.map((s) => (
            <li key={s.id} id={s.id}>
              <h2>{s.title}</h2>
            </li>
          ))}
        </ul>
      </section>

      <section className="tm-container tm-home__latest">
        <h2>{t('home.latest')}</h2>
        {latest.length ? (
          <ul className="tm-post-list">
            {latest.map((b) => (
              <li key={b.slug}>
                <PostCard post={b} locale={locale} href={`/${locale}/docs/blogs/${b.slug}`} />
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('blog.noPostsYet')}</p>
        )}
      </section>

      <section className="tm-container tm-home__hardware">
        <p>
          {data.hardware.text}{' '}
          <a href={data.hardware.href} rel="noopener">
            {data.hardware.label}
          </a>
        </p>
        <p>
          <Link href={`/${locale}/contact-us`}>{t('nav.contact')}</Link>
        </p>
      </section>
    </div>
  );
}
