#!/usr/bin/env node
/**
 * §5 content migration: port translation memory from Workstation.
 *
 * For every translatable string in the migrated Workstation page copy
 * (../workstation-website/src/app/data/en/<page>.json), compute the string as it
 * reads here after the rebrand (same rebrandString() as rebrand.mjs). If that
 * string is in this repo's English copy, carry the Workstation translation over,
 * passed through the same rebrand rules (brand names stay Latin in the dicts, so
 * the swap is mechanical). An entry is only written when the mapped translation
 * keeps the English string's HTML tags, {placeholders}, URLs, emails, ** markers
 * and TenthMatrix mentions — otherwise it is dropped and the string stays English
 * (reported by `npm run i18n:report`).
 *
 * Direct hits (an English string here that has an entry in the Workstation dict
 * unchanged — UI messages, shared legal copy) are carried over too.
 * Existing entries in scripts/i18n/dict/{locale}.json are never overwritten.
 *
 * Usage: node scripts/migration/port-dict.mjs [--source ../workstation-website]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TARGET_LOCALES, walkStrings, SKIP_FILES } from '../i18n/config.mjs';
import { rebrandString, NATIVE_PAGE_FILES } from './rebrand.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const argSrc = process.argv.indexOf('--source');
const SRC = path.resolve(ROOT, argSrc > -1 ? process.argv[argSrc + 1] : '../workstation-website');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const RENAME = { 'why-workstation.json': 'why-tenthmatrix.json' };
const BACK = Object.fromEntries(Object.entries(RENAME).map(([a, b]) => [b, a]));

// English strings this repo actually renders.
const enDir = path.join(ROOT, 'src/app/data/en');
const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json') && !SKIP_FILES.has(f));
const finalSet = new Set();
for (const f of enFiles) walkStrings(readJson(path.join(enDir, f)), (v) => finalSet.add(v));
const msgPath = path.join(ROOT, 'src/messages/en.json');
if (fs.existsSync(msgPath)) walkStrings(readJson(msgPath), (v) => finalSet.add(v));

// Workstation source strings (pre-rebrand) with their key, per migrated file.
const pairs = []; // [oldEnglish, key]
for (const f of enFiles) {
  if (NATIVE_PAGE_FILES.has(f)) continue;
  const src = path.join(SRC, 'src/app/data/en', BACK[f] || f);
  if (!fs.existsSync(src)) continue;
  walkStrings(readJson(src), (v, _p, key) => pairs.push([v, key]));
}

const MARKUP = {
  tags: (s) => (s.match(/<\/?[a-z][a-z0-9]*/gi) || []).map((x) => x.toLowerCase()).sort().join(','),
  ph: (s) => (s.match(/\{[^}]*\}/g) || []).sort().join(','),
  urls: (s) => (s.match(/https?:\/\/[^\s"'<)]+/g) || []).sort().join(','),
  emails: (s) => (s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []).map((e) => e.replace(/[.-]+$/, '')).sort().join(','),
  bold: (s) => String((s.match(/\*\*/g) || []).length),
  brand: (s) => String((s.match(/TenthMatrix/gi) || []).length),
};
const compatible = (en, tr) => Object.values(MARKUP).every((sig) => sig(en) === sig(tr));

const summary = [];
for (const l of TARGET_LOCALES) {
  const srcDictPath = path.join(SRC, 'scripts/i18n/dict', `${l}.json`);
  if (!fs.existsSync(srcDictPath)) continue;
  const srcDict = readJson(srcDictPath);
  const dictPath = path.join(ROOT, 'scripts/i18n/dict', `${l}.json`);
  const dict = fs.existsSync(dictPath) ? readJson(dictPath) : {};
  let direct = 0, mapped = 0, dropped = 0;
  // Direct hits first.
  for (const s of finalSet) {
    if (dict[s] !== undefined) continue;
    const t = srcDict[s];
    if (typeof t === 'string' && t.trim() && compatible(s, t)) { dict[s] = t; direct++; }
  }
  // Rebranded strings.
  for (const [oldEn, key] of pairs) {
    const t = srcDict[oldEn];
    if (typeof t !== 'string' || !t.trim()) continue;
    const newEn = rebrandString(oldEn, { key, record: false });
    if (newEn === oldEn || !finalSet.has(newEn) || dict[newEn] !== undefined) continue;
    const newT = rebrandString(t, { key, lang: l, record: false });
    if (compatible(newEn, newT)) { dict[newEn] = newT; mapped++; } else dropped++;
  }
  const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  fs.writeFileSync(dictPath, JSON.stringify(sorted, null, 2) + '\n');
  summary.push(`  ${l}: ${direct} direct + ${mapped} rebrand-mapped entries (${dropped} dropped), ${Object.keys(sorted).length} total`);
}
console.log('Ported translation memory:');
summary.forEach((s) => console.log(s));
