import { ArrowRight, Check } from 'lucide-react';
import styles from './FeatureGrid.module.scss';
import Icon from './Icon';
import RichText from './RichText';
import { isMappedIcon } from './iconMap';
import { linkProps, withoutShop } from './links';

/**
 * Grid of feature cards. Normalises the common JSON item shapes:
 * { icon, title|name, description|text|summary, badge|label|tag|eyebrow,
 *   list|capabilities|benefits|features|useCases|highlights|items, href|link, linkLabel|cta }
 * variant: "card" (default) | "plain" (no border, icon + text) | "numbered"
 */
export default function FeatureGrid({
  items,
  locale,
  columns = 3,
  variant = 'card',
  showIcons = true,
  headingLevel = 3,
  listLabel,
  metricLabels,
  showImages = false,
}) {
  const list = withoutShop(items);
  if (!list.length) return null;
  const H = `h${headingLevel}`;
  return (
    <ul className={`${styles.grid} ${styles[`cols${columns}`] || ''} ${styles[variant] || ''}`}>
      {list.map((item, idx) => {
        if (typeof item === 'string') item = { title: item };
        const title = item.title || item.name;
        const body = item.description || item.text || item.summary;
        const badge = item.badge || item.label || item.tag || item.eyebrow || item.industry || item.team;
        const bullets =
          item.list || item.capabilities || item.benefits || item.features || item.useCases || item.highlights || item.points;
        const href = item.href || item.link;
        const linkLabel = item.linkLabel || item.cta;
        const iconName = item.icon;
        return (
          <li key={`${title}-${idx}`} className={`${styles.item} ${showImages && item.image ? styles.withImage : ''}`}>
            {showImages && item.image && (
               
              <img
                src={/^(https?:)?\/\//.test(item.image) || item.image.startsWith('/') ? item.image : `/img/${item.image}`}
                alt=""
                loading="lazy"
                className={styles.image}
              />
            )}
            {variant === 'numbered' ? (
              <span className={styles.num} aria-hidden="true">
                {String(idx + 1).padStart(2, '0')}
              </span>
            ) : (
              showIcons &&
              iconName &&
              isMappedIcon(iconName) && (
                <span className={styles.icon}>
                  <Icon name={iconName} size={22} />
                </span>
              )
            )}
            {badge && <p className={styles.badge}>{badge}</p>}
            {title && (
              <H className={styles.title}>
                {href && !linkLabel ? (
                  <a {...linkProps(href, locale)} className={styles.titleLink}>
                    {title}
                  </a>
                ) : (
                  title
                )}
              </H>
            )}
            {body && <RichText text={body} className={styles.body} />}
            {Array.isArray(bullets) && bullets.length > 0 && (
              <>
                {listLabel && <p className={styles.listLabel}>{listLabel}</p>}
                <ul className={styles.bullets}>
                  {bullets.map((b, i) => (
                    <li key={i}>
                      <Check size={16} strokeWidth={2} aria-hidden="true" />
                      <RichText as="span" text={typeof b === 'string' ? b : b?.title || b?.name} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {item.metrics && typeof item.metrics === 'object' && (
              <dl className={styles.metrics}>
                {Object.entries(item.metrics).map(([k, v]) => (
                  <div key={k}>
                    <dt>{metricLabels?.[k] || k.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {href && linkLabel && (
              <a {...linkProps(href, locale)} className={styles.more}>
                {linkLabel}
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                <span className="tm-visually-hidden">: {title}</span>
              </a>
            )}
            {href && !linkLabel && (
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" className={styles.cornerArrow} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
