import { externalLinksInNewTab } from './links';

// Renders JSON copy. Committed page JSON sometimes carries inline HTML
// (<strong>, <a>, <br>); that markup is trusted repo content, so it is
// rendered as HTML. Plain strings render as text.
const HAS_TAG = /<\/?[a-z][^>]*>/i;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function RichText({ text, as: Tag = 'p', className }) {
  if (text == null || text === '') return null;
  let s = String(text);
  // Light markdown: **bold** (some legal JSON uses it).
  if (/\*\*[^*]+\*\*/.test(s)) {
    s = (HAS_TAG.test(s) ? s : esc(s)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  if (HAS_TAG.test(s)) {
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: externalLinksInNewTab(s) }} />;
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
