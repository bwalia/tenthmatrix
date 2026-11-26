import s from './glossary.module.scss';

/**
 * A technical term with its plain-English meaning on hover/focus, linking to
 * the glossary entry. The tip is in the DOM (aria-describedby), so screen
 * readers get it too; no JS needed.
 *   <Term id="approval-gate" tip="The point where a person signs off…" locale="en">approval gate</Term>
 */
export default function Term({ id, tip, locale, children }) {
  const tipId = `tm-term-${id}`;
  return (
    <span className={s.termWrap}>
      <a href={`/${locale}/glossary#${id}`} className={s.termLink} aria-describedby={tipId}>
        {children}
      </a>
      <span role="tooltip" id={tipId} className={s.tip}>
        {tip}
      </span>
    </span>
  );
}
