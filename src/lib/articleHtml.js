import { stripHtml } from '@/utils/text';

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…' };
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? e);

export function slugify(text = '') {
  return (
    decode(String(text))
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'section'
  );
}

/**
 * Server-side pass over trusted article HTML: gives every <h2>/<h3> a stable
 * id (keeps existing ones) and returns the heading outline for the TOC, so the
 * table of contents and anchor targets exist in the prerendered HTML.
 * Also demotes stray <h1> in content to <h2> (the page owns the only h1).
 */
export function prepareArticleHtml(html = '') {
  const used = new Set();
  const headings = [];
  let out = String(html || '').replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
  out = out.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = '', inner) => {
    const text = decode(stripHtml(inner)).trim();
    if (!text) return match;
    const existing = attrs.match(/\sid\s*=\s*["']([^"']+)["']/i);
    let id = existing ? existing[1] : slugify(text);
    if (!existing) {
      let n = 2;
      const baseId = id;
      while (used.has(id)) id = `${baseId}-${n++}`;
    }
    used.add(id);
    headings.push({ id, text, level: Number(level) });
    return existing ? match : `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });
  return { html: out, headings };
}
