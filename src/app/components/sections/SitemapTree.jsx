import { ChevronRight } from 'lucide-react';
import styles from './SitemapTree.module.scss';
import Icon from './Icon';
import { isMappedIcon } from './iconMap';
import { linkProps, isShopLink } from './links';

function Node({ node, locale, depth }) {
  if (!node || isShopLink(node.url)) return null;
  const kids = (node.children || []).filter((c) => c && !isShopLink(c.url));
  if (kids.length) {
    return (
      <li>
        <details open={depth === 0} className={styles.branch}>
          <summary className={styles.summary}>
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" className={styles.chev} />
            {node.icon && isMappedIcon(node.icon) && <Icon name={node.icon} size={16} />}
            <span>{node.title}</span>
            <span className={styles.count}>{kids.length}</span>
          </summary>
          <ul className={styles.list}>
            {node.url && (
              <li>
                <a {...linkProps(node.url, locale)} className={styles.leaf}>
                  {node.title}
                </a>
              </li>
            )}
            {kids.map((k, i) => (
              <Node key={`${k.title}-${i}`} node={k} locale={locale} depth={depth + 1} />
            ))}
          </ul>
        </details>
      </li>
    );
  }
  return (
    <li>
      <a {...linkProps(node.url, locale)} className={styles.leaf}>
        {node.title}
      </a>
    </li>
  );
}

/** Folder-tree sitemap from [{ title, icon, url?, children[] }]. */
export default function SitemapTree({ tree, locale }) {
  const list = (tree || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <ul className={styles.tree}>
      {list.map((n, i) => (
        <Node key={`${n.title}-${i}`} node={n} locale={locale} depth={0} />
      ))}
    </ul>
  );
}
