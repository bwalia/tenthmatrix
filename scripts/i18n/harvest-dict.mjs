/**
 * Seed the translation memory from translations that already exist.
 *
 * Existing src/app/data/{locale}/*.json files were hand-translated to varying
 * degrees. This walks each of them in lockstep with its English counterpart
 * and records every English string that has a genuinely different translation,
 * so the generated locale data keeps all prior human work.
 *
 * The message catalogs (src/messages/*.json) are harvested the same way: they
 * are the same site copy, keyed differently.
 *
 * Idempotent and additive — an entry already in the dict is never overwritten.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SOURCE_LOCALE, TARGET_LOCALES, SKIP_FILES, walkStrings } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DATA = join(ROOT, 'src', 'app', 'data');
const MSGS = join(ROOT, 'src', 'messages');
const DICT = join(HERE, 'dict');
mkdirSync(DICT, { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const dataFiles = readdirSync(join(DATA, SOURCE_LOCALE))
  .filter((f) => f.endsWith('.json') && !SKIP_FILES.has(f));

/** Collect path -> string for one tree. */
const byPath = (tree) => {
  const m = new Map();
  walkStrings(tree, (v, p) => m.set(p, v));
  return m;
};

let totals = {};
for (const locale of TARGET_LOCALES) {
  const dictPath = join(DICT, `${locale}.json`);
  const dict = existsSync(dictPath) ? readJson(dictPath) : {};
  let added = 0;

  const harvest = (enTree, loTree) => {
    const en = byPath(enTree);
    const lo = byPath(loTree);
    for (const [p, enVal] of en) {
      const loVal = lo.get(p);
      if (typeof loVal !== 'string') continue;
      if (!loVal.trim() || loVal === enVal) continue;   // untranslated
      if (dict[enVal] !== undefined) continue;          // keep first/best win
      dict[enVal] = loVal;
      added++;
    }
  };

  for (const f of dataFiles) {
    const lp = join(DATA, locale, f);
    if (!existsSync(lp)) continue;
    try { harvest(readJson(join(DATA, SOURCE_LOCALE, f)), readJson(lp)); }
    catch (e) { console.warn(`  ! ${locale}/${f}: ${e.message}`); }
  }

  // message catalogs share the same English copy under different keys
  const mp = join(MSGS, `${locale}.json`);
  if (existsSync(mp)) {
    try { harvest(readJson(join(MSGS, `${SOURCE_LOCALE}.json`)), readJson(mp)); }
    catch (e) { console.warn(`  ! messages/${locale}: ${e.message}`); }
  }

  const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(dictPath, JSON.stringify(sorted, null, 2) + '\n');
  totals[locale] = { total: Object.keys(sorted).length, added };
}

console.log('translation memory seeded:');
for (const [l, t] of Object.entries(totals)) console.log(`  ${l}: ${t.total} entries (+${t.added})`);
