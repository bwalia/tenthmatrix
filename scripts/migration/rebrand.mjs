#!/usr/bin/env node
/**
 * §5 rebrand pass: Workstation (our company/brand) → TenthMatrix in migrated
 * content. Rerunnable; run after copy-content.mjs + content-fixes.mjs.
 *
 *   node scripts/migration/rebrand.mjs            dry run: counts + report only
 *   node scripts/migration/rebrand.mjs --apply    rewrite files + migration/rebrand-report.md
 *   node scripts/migration/rebrand.mjs --apply --en-only
 *
 * Scope
 *   English   data/blogs, data/en/blogs, data/{,en/}articles.json, data/en/insights/**,
 *             data/en/<migrated page>.json, public/data/<migrated>.json
 *   Locales   data/{locale}/blogs, data/{locale}/articles.json (hand/CMS translations,
 *             not generated). Generated locale page data is NOT touched here: it is
 *             rebuilt by `npm run i18n:build` from English + the dict entries that
 *             scripts/migration/port-dict.mjs maps with the same rebrandString().
 *
 * Rules (see migration/rebrand-report.md for counts)
 *   - Brand word: capitalised singular "Workstation" (incl. "Workstation AI",
 *     "Workstation's", "the Workstation team") → "TenthMatrix"; "WORKSTATION" → "TENTHMATRIX";
 *     lowercase brand keywords ("workstation news" …) → "tenthmatrix".
 *   - Common noun kept: lowercase workstation(s), plural "Workstations", and
 *     "<hardware qualifier> Workstation" (AI/GPU/Deep Learning … Workstation).
 *   - Kept on purpose: "Workstation (AI) Shop" (Workstation's store, the subject of the
 *     Ring Promoter case study), "Workstation Solutions Ltd" (legal entity),
 *     "sister company Workstation", "Workstation-grade", identifiers/slugs/paths,
 *     anything inside <pre>/<code>.
 *   - Emails @workstation.co.uk → @tenthmatrix.com.
 *   - URLs: workstation.co.uk / workstation.ai root and moved paths → https://www.tenthmatrix.com/<path>;
 *     paths that stay on Workstation → https://www.workstation.co.uk/<path>;
 *     shop.workstation.co.uk links → https://www.workstation.co.uk/ai-workstations;
 *     infra hosts (status., opsapi., int-shop., *-api …) untouched.
 *   - Relative links to routes/posts that stay on Workstation → absolute Workstation URLs;
 *     /why-workstation → /why-tenthmatrix.
 *   - Blog/article HTML: first plain-text "AI/GPU workstation(s)" → link to Workstation
 *     /ai-workstations, first "GPU cluster(s)" → /gpu-clusters.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const DATA = path.join(ROOT, 'src/app/data');
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const TM = 'https://www.tenthmatrix.com';
const WS = 'https://www.workstation.co.uk';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/manifest.json'), 'utf8'));

/* ---------------- path classification ---------------- */
const KEEP = new Set(['tenthmatrix', 'both']);
const WS_PATHS = new Set(['/shop']);
const TM_PATHS = new Set();
for (const r of manifest.routes) {
  if (!r.path.startsWith('/')) continue;
  if (r.dest === 'workstation') { if (r.path !== '/' && r.path !== '/login') WS_PATHS.add(r.path); }
  else TM_PATHS.add(r.path.replace(/\/\[[^\]]+\].*$/, ''));
}
for (const b of manifest.blogs) (KEEP.has(b.dest) ? TM_PATHS : WS_PATHS).add(`/docs/blogs/${b.slug}`);
for (const a of manifest.articles) (KEEP.has(a.dest) ? TM_PATHS : WS_PATHS).add(`/articles/${a.code}`);
TM_PATHS.add('/why-tenthmatrix');
const LOCALE_RE = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`);

function splitPath(p) {
  const m = p.match(/^([^?#]*)([?#].*)?$/);
  const pathname = m[1] || '';
  const rest = m[2] || '';
  const loc = (pathname.match(LOCALE_RE) || [''])[0];
  const bare = pathname.slice(loc.length).replace(/\/$/, '') || '/';
  return { loc, bare, rest, pathname };
}
const matches = (set, bare) => set.has(bare) || [...set].some((s) => s !== '/' && bare.startsWith(s + '/'));
const WS_ROUTES = () => [...WS_PATHS].filter((s) => !s.startsWith('/docs/') && !s.startsWith('/articles/'));
const isWsPath = (bare) => WS_PATHS.has(bare) || WS_ROUTES().some((s) => bare.startsWith(s + '/'));
const isTmPath = (bare) => bare === '/' || matches(TM_PATHS, bare) || bare === '/why-workstation';

/* ---------------- stats ---------------- */
export const stats = { counts: {}, samples: [], ambiguous: [] };
const bump = (cat, n = 1) => (stats.counts[cat] = (stats.counts[cat] || 0) + n);
let CURRENT = { file: '', key: '', lang: 'en', record: true };
const ambiguous = (what, ctx) => {
  if (!CURRENT.record || CURRENT.lang !== 'en') return;
  stats.ambiguous.push({ file: CURRENT.file, what, ctx: ctx.replace(/\s+/g, ' ').slice(0, 160) });
};
const count = (cat) => { if (CURRENT.record) bump(cat); };

/* ---------------- URL + link rules ---------------- */
function rewriteAbsUrl(url) {
  const m = url.match(/^(https?:)\/\/([^/?#]+)(.*)$/i);
  if (!m) return url;
  const host = m[2].toLowerCase();
  const tail = m[3] || '';
  if (/^(www\.)?workstation\.(co\.uk|ai)$/.test(host)) {
    const { loc, bare, rest, pathname } = splitPath(tail || '/');
    if (!tail || tail === '/' || bare === '/') { count('URL: brand home → tenthmatrix.com'); return TM + (tail.endsWith('/') ? '/' : ''); }
    if (bare === '/why-workstation') { count('URL: moved page → tenthmatrix.com'); return `${TM}${loc}/why-tenthmatrix${rest}`; }
    if (isWsPath(bare)) {
      const out = WS + pathname + rest;
      if (out !== url) count('URL: hardware page → www.workstation.co.uk (normalised)');
      return out;
    }
    if (isTmPath(bare)) { count('URL: moved page → tenthmatrix.com'); return TM + pathname + rest; }
    ambiguous('workstation.co.uk URL with unclassified path (left as is)', url);
    return url;
  }
  if (/^shop\.workstation\.co\.uk$/.test(host)) { count('URL: shop link → Workstation hardware page'); return `${WS}/ai-workstations`; }
  if (/workstation/.test(host)) { count('kept: infra hostname'); }
  return url;
}

function rewriteRelLink(p) {
  if (!p.startsWith('/') || p.startsWith('//')) return p;
  const { loc, bare, rest, pathname } = splitPath(p);
  if (bare === '/why-workstation') { count('link: /why-workstation → /why-tenthmatrix'); return `${loc}/why-tenthmatrix${rest}`; }
  if (isWsPath(bare)) {
    count('link: relative hardware/Workstation route → www.workstation.co.uk');
    return WS + pathname + rest;
  }
  return p;
}

// The Jobshout SEO Analyst case study records a real run against Workstation's site: keep that URL.
function isRecordedRun(s, idx) {
  const win = s.slice(Math.max(0, idx - 120), idx + 200);
  if (/SEO Analyst at|analyse-only pass against/i.test(win) && /workstation\.co\.uk\/?["'<]/.test(s.slice(idx, idx + 200))) {
    count('kept: recorded SEO Analyst run URL');
    ambiguous('URL of a recorded SEO Analyst run against workstation.co.uk (left as is)', win.slice(60, 220));
    return true;
  }
  return false;
}

/* ---------------- word rule ---------------- */
const HW_QUAL = /(?:\b(?:AI|GPU|Learning|Studio|Linux|RTX|DGX|NVIDIA|Science|Desktop|Personal|Ultra|Max|Local|ML|Pro|Mobile|Agentic|Generative|Custom|Lab|Developer|Engineering|Data|Edge|Deep|Enterprise|Apple|Mac|Silicon))\s+$/;
const KEEP_AFTER = [
  [/^ AI Shop/, 'kept: "Workstation AI Shop" (Workstation\'s store, case-study subject)'],
  [/^ Shop/, 'kept: "Workstation Shop" (Workstation\'s store)'],
  [/^ Solutions Ltd/, 'kept: "Workstation Solutions Ltd" (legal entity)'],
  [/^ website repo/, 'kept: "Workstation website repo" (the source repo)'],
  [/^ Service Health Monitor/, 'kept: "Workstation Service Health Monitor" (status.workstation.co.uk)'],
  [/^-grade/, 'kept: "Workstation-grade" (hardware adjective)'],
];
const KEEP_BEFORE = [
  [/sister company\s+$/, 'kept: "sister company Workstation" (cross-link)'],
];
const LOWER_BRAND = /^ (news|updates|videos|help|team)\b/;

function wordRule(s, i, word) {
  const before = s.slice(Math.max(0, i - 40), i);
  const after = s.slice(i + word.length, i + word.length + 40);
  const prev = s[i - 1] || '';
  const next = s[i + word.length] || '';
  // Identifiers / slugs / paths / hostnames.
  if (/[\w/@.\-#=]/.test(prev) && !/[\s>"'(“‘]/.test(prev)) { return word; }
  if (/^[\w]/.test(next)) return word; // e.g. workstation_methodology
  if (next === '-' && !/^-(shaped|measured|grade)\b/.test(after)) return word; // slug-like
  if (next === '.' && /^\.[a-z]/.test(after)) return word; // workstation.agents, hostnames
  if (word === 'Workstations' || word === 'workstations') { count('kept: common noun (workstations)'); return word; }
  if (word === 'workstation') {
    if (LOWER_BRAND.test(after)) { count('brand: lowercase keyword → tenthmatrix'); return 'tenthmatrix'; }
    count('kept: common noun (workstation)');
    return word;
  }
  if (word === 'WORKSTATION') {
    if (/^ AI\b/.test(after)) { count('brand: WORKSTATION AI → TENTHMATRIX'); return '\u0000TENTHMATRIX_AI'; }
    count('brand: WORKSTATION → TENTHMATRIX'); return 'TENTHMATRIX';
  }
  if (word !== 'Workstation') { ambiguous('unusual casing (left as is)', before + word + after); return word; }
  for (const [re, cat] of KEEP_AFTER) if (re.test(after)) { count(cat); return word; }
  for (const [re, cat] of KEEP_BEFORE) if (re.test(before)) { count(cat); return word; }
  if (HW_QUAL.test(before)) { count('kept: common noun ("<hardware> Workstation")'); return word; }
  if (/^ AI\b/.test(after)) { count('brand: "Workstation AI" → TenthMatrix'); return '\u0000TM_AI'; }
  if (/^ Solutions\b/.test(after)) { count('brand: "Workstation Solutions" → TenthMatrix'); return '\u0000TM_SOL'; }
  if (/^['’]s\b/.test(after)) { count('brand: "Workstation\'s" → TenthMatrix\'s'); return 'TenthMatrix'; }
  if (/^ team\b/i.test(after)) { count('brand: "Workstation team" → TenthMatrix team'); return 'TenthMatrix'; }
  if (/\b(at|At)\s+$/.test(before)) { count('brand: "at Workstation" → at TenthMatrix'); return 'TenthMatrix'; }
  count('brand: Workstation → TenthMatrix');
  return 'TenthMatrix';
}

/* ---------------- string transform ---------------- */
// Order matters: protected code, attributes, absolute URLs, emails, bare hosts, words.
const TOKEN = new RegExp([
  '(<pre\\b[\\s\\S]*?<\\/pre>|<code\\b[\\s\\S]*?<\\/code>)',            // 1 code
  '((?:href|src)=)(\\\\?["\'])([^"\'\\\\]*)(\\\\?["\'])',                 // 2-5 attribute
  '(https?:\\/\\/[^\\s"\'<>)\\]\\\\]+)',                                   // 6 absolute URL
  '([\\w.+-]+@workstation\\.(?:co\\.uk|ai))\\b',                           // 7 email
  '\\bwww\\.Workstation Solutions\\/([\\w-]+)',                           // 8 broken legal URL
  '((?:[\\w-]+\\.)*workstation\\.(?:co\\.uk|ai)(?:\\/[^\\s"\'<>)]*)?)',   // 9 bare host
  '(workstations|Workstations|workstation|Workstation|WORKSTATION)',      // 10 word
].join('|'), 'g');

const LINK_KEYS = new Set(['href', 'link', 'url', 'buttonLink', 'articleHref', 'canonical', 'website', 'external', 'watchUrl', 'embedUrl']);
const SKIP_KEYS = new Set(['slug', 'code', 'uuid', 'id', 'source_kind', 'internal_id', 'cover_image', 'image', 'src', 'icon', 'thumbnail', 'hero_image', 'og_image']);

export function rebrandString(s, { file = '', key = '', lang = 'en', record = true } = {}) {
  if (typeof s !== 'string' || !/workstation/i.test(s)) {
    if (typeof s === 'string' && LINK_KEYS.has(key) && s.startsWith('/')) {
      CURRENT = { file, key, lang, record };
      return rewriteRelLink(s);
    }
    return s;
  }
  CURRENT = { file, key, lang, record };
  if (SKIP_KEYS.has(key)) return s;
  if (key === 'username') { if (s === 'workstation-team') { count('author handle → tenthmatrix-team'); return 'tenthmatrix-team'; } return s; }
  if (LINK_KEYS.has(key)) {
    if (/^https?:\/\//.test(s)) return rewriteAbsUrl(s);
    if (s.startsWith('/')) return rewriteRelLink(s);
  }
  let out = '';
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    out += s.slice(last, m.index);
    last = m.index + m[0].length;
    if (m[1]) {
      // Code: hosts, URLs, emails and identifiers stay; prose brand words in diagrams/comments follow the word rule.
      out += m[1].replace(/(https?:\/\/[^\s"'<>]+|[\w.+-]+@[\w.-]+|(?:[\w-]+\.)*workstation\.(?:co\.uk|ai)\S*)|(workstations|Workstations|workstation|Workstation|WORKSTATION)/g, (all, keep, word, off, str) => {
        if (keep) {
          if (/workstation/i.test(keep)) { count('kept: URL/host inside <pre>/<code>'); ambiguous('host/URL inside <pre>/<code> (left as is)', keep); }
          return keep;
        }
        const r = wordRule(str, off, word);
        if (r === word && /^Workstation$/.test(word) && /[@/.\w-]/.test(str[off - 1] || '')) ambiguous('identifier inside <pre>/<code> (left as is)', str.slice(Math.max(0, off - 40), off + 50));
        return r;
      }).replace(/\u0000TM_AI AI/g, 'TenthMatrix').replace(/\u0000TM_SOL Solutions/g, 'TenthMatrix').replace(/\u0000TENTHMATRIX_AI AI/g, 'TENTHMATRIX');
    } else if (m[2]) {
      const v = m[4];
      let nv = v;
      if (/^https?:\/\//i.test(v) && isRecordedRun(s, m.index)) nv = v;
      else if (/^https?:\/\//i.test(v)) nv = rewriteAbsUrl(v);
      else if (v.startsWith('/')) nv = rewriteRelLink(v);
      else if (/^mailto:/i.test(v)) nv = v.replace(/@workstation\.(co\.uk|ai)\b/i, () => { count('email @workstation.co.uk → @tenthmatrix.com'); return '@tenthmatrix.com'; });
      out += m[2] + m[3] + nv + m[5];
    } else if (m[6]) {
      const trail = (m[6].match(/[.,;:!?]+$/) || [''])[0];
      const u = m[6].slice(0, m[6].length - trail.length);
      out += (isRecordedRun(s, m.index) ? u : rewriteAbsUrl(u)) + trail;
    } else if (m[7]) {
      count('email @workstation.co.uk → @tenthmatrix.com');
      out += m[7].replace(/@workstation\.(co\.uk|ai)$/i, '@tenthmatrix.com');
    } else if (m[8]) {
      count('URL: moved page → tenthmatrix.com');
      out += `${TM}/${m[8]}`;
    } else if (m[9]) {
      const host = m[9].split('/')[0].toLowerCase();
      if (/^(www\.)?workstation\.(co\.uk|ai)$/.test(host) && !m[9].includes('/')) {
        count('bare domain → tenthmatrix.com');
        out += host.startsWith('www.') ? 'www.tenthmatrix.com' : 'tenthmatrix.com';
      } else {
        count('kept: infra hostname');
        if (/^(int-)?shop\./.test(host)) ambiguous('bare shop hostname in prose (left as is)', s.slice(Math.max(0, m.index - 60), m.index + 80));
        out += m[9];
      }
    } else if (m[10]) {
      out += wordRule(s, m.index, m[10]);
    }
  }
  out += s.slice(last);
  // Multi-word swaps marked by wordRule.
  out = out
    .replace(/\u0000TM_AI AI/g, 'TenthMatrix')
    .replace(/\u0000TM_SOL Solutions/g, 'TenthMatrix')
    .replace(/\u0000TENTHMATRIX_AI AI/g, 'TENTHMATRIX');
  return out;
}

/* ---------------- hardware cross-links in HTML bodies ---------------- */
const HW_LINKS = [
  [/\b((?:AI |GPU |AI GPU )workstations?)\b/i, `${WS}/ai-workstations`],
  [/\b(GPU clusters?)\b/i, `${WS}/gpu-clusters`],
];
export function linkHardware(html) {
  if (typeof html !== 'string' || !/<p\b/.test(html)) return html;
  let out = html;
  for (const [re, href] of HW_LINKS) {
    if (out.includes(`href="${href}"`)) continue;
    const parts = out.split(/(<[^>]+>)/);
    const stack = [];
    let done = false;
    for (let i = 0; i < parts.length && !done; i++) {
      const part = parts[i];
      if (part.startsWith('<')) {
        const t = part.match(/^<\/?\s*([a-z0-9]+)/i);
        if (!t) continue;
        const tag = t[1].toLowerCase();
        if (/^<\//.test(part)) { const at = stack.lastIndexOf(tag); if (at > -1) stack.length = at; }
        else if (!/\/>$/.test(part) && !['img', 'br', 'hr', 'source', 'input', 'meta', 'link'].includes(tag)) stack.push(tag);
        continue;
      }
      if (stack.some((t) => ['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style', 'figcaption', 'button', 'title'].includes(t))) continue;
      if (!stack.some((t) => ['p', 'li', 'td'].includes(t))) continue;
      const m = part.match(re);
      if (m) {
        parts[i] = part.slice(0, m.index) + `<a href="${href}" target="_blank" rel="noopener">${m[1]}</a>` + part.slice(m.index + m[1].length);
        done = true;
        if (CURRENT.record) {
          bump(`hardware mention → link ${href.replace(WS, 'workstation.co.uk')}`);
          stats.samples.push({ file: CURRENT.file, cat: 'hardware link', before: part.slice(Math.max(0, m.index - 50), m.index + m[1].length + 30), after: parts[i].slice(Math.max(0, m.index - 50), m.index + m[1].length + 130) });
        }
      }
    }
    out = parts.join('');
  }
  return out;
}

/* ---------------- file walking ---------------- */
function mapJson(node, fn, key = '') {
  if (Array.isArray(node)) return node.map((v) => mapJson(v, fn, key));
  if (node && typeof node === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = mapJson(v, fn, k);
    return o;
  }
  return fn(node, key);
}

function processFile(abs, lang, { html = false, apply = false } = {}) {
  const rel = path.relative(ROOT, abs);
  const orig = JSON.parse(fs.readFileSync(abs, 'utf8'));
  let changedStrings = 0;
  const next = mapJson(orig, (v, key) => {
    if (typeof v !== 'string') return v;
    let nv = rebrandString(v, { file: rel, key, lang });
    if (html && key === 'content' && lang === 'en') { CURRENT = { file: rel, key, lang, record: true }; nv = linkHardware(nv); }
    if (nv !== v) {
      changedStrings++;
      if (lang === 'en' && stats.samples.length < 4000) {
        // Keep a short window around the first difference for the report.
        let i = 0; while (i < v.length && v[i] === nv[i]) i++;
        stats.samples.push({ file: rel, key, before: v.slice(Math.max(0, i - 60), i + 80), after: nv.slice(Math.max(0, i - 60), i + 100) });
      }
    }
    return nv;
  });
  if (changedStrings) {
    bump(`files changed (${lang === 'en' ? 'English' : 'locales'})`);
    if (apply) fs.writeFileSync(abs, JSON.stringify(next, null, 2) + '\n');
  }
  return changedStrings;
}

const jsonIn = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f)) : []);
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (p.endsWith('.json')) out.push(p);
  }
  return out;
};

/** English page-data files that came from Workstation (TenthMatrix-native files excluded). */
export const NATIVE_PAGE_FILES = new Set(['home.json', 'contact-us.json', 'articles.json']);
export function englishPageFiles() {
  return jsonIn(path.join(DATA, 'en')).filter((f) => !NATIVE_PAGE_FILES.has(path.basename(f)));
}

function main() {
  const apply = process.argv.includes('--apply');
  const enOnly = process.argv.includes('--en-only');
  // English
  for (const f of [...jsonIn(path.join(DATA, 'blogs')), ...jsonIn(path.join(DATA, 'en/blogs'))]) processFile(f, 'en', { html: true, apply });
  for (const f of [path.join(DATA, 'en/articles.json'), path.join(DATA, 'articles.json')]) processFile(f, 'en', { html: true, apply });
  for (const f of walk(path.join(DATA, 'en/insights'))) processFile(f, 'en', { apply });
  for (const f of englishPageFiles()) processFile(f, 'en', { apply });
  for (const f of jsonIn(path.join(ROOT, 'public/data')).filter((f) => !/(all-meta|search-index)\.json$/.test(f))) processFile(f, 'en', { apply });
  const enCounts = { ...stats.counts };
  // Locales (translated blogs + articles; page data is regenerated by i18n:build)
  const localeStats = {};
  if (!enOnly) {
    const translit = /वर्कस्टेशन|ওয়ার্কস্টেশন|ورک\s?سٹیشن|ورك\s?ستيشن|ਵਰਕਸਟੇਸ਼ਨ|เวิร์กสเตชัน|Воркстейшн|Workstation/g;
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      const before = JSON.stringify(stats.counts);
      const files = [...jsonIn(path.join(DATA, l, 'blogs')), path.join(DATA, l, 'articles.json')].filter(fs.existsSync);
      let changed = 0;
      for (const f of files) changed += processFile(f, l, { apply });
      // After rewriting, count brand tokens still present in non-Latin transliteration.
      let left = 0;
      for (const f of files) {
        const s = fs.readFileSync(f, 'utf8');
        left += (s.match(/वर्कस्टेशन|ওয়ার্কস্টেশন|ਵਰਕਸਟੇਸ਼ਨ|เวิร์กสเตชัน/g) || []).length;
      }
      localeStats[l] = { files: files.length, changedStrings: changed, transliterated: left };
      void before; void translit;
    }
  }
  // A second run over already-rebranded files finds nothing; keep the report of the real pass.
  if (Object.keys(enCounts).some((k) => k.startsWith('files changed'))) writeReport({ apply, enCounts, localeStats });
  else console.log('Nothing left to rebrand in English; migration/rebrand-report.md left as is.');
  console.log(apply ? 'Applied.' : 'Dry run (pass --apply to write).');
  for (const [k, v] of Object.entries(enCounts).sort()) console.log(`  ${String(v).padStart(5)}  ${k}`);
  if (!enOnly) for (const [l, s] of Object.entries(localeStats)) console.log(`  ${l}: ${s.changedStrings} strings changed in ${s.files} files; ${s.transliterated} transliterated tokens left`);
  console.log(`  ambiguous occurrences: ${stats.ambiguous.length}`);
}

function writeReport({ apply, enCounts, localeStats }) {
  const brand = Object.entries(enCounts).filter(([k]) => /^(brand|email|URL|link|bare|author)/.test(k)).sort();
  const kept = Object.entries(enCounts).filter(([k]) => /^kept/.test(k)).sort();
  const hw = Object.entries(enCounts).filter(([k]) => /^hardware/.test(k)).sort();
  const files = Object.entries(enCounts).filter(([k]) => /^files/.test(k));
  // 25 samples spread over kinds of change, distinct files where possible.
  const pool = stats.samples.filter((s) => s.file);
  const kinds = [
    ['hardware link', (s) => s.cat === 'hardware link', 3],
    ['ws link', (s) => !s.cat && /www\.workstation\.co\.uk/.test(s.after) && !/www\.workstation\.co\.uk/.test(s.before), 3],
    ['email', (s) => /@tenthmatrix\.com/.test(s.after), 2],
    ['url', (s) => /www\.tenthmatrix\.com/.test(s.after) && !/@/.test(s.after), 2],
    ['page data', (s) => /data\/en\/[^/]+\.json$/.test(s.file) && !/articles\.json$/.test(s.file), 6],
    ['insights', (s) => /insights\//.test(s.file), 2],
    ['blog/article', () => true, 25],
  ];
  const seen = new Set();
  const picks = [];
  for (const [, pred, n] of kinds) {
    let got = 0;
    const cands = pool.filter(pred);
    const step = Math.max(1, Math.floor(cands.length / (n * 3)));
    for (let i = 0; i < cands.length && got < n && picks.length < 25; i += step) {
      const s = cands[i];
      if (seen.has(s.file + s.key) || picks.includes(s)) continue;
      seen.add(s.file + s.key);
      picks.push(s);
      got++;
    }
  }
  const esc = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const amb = new Map();
  for (const a of stats.ambiguous) {
    const k = `${a.what}||${a.ctx}`;
    if (!amb.has(k)) amb.set(k, { ...a, files: new Set() });
    amb.get(k).files.add(a.file);
  }
  const L = [];
  L.push('# Rebrand report (Workstation → TenthMatrix)', '');
  L.push(`Generated by \`scripts/migration/rebrand.mjs\` (${apply ? 'applied' : 'dry run'}), ${new Date().toISOString().slice(0, 10)}. Rerunnable: \`copy-content → content-fixes → rebrand --apply → port-dict → i18n:build → sync:articles-locales → prebuild\`.`, '');
  L.push('Scope: English blogs (`data/blogs`, `data/en/blogs`), `data/{,en/}articles.json`, `data/en/insights/**`, migrated `data/en/*.json` page copy and `public/data/*.json`. Locale blogs/articles get the same rules (counts at the end); generated locale page data is rebuilt by `i18n:build` from English plus dict entries mapped with the same function.', '');
  L.push('## Replacements (English)', '', '| Category | Count |', '|---|---:|');
  for (const [k, v] of brand) L.push(`| ${esc(k)} | ${v} |`);
  for (const [k, v] of hw) L.push(`| ${esc(k)} | ${v} |`);
  for (const [k, v] of files) L.push(`| ${esc(k)} | ${v} |`);
  L.push('', '## Left unchanged on purpose (English)', '', '| Category | Count |', '|---|---:|');
  for (const [k, v] of kept) L.push(`| ${esc(k)} | ${v} |`);
  L.push('', '## Content fixes applied before the rebrand (scripts/migration/content-fixes.mjs)', '',
    '- `products.json`: removed `hardwareProducts` and the 3 hardware package cards; "AI GPU hardware" and the Boston partner note link to Workstation.',
    '- `news.json`: removed the NVIDIA AI Workstations partnership item. `book-online.json`: removed the shop card. `partners.json`: removed Boston Limited (hardware).',
    '- `faqs.json`: NVIDIA + Apple Silicon categories replaced by one "AI Hardware" FAQ linking to Workstation.',
    '- Blogs `streamlining-devops-kubernetes-operators`, `scalable-ui-flutter-riverpod`, `optimizing-api-performance-node-mysql`: title/sub_title/excerpt/meta written from each post\'s own heading and lead paragraph (all locale copies).',
    '- `video-gallery.json`: 12 thumbnails → `/images/video-placeholder.svg` (new placeholder).', '');
  L.push(`## ${picks.length} sampled before/after lines`, '', '| File | Before | After |', '|---|---|---|');
  for (const s of picks) L.push(`| ${esc(s.file)} | ${esc(s.before)} | ${esc(s.after)} |`);
  L.push('', '## Ambiguous occurrences left unchanged (need a human decision)', '');
  L.push('Grouped by context; first file shown with the number of files that share it.', '', '| What | File | Context |', '|---|---|---|');
  for (const a of [...amb.values()].slice(0, 200)) L.push(`| ${esc(a.what)} | ${esc(a.files.values().next().value)}${a.files.size > 1 ? ` (+${a.files.size - 1})` : ''} | ${esc(a.ctx)} |`);
  if (amb.size > 200) L.push(`| … | | ${amb.size - 200} more |`);
  L.push('', '### Judgement calls applied (review)', '',
    '- **Company claims now under the TenthMatrix name**: `news.json` items "Workstation Opens Brussels Office", "ISO 27001 Certification Achieved", "Workstation Named in Top 50 UK AI Companies", "2025 Year in Review"; `security.json` / `about-us.json` certification and history copy. The rule (brand → TenthMatrix) was applied, but these are facts about the Workstation company; confirm or remove.',
    '- **Legal entity** "Workstation Solutions Ltd" in `terms-of-service.json`, `license.json` etc. left as is. Confirm the contracting entity for TenthMatrix.',
    '- **Ring Promoter shop case study** (`workstation-ai-shop-ring-promoter-int-to-prod`): "Workstation AI Shop" kept (it is Workstation\'s store); shop links point to Workstation `/ai-workstations`; bare `int-shop.`/`shop.` hostnames in the release narrative kept as infra names.',
    '- **SEO Analyst case study**: the run against `https://www.workstation.co.uk/` / `workstation.ai/sitemap.xml` is a record of a real run, so those URLs are kept; the surrounding prose now says TenthMatrix (check it reads correctly).',
    '- **Benchmark enum values** `workstation_methodology` / `workstation_measured` (insights lab) kept as identifiers; their prose labels say TenthMatrix.',
    '- **Infra hosts** kept: `status.workstation.co.uk`, `status.workstation.ai`, `opsapi.workstation.co.uk` family, `hackerone.com/workstation-ai`, the `@workstation/ai-ops` npm scope, Vault paths.', '');
  if (Object.keys(localeStats).length) {
    L.push('## Locales (translated blogs + articles.json)', '', '| Locale | Files | Strings changed | Transliterated brand tokens left |', '|---|---:|---:|---:|');
    for (const [l, s] of Object.entries(localeStats)) L.push(`| ${l} | ${s.files} | ${s.changedStrings} | ${s.transliterated} |`);
    L.push('', 'Transliterated tokens (e.g. Hindi वर्कस्टेशन) are ambiguous between brand and common noun in translated prose; left unchanged.', '');
  }
  fs.writeFileSync(path.join(ROOT, 'migration/rebrand-report.md'), L.join('\n') + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
