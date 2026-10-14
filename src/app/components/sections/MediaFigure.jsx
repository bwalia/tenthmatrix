import styles from './MediaFigure.module.scss';

/** Diagram / screenshot: { src, alt, caption, width, height }. */
export default function MediaFigure({ media, priority = false, framed = true }) {
  if (!media?.src) return null;
  return (
    <figure className={`${styles.figure} ${framed ? styles.framed : ''}`}>
      <img
        src={media.src}
        alt={media.alt || ''}
        width={media.width || 1600}
        height={media.height || 900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  );
}
