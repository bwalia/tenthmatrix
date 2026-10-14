import CodeBlock from '../article/CodeBlock';

/**
 * Typed insight body blocks (src/app/data/{locale}/insights/articles/*.json):
 * h2, h3, p, ul, ol, code, quote, figure, table, callout. Text is plain (no
 * HTML). Unknown types are skipped. Rendered inside .tm-prose.
 */
export default function InsightBody({ blocks = [] }) {
  return blocks.map((b, i) => {
    switch (b.type) {
      case 'h2':
        return (
          <h2 key={i} id={b.id}>
            {b.text}
          </h2>
        );
      case 'h3':
        return (
          <h3 key={i} id={b.id}>
            {b.text}
          </h3>
        );
      case 'p':
        return <p key={i}>{b.text}</p>;
      case 'ul':
        return (
          <ul key={i}>
            {(b.items || []).map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={i}>
            {(b.items || []).map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ol>
        );
      case 'code':
        return <CodeBlock key={i} code={b.text} language={b.lang || (b.text?.includes('async function') ? 'typescript' : undefined)} />;
      case 'quote':
        return (
          <blockquote key={i}>
            <p>{b.text}</p>
            {b.cite ? <cite>{b.cite}</cite> : null}
          </blockquote>
        );
      case 'figure':
        return (
          <figure key={i}>
            <img src={b.src} alt={b.alt || ''} loading="lazy" decoding="async" />
            {b.caption ? <figcaption>{b.caption}</figcaption> : null}
          </figure>
        );
      case 'table':
        return (
          <table key={i}>
            {b.caption ? <caption>{b.caption}</caption> : null}
            <thead>
              <tr>
                {(b.headers || []).map((h, j) => (
                  <th key={j} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(b.rows || []).map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'callout':
        return (
          <aside key={i} className="callout">
            {b.label ? (
              <p>
                <strong>{b.label}</strong>
              </p>
            ) : null}
            <p>{b.text}</p>
          </aside>
        );
      default:
        return null;
    }
  });
}
