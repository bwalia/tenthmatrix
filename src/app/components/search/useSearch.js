'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';

// Same relevance tuning as Workstation: title-first, body content excluded
// (it was the main source of noisy top results).
const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'tags', weight: 0.25 },
    { name: 'excerpt', weight: 0.15 },
  ],
  threshold: 0.35,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};
const SCORE_CUTOFF = 0.5;

let indexPromise = null; // shared across hook instances (header + page)

function fetchIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/data/search-index.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const seen = new Set();
        return (Array.isArray(data) ? data : []).filter((x) => {
          const k = x?.id || x?.slug;
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      })
      .catch(() => {
        indexPromise = null;
        return [];
      });
  }
  return indexPromise;
}

/** Client-side Fuse.js search over the prebuilt public/data/search-index.json. */
export default function useSearch() {
  const fuseRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchIndex().then((items) => {
      if (!alive) return;
      fuseRef.current = new Fuse(items, FUSE_OPTIONS);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const search = useCallback(
    (query, { type } = {}) => {
      if (!fuseRef.current || !query || query.length < 2) return [];
      let out = fuseRef.current.search(query).filter((r) => (r.score ?? 1) <= SCORE_CUTOFF);
      if (type) out = out.filter((r) => r.item.type === type);
      return out.map((r) => r.item);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready]
  );

  return { search, ready };
}
