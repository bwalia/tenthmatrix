import s from './ErrorState.module.scss';

/**
 * Full-page error / 404 state. A 3x3 lattice with one cell missing (404) or a
 * cell in the danger colour (error). Server-safe; actions are passed in.
 * props: code ('404' | '500' …), eyebrow, title (h1), body, actions (node), variant ('missing' | 'error')
 */
export default function ErrorState({ code, eyebrow, title, body, actions, variant = 'missing' }) {
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const missing = variant === 'missing' && i === 4;
    const broken = variant === 'error' && i === 4;
    cells.push(
      <rect
        key={i}
        x={(i % 3) * 8}
        y={10 + Math.floor(i / 3) * 8}
        width="6"
        height="6"
        rx="1"
        className={missing ? s.missing : broken ? s.broken : s.cell}
      />
    );
  }
  return (
    <section className={`tm-error ${s.wrap}`}>
      <div className={s.inner}>
        <svg viewBox="-1 -1 34 34" className={s.glyph} aria-hidden="true">
          {cells}
          <rect x="26" y="0" width="6" height="6" rx="1" className={s.tenth} />
        </svg>
        <div className={s.copy}>
          {code || eyebrow ? (
            <p className={s.eyebrow}>
              {code ? <span className={s.code}>{code}</span> : null}
              {eyebrow}
            </p>
          ) : null}
          <h1 className={s.title}>{title}</h1>
          {body ? <p className={s.body}>{body}</p> : null}
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
