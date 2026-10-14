import styles from './LogoWall.module.scss';
import Icon from './Icon';
import { isMappedIcon } from './iconMap';
import { linkProps } from './links';

/**
 * Partner / integration wall. items: [{ name, logo|image, icon, category, href|website }]
 * Logos render monochrome-friendly on a surface tile; items without a logo
 * get a mapped icon or a text tile.
 */
export default function LogoWall({ items, locale, size = 'md' }) {
  const list = (items || []).filter((i) => i && i.name);
  if (!list.length) return null;
  return (
    <ul className={`${styles.wall} ${styles[size] || ''}`}>
      {list.map((it, idx) => {
        const logo = it.logo || it.image;
        const href = it.href || it.website;
        const inner = (
          <>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" loading="lazy" className={styles.logo} />
            ) : (
              it.icon &&
              isMappedIcon(it.icon) && (
                <span className={styles.icon}>
                  <Icon name={it.icon} size={20} />
                </span>
              )
            )}
            <span className={styles.name}>{it.name}</span>
            {it.category && <span className={styles.cat}>{it.category}</span>}
          </>
        );
        return (
          <li key={`${it.name}-${idx}`} className={styles.item}>
            {href ? (
              <a {...linkProps(href, locale)} className={styles.tile}>
                {inner}
              </a>
            ) : (
              <div className={styles.tile}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
