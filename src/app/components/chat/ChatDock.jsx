'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { CHAT_FREE_MINUTES } from '@/lib/chat/limits';
import { readChat as read, writeChat as write } from './chatStore';
import s from './ChatDock.module.scss';

const MAX = 4000;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Markdown subset the system prompt allows: paragraphs, - lists, **bold**, [links]. HTML is escaped first. */
function renderMarkdown(text) {
  const inline = (line) =>
    esc(line)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(((?:\/|https:\/\/)[^\s)]+)\)/g, (_, label, href) => {
        const ext = href.startsWith('https://') && !/^https:\/\/(www\.)?tenthmatrix\.com/.test(href);
        return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
      });
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

/** Reads an SSE response body, calling onEvent({ type, data }) per frame. */
async function readSse(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const type = /^event: (.+)$/m.exec(frame)?.[1];
      const data = /^data: (.+)$/m.exec(frame)?.[1];
      if (type && data) {
        try {
          onEvent({ type, data: JSON.parse(data) });
        } catch {
          /* ignore a malformed frame */
        }
      }
    }
  }
}

export default function ChatDock() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  // Restored from sessionStorage on first render; the dock renders nothing until
  // the enabled check resolves, so server and client markup still match.
  const [items, setItems] = useState(() => (typeof window === 'undefined' ? [] : read()?.items || []));
  const [enquirySent, setEnquirySent] = useState(() => (typeof window === 'undefined' ? false : Boolean(read()?.enquirySent)));
  // Minted by the server on the first message; the free time is counted per session.
  const [sessionUuid, setSessionUuid] = useState(() => (typeof window === 'undefined' ? null : read()?.sessionUuid || null));
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Only show up where the backend answers (k3s, or the edge route on prod).
  useEffect(() => {
    let live = true;
    fetch('/api/chat', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setEnabled(Boolean(d?.enabled)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!busy) write({ items, enquirySent, sessionUuid });
  }, [items, enquirySent, sessionUuid, busy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [items, open]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const patchLast = (fn) => setItems((prev) => prev.map((it, i) => (i === prev.length - 1 ? fn(it) : it)));

  const send = useCallback(
    async (text) => {
      const message = text.trim().slice(0, MAX);
      if (!message || busy) return;
      // Errored turns (and the message that got the error) stay out of the replayed history.
      const history = items
        .filter((it, i) => it.content && !it.error && !(it.role === 'user' && items[i + 1]?.error))
        .map(({ role, content }) => ({ role, content }));
      setItems((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '', tools: [] }]);
      setInput('');
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            history,
            locale,
            page_url: window.location.href,
            enquiry_sent: enquirySent,
            session_uuid: sessionUuid || undefined,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const d = await res.json().catch(() => null);
          if (d?.code === 'CHAT_OFFLINE') setEnabled(false);
          const timeLimit = d?.code === 'CHAT_TIME_LIMIT';
          const limitMsg = enquirySent ? t('timeLimitSent', { minutes: CHAT_FREE_MINUTES }) : t('timeLimit', { minutes: CHAT_FREE_MINUTES });
          patchLast((it) => ({ ...it, error: timeLimit ? limitMsg : d?.error || t('error'), timeLimit }));
          return;
        }
        await readSse(res, ({ type, data }) => {
          if (type === 'text') patchLast((it) => ({ ...it, content: it.content + data.delta }));
          else if (type === 'tool')
            patchLast((it) => ({ ...it, tools: [...it.tools.filter((x) => x.name !== data.name), data] }));
          else if (type === 'enquiry') setEnquirySent(true);
          else if (type === 'session') setSessionUuid(data.session_uuid || null);
          else if (type === 'error') patchLast((it) => ({ ...it, error: data.message || t('error') }));
        });
      } catch (err) {
        if (err?.name !== 'AbortError') patchLast((it) => ({ ...it, error: t('error') }));
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, items, locale, enquirySent, sessionUuid, t],
  );

  const reset = () => {
    abortRef.current?.abort();
    setItems([]);
    setEnquirySent(false);
    setSessionUuid(null);
  };

  if (!enabled) return null;

  const suggestions = t.raw('suggestions');

  return (
    <>
      {open ? (
        <section className={s.panel} role="dialog" aria-label={t('title')} aria-modal="false">
          <header className={s.head}>
            <div>
              <p className={s.title}>{t('title')}</p>
              <p className={s.subtitle}>{t('subtitle')}</p>
            </div>
            <div className={s.headActions}>
              {items.length ? (
                <button type="button" className={s.iconBtn} onClick={reset} aria-label={t('newChat')} title={t('newChat')}>
                  <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              ) : null}
              <button type="button" className={s.iconBtn} onClick={() => setOpen(false)} aria-label={t('close')}>
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div ref={listRef} className={s.list} aria-live="polite">
            {items.length === 0 ? (
              <div className={s.intro}>
                <p>{t('intro')}</p>
                <ul className={s.suggestions}>
                  {suggestions.map((q) => (
                    <li key={q}>
                      <button type="button" onClick={() => send(q)}>
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              items.map((it, i) =>
                it.role === 'user' ? (
                  <p key={i} className={s.user}>
                    {it.content}
                  </p>
                ) : (
                  <div key={i} className={s.assistant}>
                    {it.tools?.filter((x) => x.status === 'running').map((x) => (
                      <p key={x.name} className={s.tool}>
                        {x.label}…
                      </p>
                    ))}
                    {it.content ? (
                      <div className={s.md} dangerouslySetInnerHTML={{ __html: renderMarkdown(it.content) }} />
                    ) : busy && i === items.length - 1 && !it.error ? (
                      <p className={s.tool}>{t('thinking')}</p>
                    ) : null}
                    {it.error ? <p className={s.error}>{it.error}</p> : null}
                    {it.timeLimit ? (
                      <div className={s.cta}>
                        {enquirySent ? null : (
                          <Link href={`/${locale}/start-a-project?from=chat`} className={s.ctaPrimary} prefetch={false} onClick={() => setOpen(false)}>
                            {t('sendEnquiry')}
                          </Link>
                        )}
                        <Link
                          href={`/${locale}/book-online`}
                          className={enquirySent ? s.ctaPrimary : s.ctaSecondary}
                          prefetch={false}
                          onClick={() => setOpen(false)}
                        >
                          {t('bookCall')}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ),
              )
            )}
            {enquirySent ? <p className={s.sent}>{t('enquirySent')}</p> : null}
          </div>

          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              className={s.input}
              rows={2}
              maxLength={MAX}
              value={input}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className={s.send} disabled={busy || !input.trim()} aria-label={t('send')}>
              <Send size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>
          <p className={s.disclaimer}>
            {t('disclaimer')} {t('freeTime', { minutes: CHAT_FREE_MINUTES })}
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className={s.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t('close') : t('open')}
      >
        {open ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />}
        <span className={s.toggleLabel}>{open ? t('close') : busy ? t('thinking') : t('open')}</span>
      </button>
    </>
  );
}
