'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';

function subscribe(cb) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function readStored(key) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false; // storage blocked
  }
}

/** POST /api/blogs/{slug}/like {action: like|dislike}; remembers per browser. */
export default function LikeButton({ slug }) {
  const t = useTranslations('blog');
  const key = `tm-liked-${slug}`;
  const stored = useSyncExternalStore(subscribe, () => readStored(key), () => false);
  const [override, setOverride] = useState(null);
  const liked = override ?? stored;
  const setLiked = setOverride;
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch(`/api/blogs/${encodeURIComponent(slug)}/like`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && typeof d.likes === 'number' && setCount(d.likes))
      .catch(() => {});
  }, [key, slug]);

  const toggle = async () => {
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: liked ? 'dislike' : 'like' }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(!liked);
        setCount(data.likes);
        try {
          localStorage.setItem(key, String(!liked));
        } catch {
          /* storage blocked */
        }
      }
    } catch {
      /* offline: leave state unchanged */
    }
  };

  return (
    <button type="button" className="tm-like tm-tap" aria-pressed={liked} onClick={toggle}>
      <Heart aria-hidden="true" size={18} fill={liked ? 'currentColor' : 'none'} />
      <span>{liked ? t('liked') : t('like')}</span>
      {typeof count === 'number' ? <span className="tm-like__count"> · {t('likes', { count })}</span> : null}
    </button>
  );
}
