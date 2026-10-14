import { Button } from '@/app/components';
import { localeHref, isExternal, isShopLink } from './links';

/**
 * Design-system Button for JSON hrefs: locale-prefixes internal paths, sends
 * hardware paths to Workstation, drops shop links, opens external in a new tab.
 */
export default function ActionLink({ href, locale, variant = 'primary', size = 'md', block, arrow, children }) {
  if (!href || !children || isShopLink(href)) return null;
  const resolved = localeHref(href, locale);
  const ext = isExternal(resolved) && !/^(mailto|tel):/i.test(resolved);
  return (
    <Button
      href={resolved}
      variant={variant}
      size={size}
      block={block}
      arrow={arrow ?? (ext ? 'external' : variant === 'primary' ? true : undefined)}
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </Button>
  );
}

/** Map JSON CTA objects to Hero `actions` ([{ label, href }]) with resolved hrefs. */
export function heroActions(list, locale) {
  return (list || [])
    .filter((a) => a && a.label && a.href && !isShopLink(a.href))
    .map((a) => ({ ...a, href: localeHref(a.href, locale) }));
}
