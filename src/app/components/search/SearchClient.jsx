'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText, LineChart, Newspaper } from 'lucide-react';
import useBlogSearch from './useBlogSearch';
import SearchBox from './SearchBox';
import s from './Search.module.scss';

const ICONS = { article: FileText, insight: LineChart, blog: Newspaper };

function resultUrl(locale, r) {
  if (r.type === 'article') return `/${locale}/articles/${r.slug}`;
  if (r.type === 'insight') return `/${locale}/insights/${r.slug}`;
  return `/${locale}/docs/blogs/${r.slug}`;
}

/** Search box + results. Reads/writes ?q= so results are shareable. */
export default function SearchClient({ locale, suggestions = [] }) {
  const initial = useSearchParams().get('q') || '';
  // Remount when ?q= changes from outside (back/forward) so the box follows the URL.
  return <SearchInner key={initial} locale={locale} initial={initial} suggestions={suggestions} />;
}

function SearchInner({ locale, initial, suggestions }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [query, setQuery] = useState(initial);
  const { items, loading, active } = useBlogSearch(query);

  const commit = (q) => {
    setValue(q);
    setQuery(q);
    router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
  };

  const kind = (type) => t(`kinds.${type === 'article' || type === 'insight' ? type : 'blog'}`);

  return (
    <div className={`tm-search ${s.search}`}>
      <SearchBox
        locale={locale}
        id="tm-search-q"
        size="lg"
        autoFocus={!initial}
        value={value}
        onChange={(v) => {
          setValue(v);
          setQuery(v);
        }}
        onSubmit={commit}
      />
      <p role="status" aria-live="polite" className={s.summary}>
        {active ? (loading ? t('searchPage.searching') : items.length ? t('searchPage.results', { count: items.length, query }) : t('searchPage.noResults', { query })) : ''}
      </p>
      {!active && suggestions.length ? (
        <div className={s.suggest}>
          <p className="tm-eyebrow">{t('searchPage.popular')}</p>
          <ul>
            {suggestions.map((q) => (
              <li key={q}>
                <button type="button" className={s.chip} onClick={() => commit(q)}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {items.length ? (
        <ul className={s.results}>
          {items.map((r) => {
            const Icon = ICONS[r.type] || Newspaper;
            return (
              <li key={`${r.type}:${r.slug}`} className={s.result}>
                <span className={s.resultIcon} aria-hidden="true">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <div className={s.resultBody}>
                  <p className={s.resultKind}>{kind(r.type)}</p>
                  <h2 className={s.resultTitle}>
                    <Link href={resultUrl(locale, r)}>{r.title}</Link>
                  </h2>
                  {r.excerpt ? <p className={s.resultExcerpt}>{r.excerpt}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {active && !loading && !items.length ? (
        <p className={s.hint}>
          {t('searchPage.tryHint')} <Link href={`/${locale}/articles`}>{t('searchPage.browseArticles')}</Link>
        </p>
      ) : null}
    </div>
  );
}
