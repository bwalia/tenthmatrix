import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SOLUTION_ICONS } from './solutionIcons';
import s from './solutions.module.scss';

/**
 * Problem-first cards: the pain in the visitor's words as the heading, then
 * the solution it leads to. Used on the homepage and the Solutions hub.
 *   items: [{ slug, icon, pain, label, body }]
 */
export default function SolutionCards({ items, locale, linkLabel }) {
  return (
    <ul className={s.cards}>
      {items.map((it) => {
        const Icon = SOLUTION_ICONS[it.icon];
        return (
          <li key={it.slug}>
            <Link href={`/${locale}/solutions/${it.slug}`} className={s.card} prefetch={false}>
              <span className={s.cardIcon} aria-hidden="true">
                {Icon ? <Icon size={20} strokeWidth={1.75} /> : null}
              </span>
              <h3 className={s.cardPain}>“{it.pain}”</h3>
              <p className={s.cardBody}>{it.body}</p>
              <span className={s.cardLink}>
                <span>{it.label}</span>
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
                <span className="tm-visually-hidden"> · {linkLabel}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** pages{} + order[] from solutions.json → card items. `label` comes from the eyebrow after "Solutions · ". */
export function solutionCardItems(data) {
  return (data.slugs || []).map((slug) => {
    const p = data.pages[slug];
    return {
      slug,
      icon: p.icon,
      pain: p.pain,
      label: String(p.header.eyebrow).split('·').pop().trim(),
      body: p.header.subtitle,
    };
  });
}
