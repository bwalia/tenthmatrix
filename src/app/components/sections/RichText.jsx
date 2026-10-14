// Renders JSON copy. Committed page JSON sometimes carries inline HTML
// (<strong>, <a>, <br>); that markup is trusted repo content, so it is
// rendered as HTML. Plain strings render as text.
const HAS_TAG = /<\/?[a-z][^>]*>/i;

export default function RichText({ text, as: Tag = 'p', className }) {
  if (text == null || text === '') return null;
  const s = String(text);
  if (HAS_TAG.test(s)) {
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: s }} />;
  }
  return <Tag className={className}>{s}</Tag>;
}

/** Paragraph-split long copy on blank lines. */
export function Paragraphs({ text, className }) {
  if (!text) return null;
  return String(text)
    .split(/\n{2,}/)
    .map((p, i) => <RichText key={i} text={p.trim()} className={className} />);
}
