import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import s from './InsightExtras.module.scss';

const localise = (href, locale) => (href?.startsWith('/') ? `/${locale}${href}` : href);

export function Takeaways({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <section className={s.takeaways} aria-labelledby="tm-takeaways">
      <h2 id="tm-takeaways" className={s.boxTitle}>
        {title}
      </h2>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

/** Sources, FAQs and related links under an insight. */
export function InsightFooter({ locale, labels, sources = [], faqs = [], related = [] }) {
  return (
    <div className={s.footer}>
      {faqs.length ? (
        <section aria-labelledby="tm-faqs" className={s.block}>
          <h2 id="tm-faqs" className={s.blockTitle}>
            {labels.faqs}
          </h2>
          <div className={s.faqs}>
            {faqs.map((f, i) => (
              <details key={i} className={s.faq}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
      {sources.length ? (
        <section aria-labelledby="tm-sources" className={s.block}>
          <h2 id="tm-sources" className={s.blockTitle}>
            {labels.sources}
          </h2>
          <ol className={s.sources}>
            {sources.map((src, i) => (
              <li key={i}>
                <a href={src.url} rel="noopener noreferrer" target="_blank">
                  {src.title}
                  <ArrowUpRight aria-hidden="true" size={14} />
                </a>
                {src.note ? <span className={s.note}>{src.note}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {related.length ? (
        <nav aria-labelledby="tm-related-links" className={s.block}>
          <h2 id="tm-related-links" className={s.blockTitle}>
            {labels.related}
          </h2>
          <ul className={s.related}>
            {related.map((r) => (
              <li key={r.href}>
                <Link href={localise(r.href, locale)} prefetch={false}>
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
