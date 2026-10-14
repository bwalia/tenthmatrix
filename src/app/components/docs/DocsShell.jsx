import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, Code2, HelpCircle, Newspaper, Rocket, ScrollText } from 'lucide-react';
import { Breadcrumbs, Eyebrow } from '@/app/components';
import s from './DocsShell.module.scss';

export const DOCS_NAV = [
  { key: 'introduction', href: '/docs/introduction', icon: Rocket },
  { key: 'apis', href: '/docs/apis', icon: Code2 },
  { key: 'faqs', href: '/docs/faqs', icon: HelpCircle },
  { key: 'blog', href: '/docs/blogs', icon: Newspaper },
  { key: 'license', href: '/docs/license', icon: ScrollText },
];

/**
 * Docs page frame: page head (breadcrumbs, eyebrow, h1, lede) + a sticky side
 * nav of the docs sections on wide screens (a horizontal strip on mobile).
 * props: locale, current (DOCS_NAV key), title, lede, children
 */
export default async function DocsShell({ locale, current, title, lede, children }) {
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="tm-page-head">
        <div className="tm-page-head__inner">
          <Breadcrumbs
            label={t('common.breadcrumb')}
            items={[
              { label: t('common.home'), href: `/${locale}` },
              { label: t('docs.title'), href: `/${locale}/docs` },
              { label: title },
            ]}
          />
          <Eyebrow>{t('docs.eyebrow')}</Eyebrow>
          <h1>{title}</h1>
          {lede ? <p className="tm-lede">{lede}</p> : null}
        </div>
      </header>
      <div className={s.layout}>
        <nav className={s.side} aria-label={t('docs.sectionsLabel')}>
          <p className={s.sideTitle}>{t('docs.sectionsLabel')}</p>
          <ul>
            <li>
              <Link href={`/${locale}/docs`} className={s.link}>
                <BookOpen aria-hidden="true" size={18} strokeWidth={1.75} />
                {t('docs.overview')}
              </Link>
            </li>
            {DOCS_NAV.map(({ key, href, icon: Icon }) => (
              <li key={key}>
                <Link href={`/${locale}${href}`} className={s.link} aria-current={current === key ? 'page' : undefined}>
                  <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                  {t(`docs.sections.${key}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.content}>{children}</div>
      </div>
    </>
  );
}
