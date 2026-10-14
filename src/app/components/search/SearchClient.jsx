'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import useBlogSearch from './useBlogSearch';

function resultUrl(locale, r) {
  if (r.type === 'article') return `/${locale}/articles/${r.slug}`;
  if (r.type === 'insight') return `/${locale}/insights/${r.slug}`;
  return `/${locale}/docs/blogs/${r.slug}`;
}

/** Search box + results. Reads/writes ?q= so results are shareable. */
export default function SearchClient({ locale }) {
  const initial = useSearchParams().get('q') || '';
  // Remount when ?q= changes from outside (back/forward) so the box follows the URL.
  return <SearchInner key={initial} locale={locale} initial={initial} />;
}

function SearchInner({ locale, initial }) {
  const t = useTranslations('searchPage');
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [query, setQuery] = useState(initial);
  const { items, loading, active } = useBlogSearch(query);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    setQuery(q);
    router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
  };

  return (
    <div className="tm-search">
      <form role="search" className="tm-search__form" onSubmit={submit}>
        <label htmlFor="tm-search-q" className="tm-visually-hidden">
          {t('label')}
        </label>
        <input
          id="tm-search-q"
          type="search"
          name="q"
          className="tm-tap"
          placeholder={t('placeholder')}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setQuery(e.target.value);
          }}
        />
        <button type="submit" className="tm-button tm-tap">
          {t('submit')}
        </button>
      </form>
      <p role="status" aria-live="polite" className="tm-search__summary">
        {active ? (loading ? t('searching') : items.length ? t('results', { count: items.length, query }) : t('noResults', { query })) : ''}
      </p>
      {items.length ? (
        <ul className="tm-post-list">
          {items.map((r) => (
            <li key={`${r.type}:${r.slug}`}>
              <article className="tm-card">
                <h2 className="tm-card__title">
                  <Link href={resultUrl(locale, r)}>{r.title}</Link>
                </h2>
                {r.excerpt ? <p className="tm-card__excerpt">{r.excerpt}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
