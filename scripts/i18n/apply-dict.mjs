/**
 * Generate every locale's copy from English + the translation memory.
 *
 * English is the single source of structure for both halves of the site's
 * copy:
 *   - page data   src/app/data/{locale}/*.json
 *   - UI strings  src/messages/{locale}.json
 *
 * Each target file is a deep clone of its English counterpart with every
 * translatable string replaced by its entry in scripts/i18n/dict/{locale}.json.
 * A string with no entry stays English and is counted as missing (see
 * scripts/i18n/report.mjs) rather than vanishing from the page.
 *
 * Run after editing English copy or adding dictionary entries:  npm run i18n:build
 * Pass --check to fail instead of writing, which is what CI runs to prove the
 * committed locale files really are the generated ones.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  SOURCE_LOCALE, TARGET_LOCALES, SKIP_FILES, FROZEN_MESSAGE_PATHS, mapStrings,
} from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DATA = join(ROOT, 'src', 'app', 'data');
const MSGS = join(ROOT, 'src', 'messages');
const DICT = join(HERE, 'dict');

const CHECK = process.argv.includes('--check');
const stale = [];
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeIfChanged = (p, obj) => {
  const next = JSON.stringify(obj, null, 2) + '\n';
  if (existsSync(p) && readFileSync(p, 'utf8') === next) return 0;
  if (CHECK) { stale.push(relative(ROOT, p)); return 1; }
  writeFileSync(p, next);
  return 1;
};

const dataFiles = readdirSync(join(DATA, SOURCE_LOCALE))
  .filter((f) => f.endsWith('.json') && !SKIP_FILES.has(f));
const enMessages = readJson(join(MSGS, `${SOURCE_LOCALE}.json`));

let wrote = 0;
const summary = [];
for (const locale of TARGET_LOCALES) {
  const dictPath = join(DICT, `${locale}.json`);
  const dict = existsSync(dictPath) ? readJson(dictPath) : {};
  mkdirSync(join(DATA, locale), { recursive: true });

  let hit = 0, miss = 0;
  const translate = (v) => {
    const t = dict[v];
    if (typeof t === 'string' && t.trim()) { hit++; return t; }
    miss++;
    return v;
  };

  for (const f of dataFiles) {
    const out = mapStrings(readJson(join(DATA, SOURCE_LOCALE, f)), translate);
    wrote += writeIfChanged(join(DATA, locale, f), out);
  }

  // UI strings: same memory, plus paths that must stay identical everywhere.
  const msgs = mapStrings(enMessages, (v, path) => (FROZEN_MESSAGE_PATHS.has(path) ? v : translate(v)));
  wrote += writeIfChanged(join(MSGS, `${locale}.json`), msgs);

  const pct = hit + miss ? Math.round((100 * hit) / (hit + miss)) : 100;
  summary.push(`  ${locale}: ${String(pct).padStart(3)}% translated  (${miss} strings still English)`);
}
if (CHECK) {
  if (stale.length) {
    console.error(
      `\n${stale.length} locale file(s) are not what English + the translation memory generate.\n` +
      `Run \`npm run i18n:build\` and commit the result — never hand-edit a generated locale file.\n`
    );
    for (const f of stale.slice(0, 20)) console.error('  • ' + f);
    if (stale.length > 20) console.error(`  … and ${stale.length - 20} more`);
    process.exit(1);
  }
  console.log(`locale data in sync with ${SOURCE_LOCALE} + translation memory (${dataFiles.length + 1} files x ${TARGET_LOCALES.length} locales)`);
} else {
  console.log(`rebuilt ${dataFiles.length} data files + 1 message catalog x ${TARGET_LOCALES.length} locales (${wrote} files written)`);
}
summary.forEach((s) => console.log(s));
