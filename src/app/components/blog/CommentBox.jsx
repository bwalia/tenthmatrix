'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/** GET/POST /api/blogs/{slug}/comment. `website` is a honeypot field. */
export default function CommentBox({ slug }) {
  const t = useTranslations('blog');
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ name: '', comment: '', website: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    fetch(`/api/blogs/${encodeURIComponent(slug)}/comment`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.comments && setComments(d.comments))
      .catch(() => {});
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'failed');
      setComments(data.comments || []);
      setForm({ name: '', comment: '', website: '' });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="tm-comments" aria-labelledby="tm-comments-title">
      <h2 id="tm-comments-title">{t('comments')}</h2>
      {comments.length ? (
        <ol className="tm-comments__list">
          {comments.map((c) => (
            <li key={c.id}>
              <p className="tm-comments__meta">
                <strong>{c.name}</strong> · <time dateTime={c.created_at}>{c.created_at.slice(0, 10)}</time>
              </p>
              <p>{c.comment}</p>
            </li>
          ))}
        </ol>
      ) : null}
      <form className="tm-form" onSubmit={submit}>
        <label>
          {t('commentName')}
          <input
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          {t('commentBody')}
          <textarea
            name="comment"
            required
            maxLength={2000}
            rows={4}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </label>
        <label className="tm-visually-hidden" aria-hidden="true">
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </label>
        <button type="submit" className="tm-button tm-tap" disabled={status === 'sending'}>
          {t('commentSubmit')}
        </button>
        <p role="status" aria-live="polite">
          {status === 'done' ? t('commentThanks') : status === 'error' ? t('commentError') : ''}
        </p>
      </form>
    </section>
  );
}
