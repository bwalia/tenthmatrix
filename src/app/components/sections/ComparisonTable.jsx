import styles from './ComparisonTable.module.scss';
import RichText from './RichText';

/**
 * Responsive table. columns: [{ key, label }]; rows: objects keyed by column.
 * The first column is the row header. `highlight` = key of the column to tint
 * (e.g. the agent workflow column). Rows stack into labelled cards below 600px.
 */
export default function ComparisonTable({ columns, rows, caption, highlight, footer }) {
  const cols = (columns || []).filter((c) => c && c.key);
  const list = (rows || []).filter(Boolean);
  if (!cols.length || !list.length) return null;
  const [first, ...rest] = cols;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={c.key === highlight ? styles.hl : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={i}>
              <th scope="row" data-label={first.label}>
                <RichText as="span" text={r[first.key]} />
              </th>
              {rest.map((c) => (
                <td key={c.key} data-label={c.label} className={c.key === highlight ? styles.hl : undefined}>
                  <RichText as="span" text={r[c.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              {cols.map((c) => (
                <td key={c.key} data-label={c.label}>
                  {footer[c.key] ?? ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
