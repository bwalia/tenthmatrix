/**
 * i18n guard rails.
 *
 * Five failure modes have bitten this site before, all silent at runtime:
 *
 *   1. A page reads a locale-less data file (src/app/data/x.json or
 *      /data/x.json in public/) instead of loadLocaleData(x, locale), so it
 *      renders English no matter which language is selected.
 *   2. A t('key') call has no matching entry in one of the message catalogs,
 *      which throws MISSING_MESSAGE during prerender.
 *   3. The locale catalogs drift apart, so a key exists in en.json but not in,
 *      say, th.json.
 *   4. A locale data file is hand-edited or left behind, so it no longer matches
 *      what English + the translation memory generate (scripts/i18n/).
 *   5. A translation-memory entry drops or mangles the machine-facing parts of
 *      its English string — HTML tags, {placeholders}, URLs, emails, **bold**
 *      markers — which breaks rendering or links in that one language.
 *
 * This script fails the build on all five.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execFileSync } from 'child_process';
import { TARGET_LOCALES } from './i18n/config.mjs';

const ROOT = process.cwd();
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const SRC = join(ROOT, 'src');

// Locale-less data reads that are legitimately not page copy.
const DATA_READ_ALLOWLIST = new Set([
  'session.json',        // auth state, not content
  'search-index.json',   // prebuilt search index
  'swagger.json',        // API spec
]);

const errors = [];
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === 'node_modules' || e === '.next') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(e)) out.push(p);
  }
  return out;
};
const files = walk(SRC);

/* ---------- 1. locale-less data reads ---------- */
const LOCALE_DIR = new RegExp(`data/(${LOCALES.join('|')})/`);
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f);
  for (const m of src.matchAll(/['"`](?:[^'"`]*\/)?data\/([a-z0-9][a-z0-9-]*\.json)['"`]/gi)) {
    const line = src.slice(0, m.index).split('\n').length;
    const full = m[0];
    if (LOCALE_DIR.test(full)) continue;               // already locale-scoped
    if (DATA_READ_ALLOWLIST.has(m[1])) continue;
    errors.push(
      `${rel}:${line}  reads locale-less data ${m[1]} — use loadLocaleData('${m[1]}', locale) ` +
      `so the page follows the selected language.`
    );
  }
}

/* ---------- 2 + 3. message catalog integrity ---------- */
const catalogs = {};
for (const l of LOCALES) {
  const p = join(SRC, 'messages', `${l}.json`);
  if (!existsSync(p)) { errors.push(`missing message catalog src/messages/${l}.json`); continue; }
  try { catalogs[l] = JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { errors.push(`src/messages/${l}.json is not valid JSON: ${e.message}`); }
}

const flatten = (obj, prefix = '', out = new Map()) => {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
};
const flat = Object.fromEntries(Object.entries(catalogs).map(([l, m]) => [l, flatten(m)]));

// 3. parity against English
const enKeys = flat.en ? [...flat.en.keys()] : [];
for (const l of LOCALES) {
  if (l === 'en' || !flat[l]) continue;
  const missing = enKeys.filter((k) => !flat[l].has(k));
  const empty = enKeys.filter((k) => flat[l].has(k) && !String(flat[l].get(k) ?? '').trim());
  if (missing.length) errors.push(`${l}.json missing ${missing.length} key(s) present in en.json: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''}`);
  if (empty.length) errors.push(`${l}.json has ${empty.length} empty value(s): ${empty.slice(0, 8).join(', ')}`);
  const extra = [...flat[l].keys()].filter((k) => !flat.en.has(k));
  if (extra.length) errors.push(`${l}.json has ${extra.length} key(s) not in en.json: ${extra.slice(0, 8).join(', ')}`);
}

/* ---------- 2. every t('...') resolves ---------- */
// Resolve the namespace a `t` (or aliased) handle was created with, then check
// each literal key against en.json. Template/dynamic keys are skipped.
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f);
  const handles = new Map(); // handle name -> namespace ('' = root)
  for (const m of src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*([^)]*)\)/g)) {
    const arg = m[2];
    const ns = arg.match(/namespace:\s*['"]([^'"]+)['"]/) || arg.match(/^\s*['"]([^'"]+)['"]\s*$/);
    handles.set(m[1], ns ? ns[1] : '');
  }
  if (!handles.size) continue;
  for (const [handle, ns] of handles) {
    const call = new RegExp(`\\b${handle}\\(\\s*['"]([^'"]+)['"]`, 'g');
    for (const m of src.matchAll(call)) {
      const key = ns ? `${ns}.${m[1]}` : m[1];
      if (flat.en && !flat.en.has(key)) {
        const line = src.slice(0, m.index).split('\n').length;
        errors.push(`${rel}:${line}  ${handle}('${m[1]}') → "${key}" is not defined in en.json`);
      }
    }
  }
}

/* ---------- 4. generated locale data is in sync ---------- */
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts/i18n/apply-dict.mjs'), '--check'], { stdio: 'pipe' });
} catch (e) {
  const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
  errors.push(`locale data is out of sync with English + the translation memory:\n      ${out.split('\n').join('\n      ')}`);
}

/* ---------- 5. translations keep the machine-facing parts of English ---------- */
const MARKUP = {
  'HTML tags': (s) => (s.match(/<\/?[a-z][a-z0-9]*/gi) || []).map((x) => x.toLowerCase()).sort().join(','),
  '{placeholders}': (s) => (s.match(/\{[^}]*\}/g) || []).sort().join(','),
  URLs: (s) => (s.match(/https?:\/\/[^\s"'<)]+/g) || []).sort().join(','),
  // trailing '.'/'-' is sentence punctuation or a case suffix (bn "…co.uk-এ"), not part of the address
  emails: (s) => (s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []).map((e) => e.replace(/[.-]+$/, '')).sort().join(','),
  '** markers': (s) => String((s.match(/\*\*/g) || []).length),
};
for (const l of TARGET_LOCALES) {
  const p = join(ROOT, 'scripts/i18n/dict', `${l}.json`);
  if (!existsSync(p)) continue;
  for (const [en, tr] of Object.entries(JSON.parse(readFileSync(p, 'utf8')))) {
    if (typeof tr !== 'string') continue;
    for (const [what, sig] of Object.entries(MARKUP)) {
      if (sig(en) !== sig(tr)) {
        errors.push(`scripts/i18n/dict/${l}.json: ${what} differ from English in the entry for ${JSON.stringify(en.slice(0, 60))}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`\ni18n verification failed (${errors.length} problem${errors.length > 1 ? 's' : ''}):\n`);
  for (const e of errors) console.error('  • ' + e);
  console.error('');
  process.exit(1);
}
console.log(`i18n OK — ${LOCALES.length} locales, ${enKeys.length} keys each, no locale-less page data reads.`);
