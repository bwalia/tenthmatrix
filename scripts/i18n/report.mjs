/**
 * Report what is still untranslated, and emit work files for filling the gaps.
 *
 *   node scripts/i18n/report.mjs            # coverage summary
 *   node scripts/i18n/report.mjs <locale>   # newline-JSON of missing strings
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SOURCE_LOCALE, TARGET_LOCALES, SKIP_FILES, FROZEN_MESSAGE_PATHS, walkStrings } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DATA = join(ROOT, 'src', 'app', 'data');
const MSGS = join(ROOT, 'src', 'messages');
const DICT = join(HERE, 'dict');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const files = readdirSync(join(DATA, SOURCE_LOCALE))
  .filter((f) => f.endsWith('.json') && !SKIP_FILES.has(f));

// unique English strings, remembering which file each first came from
const strings = new Map();
for (const f of files) {
  walkStrings(readJson(join(DATA, SOURCE_LOCALE, f)), (v) => { if (!strings.has(v)) strings.set(v, f); });
}
walkStrings(readJson(join(MSGS, `${SOURCE_LOCALE}.json`)), (v, path) => {
  if (FROZEN_MESSAGE_PATHS.has(path)) return;
  if (!strings.has(v)) strings.set(v, 'messages.json');
});

// --work <file>: every English string in <file>, with the locales that still
// lack a translation. Feed the answers back through scripts/i18n/add-entries.mjs.
if (process.argv[2] === '--work') {
  const want = process.argv[3];
  const dicts = Object.fromEntries(TARGET_LOCALES.map((l) => {
    const p = join(DICT, `${l}.json`);
    return [l, existsSync(p) ? readJson(p) : {}];
  }));
  const src = want === 'messages.json'
    ? readJson(join(MSGS, `${SOURCE_LOCALE}.json`))
    : readJson(join(DATA, SOURCE_LOCALE, want));
  const seen = new Set();
  const rows = [];
  walkStrings(src, (v, path) => {
    if (want === 'messages.json' && FROZEN_MESSAGE_PATHS.has(path)) return;
    if (seen.has(v)) return;
    seen.add(v);
    const need = TARGET_LOCALES.filter((l) => !(typeof dicts[l][v] === 'string' && dicts[l][v].trim()));
    if (need.length) rows.push({ need, en: v });
  });
  for (const r of rows) console.log(JSON.stringify(r));
  console.error(`${want}: ${rows.length} string(s) need work (of ${seen.size})`);
  process.exit(0);
}

const only = process.argv[2];
if (only) {
  const dict = existsSync(join(DICT, `${only}.json`)) ? readJson(join(DICT, `${only}.json`)) : {};
  const missing = [...strings].filter(([v]) => !(typeof dict[v] === 'string' && dict[v].trim()));
  const wanted = process.argv[3];
  for (const [v, f] of missing) { if (wanted && f !== wanted) continue; console.log(JSON.stringify({ f, s: v })); }
  process.exit(0);
}

console.log(`English source: ${strings.size} unique translatable strings across ${files.length} files\n`);
let worst = [];
for (const locale of TARGET_LOCALES) {
  const dict = existsSync(join(DICT, `${locale}.json`)) ? readJson(join(DICT, `${locale}.json`)) : {};
  const have = [...strings.keys()].filter((v) => typeof dict[v] === 'string' && dict[v].trim()).length;
  const pct = Math.round((100 * have) / strings.size);
  console.log(`  ${locale}: ${String(pct).padStart(3)}%  ${have}/${strings.size}`);
  worst.push([locale, strings.size - have]);
}
console.log(`\nremaining string-translations to write: ${worst.reduce((a, [, n]) => a + n, 0)}`);

// per-file gap for the least covered locale, to plan the work
const byFile = new Map();
for (const [v, f] of strings) byFile.set(f, (byFile.get(f) || 0) + 1);
console.log('\nEnglish strings per file (largest first):');
[...byFile].sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(4)}  ${f}`));
