import styles from './LegalDocument.module.scss';
import RichText, { Paragraphs } from './RichText';
import Icon from './Icon';
import { linkProps } from './links';

function slug(s, i) {
  return (
    String(s || `section-${i + 1}`)
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `section-${i + 1}`
  );
}

function linkValue(value, locale) {
  const v = String(value || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { href: `mailto:${v}` };
  if (/^\+?[\d\s()-]{7,}$/.test(v)) return { href: `tel:${v.replace(/[^\d+]/g, '')}` };
  if (/^https?:\/\//.test(v) || v.startsWith('/')) return linkProps(v, locale);
  return null;
}

export function ContactMethods({ methods, locale }) {
  const list = (methods || []).filter((m) => m && m.value);
  if (!list.length) return null;
  return (
    <dl className={styles.methods}>
      {list.map((m, i) => {
        const lp = linkValue(m.value, locale);
        return (
          <div key={i} className={styles.method}>
            <dt>
              {m.icon && <Icon name={m.icon} size={16} />}
              {m.label}
            </dt>
            <dd>{lp ? <a {...lp}>{m.value}</a> : <RichText as="span" text={m.value} />}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function Items({ items }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <ul className={styles.items}>
      {items.map((it, i) => (
        <li key={i}>
          {(typeof it === 'string' || it.title || it.name) && <RichText as="span" text={typeof it === 'string' ? it : it.title || it.name} />}
          {typeof it === 'object' && it.right && <strong>{it.right}</strong>}
          {typeof it === 'object' && it.description && <> — <RichText as="span" text={it.description} /></>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Long-form policy page body: { introduction, sections[], transparency, contact, acknowledgment }.
 * Each section: { id, title, content, items[], subsections[{ subtitle, content, items[], details }] }.
 * Renders a contents list (sticky on desktop) and the prose column. No <h1>: the page hero owns it.
 */
export default function LegalDocument({ data, ui, locale, extraSections = [] }) {
  const sections = [
    ...(data?.introduction ? [{ id: 'introduction', title: data.introduction.title, content: data.introduction.content }] : []),
    ...(data?.sections || []),
    ...extraSections,
  ].filter((s) => s && s.title);
  const contact = data?.contact;
  const ack = data?.acknowledgment;
  const toc = [...sections, ...(contact?.title ? [{ id: 'contact', title: contact.title }] : [])];

  return (
    <div className={styles.doc}>
      {toc.length > 2 && (
        <nav className={styles.toc} aria-label={ui.contents}>
          <p className={styles.tocTitle}>{ui.contents}</p>
          <ol>
            {toc.map((s, i) => (
              <li key={i}>
                <a href={`#${s.id || slug(s.title, i)}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className={styles.body}>
        {sections.map((s, i) => (
          <section key={i} id={s.id || slug(s.title, i)} className={styles.section}>
            <h2 className={styles.h2}>{s.title}</h2>
            {s.content && <Paragraphs text={s.content} />}
            {s.description && <Paragraphs text={s.description} />}
            <Items items={s.items} />
            <Items items={s.rights} />
            <Items items={s.details} />
            <Items items={s.safeguards} />
            {[s.howToExercise, s.contact, s.recommendation, s.disclaimer]
              .filter((t) => typeof t === 'string' && t)
              .map((t, k) => (
                <RichText key={k} text={t} className={styles.details} />
              ))}
            {s.subsections?.map((sub, j) => (
              <div key={j} className={styles.sub}>
                {sub.subtitle && <h3 className={styles.h3}>{sub.subtitle}</h3>}
                {sub.content && <Paragraphs text={sub.content} />}
                <Items items={sub.items} />
                {sub.details && <RichText text={sub.details} className={styles.details} />}
              </div>
            ))}
            {s.resources?.length > 0 && (
              <ul className={styles.resources}>
                {s.resources.map((r, j) => (
                  <li key={j}>
                    {r.link ? <a {...linkProps(r.link, locale)}>{r.name}</a> : <strong>{r.name}</strong>}
                    {r.description && <span>{r.description}</span>}
                  </li>
                ))}
              </ul>
            )}
            {s.children}
          </section>
        ))}
        {contact?.title && (
          <section id="contact" className={`${styles.section} ${styles.contact}`}>
            <h2 className={styles.h2}>{contact.title}</h2>
            {contact.content && <Paragraphs text={contact.content} />}
            {contact.description && <Paragraphs text={contact.description} />}
            <ContactMethods methods={contact.methods} locale={locale} />
          </section>
        )}
        {ack?.content && (
          <aside className={styles.ack}>
            {ack.title && <p className={styles.ackTitle}>{ack.title}</p>}
            <Paragraphs text={ack.content} />
          </aside>
        )}
      </div>
    </div>
  );
}
