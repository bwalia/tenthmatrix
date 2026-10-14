'use client';

import { useState } from 'react';
import { Play, ArrowUpRight } from 'lucide-react';
import styles from './VideoGrid.module.scss';

const KNOWN_MISSING = new Set(['/images/video-placeholder.jpg', '/img/video-placeholder.jpg']);

function youTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function embedSrc(v) {
  const id = youTubeId(v.embedUrl || v.watchUrl || v.video);
  if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  const u = v.embedUrl || '';
  return /^https:\/\//.test(u) ? u : null;
}

function thumbFor(v) {
  if (v.thumbnail && !KNOWN_MISSING.has(v.thumbnail)) return v.thumbnail;
  const id = youTubeId(v.embedUrl || v.watchUrl || v.video);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function Video({ v, playLabel, watchLabel, headingLevel }) {
  const [playing, setPlaying] = useState(false);
  const src = embedSrc(v);
  const thumb = thumbFor(v);
  const H = `h${headingLevel}`;
  const watch = v.watchUrl || (youTubeId(v.embedUrl) ? `https://www.youtube.com/watch?v=${youTubeId(v.embedUrl)}` : null);
  return (
    <figure className={styles.video}>
      <div className={styles.frame}>
        {playing && src ? (
          <iframe
            src={src}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            {thumb ? (
               
              <img src={thumb} alt={v.thumbnailAlt || ''} loading="lazy" className={styles.thumb} />
            ) : (
              <div className={styles.placeholder} aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
            )}
            {src && (
              <button type="button" className={styles.play} onClick={() => setPlaying(true)}>
                <Play size={22} strokeWidth={2} aria-hidden="true" />
                <span className="tm-visually-hidden">
                  {playLabel}: {v.title}
                </span>
              </button>
            )}
            {v.duration && <span className={styles.duration}>{v.duration}</span>}
          </>
        )}
      </div>
      <figcaption className={styles.caption}>
        <H className={styles.title}>{v.title}</H>
        {(v.caption || v.description) && <p className={styles.text}>{v.caption || v.description}</p>}
        <span className={styles.links}>
          {watch && watchLabel && (
            <a href={watch} target="_blank" rel="noopener noreferrer">
              {watchLabel}
              <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
              <span className="tm-visually-hidden">: {v.title}</span>
            </a>
          )}
          {v.productUrl && v.productLabel && (
            <a href={v.productUrl} target="_blank" rel="noopener noreferrer">
              {v.productLabel}
              <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
            </a>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/** Click-to-load video cards (no third-party requests until the user plays). */
export default function VideoGrid({ videos, columns = 2, playLabel = 'Play video', watchLabel, headingLevel = 3 }) {
  const list = (videos || []).filter((v) => v && v.title);
  if (!list.length) return null;
  return (
    <ul className={`${styles.grid} ${styles[`cols${Math.min(columns, list.length)}`] || ''}`}>
      {list.map((v, i) => (
        <li key={`${v.title}-${i}`}>
          <Video v={v} playLabel={playLabel} watchLabel={watchLabel} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
