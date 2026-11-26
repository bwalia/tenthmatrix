import s from './work.module.scss';

/**
 * Client strip: [{ company }]. Typeset wordmarks, not images: the files in
 * public/img/client-logos are placeholders (a coloured box with the name in
 * Arial), and each real logo needs the client's permission. When approved
 * artwork arrives, add `logoApproved: true` + the file to that client in
 * our-work.json and it renders as an image here.
 */
export default function LogoStrip({ items, label }) {
  const list = (items || []).filter((i) => i?.company);
  if (!list.length) return null;
  return (
    <ul className={s.logos} aria-label={label}>
      {list.map((c) => (
        <li key={c.company} className={s.logoTile}>
          {c.logoApproved && c.logo ? (
            <img src={c.logo} alt={c.company} loading="lazy" className={s.logoImg} />
          ) : (
            <span className={s.wordmark}>{c.shortName || c.company}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
