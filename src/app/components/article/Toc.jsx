'use client';

import { useEffect, useState } from 'react';
import s from './Toc.module.scss';

/**
 * Table of contents with scroll-spy. headings: [{ id, text, level }] (h2/h3).
 * props: headings, label (nav aria-label and visible title), variant ('rail' | 'inline')
 */
export default function Toc({ headings = [], label, variant = 'rail' }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    if (!headings.length) return undefined;
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!els.length) return undefined;
    const visible = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const firstVisible = els.find((el) => visible.get(el.id));
        if (firstVisible) {
          setActive(firstVisible.id);
          return;
        }
        // Between headings: the last one above the viewport top wins.
        const above = els.filter((el) => el.getBoundingClientRect().top < 120);
        if (above.length) setActive(above[above.length - 1].id);
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: [0, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const list = (
    <ol className={s.list}>
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? s.sub : undefined}>
          <a href={`#${h.id}`} className={s.link} aria-current={active === h.id ? 'location' : undefined}>
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'inline') {
    return (
      <details className={`tm-toc ${s.inline}`}>
        <summary className={s.summary}>{label}</summary>
        <nav aria-label={label}>{list}</nav>
      </details>
    );
  }
  return (
    <nav className={`tm-toc ${s.rail}`} aria-label={label}>
      <p className={s.title}>{label}</p>
      {list}
    </nav>
  );
}
