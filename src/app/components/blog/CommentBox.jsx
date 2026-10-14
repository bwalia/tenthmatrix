'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import s from './Engagement.module.scss';

/** GET/POST /api/blogs/{slug}/comment. `website` is a honeypot field. */
export default function CommentBox({ slug }) {
  const t = useTranslations('blog');
  const locale = useLocale();
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

  const fmt = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  };

  return (
    <section className={`tm-comments ${s.comments}`} aria-labelledby="tm-comments-title">
      <h2 id="tm-comments-title" className={s.title}>
        <MessageSquare aria-hidden="true" size={20} strokeWidth={1.75} />
        {t('comments')}
        {comments.length ? <span className={s.badge}>{comments.length}</span> : null}
      </h2>
      {comments.length ? (
        <ol className={s.list}>
          {comments.map((c) => (
            <li key={c.id} className={s.comment}>
              <p className={s.meta}>
                <strong>{c.name}</strong>
                {c.created_at ? <time dateTime={c.created_at}>{fmt(c.created_at)}</time> : null}
              </p>
              <p className={s.body}>{c.comment}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={s.empty}>{t('noComments')}</p>
      )}
      <form className={s.form} onSubmit={submit}>
        <div>
          <label className="tm-label" htmlFor="tm-comment-name">
            {t('commentName')}
          </label>
          <input
            id="tm-comment-name"
            className="tm-input"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="tm-label" htmlFor="tm-comment-body">
            {t('commentBody')}
          </label>
          <textarea
            id="tm-comment-body"
            className="tm-input"
            name="comment"
            required
            maxLength={2000}
            rows={4}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>
        <div className="tm-visually-hidden" aria-hidden="true">
          <label htmlFor="tm-comment-website">Website</label>
          <input
            id="tm-comment-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
        <div className={s.formFoot}>
          <button type="submit" className={s.submit} disabled={status === 'sending'}>
            {status === 'sending' ? t('commentSending') : t('commentSubmit')}
          </button>
          <p role="status" aria-live="polite" className={status === 'error' ? s.error : s.ok}>
            {status === 'done' ? t('commentThanks') : status === 'error' ? t('commentError') : ''}
          </p>
        </div>
      </form>
    </section>
  );
}
