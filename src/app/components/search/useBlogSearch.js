'use client';

import { useState, useEffect, useMemo } from 'react';
import useSearch from './useSearch';

/**
 * Live-first search, Fuse fallback (Workstation's model):
 *  - /api/blog-search hits the OpsAPI CMS `?search=` so posts published via the
 *    API are findable immediately;
 *  - the prebuilt Fuse index covers articles + insights (never in the CMS) and
 *    is the whole answer when the API is unavailable.
 * Items: { type, id, slug, title, excerpt, date, image, author, category }.
 */
export default function useBlogSearch(query, { minChars = 2 } = {}) {
  const { search, ready } = useSearch();
  // The settled live answer and the query it belongs to. results === null means
  // the live route failed → Fuse-only for that query.
  const [settled, setSettled] = useState({ q: '', results: null });
  const q = (query || '').trim();
  const active = q.length >= minChars;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let results = null;
      // The S3 static export has no /api; go straight to the prebuilt index.
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === '1') {
        if (!cancelled) setSettled({ q, results });
        return;
      }
      try {
        const res = await fetch(`/api/blog-search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          results = Array.isArray(data.results) ? data.results : [];
        }
      } catch {
        results = null;
      }
      if (!cancelled) setSettled({ q, results });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, active]);

  const live = settled.q === q ? settled.results : null;
  const items = useMemo(() => {
    if (!active) return [];
    const fuse = ready ? search(q) : [];
    const raw = live != null ? [...live, ...fuse.filter((x) => x.type !== 'blog')] : fuse;
    const seen = new Set();
    return raw.filter((x) => {
      const k = `${x?.type}:${x?.slug || x?.id}`;
      if (!x || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [active, ready, search, q, live]);

  const loading = active && settled.q !== q && !items.length;
  return { items, loading, active };
}
