#!/usr/bin/env node
/**
 * §5 content migration, step 2: structural content fixes on the copied English
 * data (and the three placeholder-titled blogs in every locale). Runs after
 * copy-content.mjs and before rebrand.mjs. Idempotent.
 *
 *   - Split pages: drop the hardware halves that stay on Workstation
 *     (products.json hardwareProducts + hardware package cards, the NVIDIA
 *     partnership news item, the shop booking card, the Boston hardware partner,
 *     the NVIDIA / Apple Silicon FAQ categories → one cross-link FAQ).
 *   - Placeholder blog titles ("Example Blog Post N") → title/excerpt/meta taken
 *     from each post's own first <h2>/<p> (works per locale, since bodies are
 *     translated).
 *   - Missing /images/video-placeholder.jpg → /images/video-placeholder.svg.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'src/app/data');
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const WS = 'https://www.workstation.co.uk';
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const en = (f) => path.join(DATA, 'en', f);
const log = [];

/* products.json (/products and /workstation-ai-solutions) */
{
  const p = readJson(en('products.json'));
  if (p.hardwareProducts) { delete p.hardwareProducts; log.push('products.json: removed hardwareProducts (stays on Workstation)'); }
  if (Array.isArray(p.content)) {
    const before = p.content.length;
    p.content = p.content.filter((c) => !(c.category === 'hardware' && c.link !== '/ai-sme-packages'));
    if (before !== p.content.length) log.push(`products.json: removed ${before - p.content.length} hardware package cards`);
  }
  if (p.softwareProducts?.items) {
    for (const i of p.softwareProducts.items) {
      if (i.href === '/products#hardware') { i.href = `${WS}/ai-workstations`; log.push('products.json: "AI GPU hardware" → Workstation'); }
    }
  }
  if (p.partnerNote?.href === '/partners/boston') {
    p.partnerNote.href = `${WS}/partners/boston`;
    log.push('products.json: partnerNote → Workstation /partners/boston');
  }
  writeJson(en('products.json'), p);
}

/* news.json: the NVIDIA hardware partnership item stays on Workstation */
{
  const n = readJson(en('news.json'));
  const before = n.content.articles.length;
  n.content.articles = n.content.articles.filter((a) => !/NVIDIA for AI Workstations/i.test(a.title));
  if (before !== n.content.articles.length) log.push('news.json: removed NVIDIA AI Workstations partnership item');
  writeJson(en('news.json'), n);
}

/* book-online.json: TenthMatrix version has no shop option */
{
  const b = readJson(en('book-online.json'));
  const before = b.content.services.length;
  b.content.services = b.content.services.filter((s) => !/shop\.workstation\.co\.uk/.test(s.buttonLink || ''));
  if (before !== b.content.services.length) log.push('book-online.json: removed "Buy AI Workstations" shop card');
  writeJson(en('book-online.json'), b);
}

/* partners.json: software partners only */
{
  const p = readJson(en('partners.json'));
  const before = p.content.length;
  p.content = p.content.filter((c) => !/Hardware/i.test(c.category || ''));
  if (before !== p.content.length) log.push(`partners.json: removed ${before - p.content.length} hardware partner(s) (Boston Limited)`);
  writeJson(en('partners.json'), p);
}

/* faqs.json: NVIDIA / Apple Silicon categories → one cross-link to Workstation */
{
  const f = readJson(en('faqs.json'));
  const hw = (c) => /NVIDIA AI Hardware|Apple Silicon for AI/i.test(c.name);
  if (f.categories.some(hw)) {
    const idx = f.categories.findIndex(hw);
    f.categories = f.categories.filter((c) => !hw(c));
    f.categories.splice(idx, 0, {
      name: 'AI Hardware',
      faqs: [{
        question: 'Where can I get GPU workstations, NVIDIA DGX or Apple Silicon systems for AI?',
        answer: `AI hardware is covered by our sister company Workstation. See <a href="${WS}/ai-workstations">AI workstations</a> and <a href="${WS}/gpu-clusters">GPU clusters</a> for NVIDIA DGX, RTX and Apple Silicon systems. TenthMatrix focuses on the agents, tools and software that run on them.`,
      }],
    });
    f.header.subtitle = f.header.subtitle.replace(', NVIDIA & Apple Silicon AI Hardware', '');
    log.push('faqs.json: replaced NVIDIA + Apple Silicon categories with an AI Hardware cross-link FAQ');
  }
  writeJson(en('faqs.json'), f);
}

/* video-gallery.json: missing thumbnail → SVG placeholder */
{
  const p = en('video-gallery.json');
  const s = fs.readFileSync(p, 'utf8');
  const n = (s.match(/\/images\/video-placeholder\.jpg/g) || []).length;
  if (n) { fs.writeFileSync(p, s.replaceAll('/images/video-placeholder.jpg', '/images/video-placeholder.svg')); log.push(`video-gallery.json: ${n} thumbnails → /images/video-placeholder.svg`); }
}

/* placeholder-titled blogs, every locale copy */
const PLACEHOLDER = ['streamlining-devops-kubernetes-operators', 'scalable-ui-flutter-riverpod', 'optimizing-api-performance-node-mysql'];
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');
for (const slug of PLACEHOLDER) {
  const files = [path.join(DATA, 'blogs', `${slug}.json`), ...LOCALES.map((l) => path.join(DATA, l, 'blogs', `${slug}.json`))];
  for (const file of files.filter((f) => fs.existsSync(f))) {
    const b = readJson(file);
    const h2 = b.content.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    const para = b.content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!h2 || !para) { console.warn(`! cannot derive title for ${path.relative(ROOT, file)}`); continue; }
    const title = text(h2[1]);
    const lede = text(para[1]);
    b.title = title;
    b.sub_title = clip(lede, 160);
    b.excerpt = clip(lede, 300);
    b.meta_title = `${title} | TenthMatrix`;
    b.meta_description = clip(lede, 158);
    writeJson(file, b);
  }
  log.push(`blog ${slug}: title/sub_title/excerpt/meta from content (${files.filter((f) => fs.existsSync(f)).length} files)`);
}

log.forEach((l) => console.log('• ' + l));
