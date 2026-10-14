/**
 * Merge translations that reference a work file by line index.
 *
 * `report.mjs --work <file>` emits one JSON object per English string that
 * still needs translation. Quoting those English strings back verbatim just to
 * key the answer is pure overhead for long paragraphs, so this merger takes
 *
 *   {"i":0,"es":"…","fr":"…", …}
 *
 * and resolves `i` against the work file's line order before handing the rows
 * to the same memory that add-entries.mjs writes.
 *
 *   node scripts/i18n/report.mjs --work crm.json > work.ndjson
 *   node scripts/i18n/merge-indexed.mjs work.ndjson < answers.ndjson
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TARGET_LOCALES } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DICT = join(HERE, 'dict');

const workPath = process.argv[2];
if (!workPath) { console.error('usage: merge-indexed.mjs <work.ndjson> < answers.ndjson'); process.exit(2); }

const work = readFileSync(workPath, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const dicts = Object.fromEntries(TARGET_LOCALES.map((l) => {
  const p = join(DICT, `${l}.json`);
  return [l, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}];
}));

let rows = 0, added = 0, bad = 0;
for (const raw of readFileSync(0, 'utf8').split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('//')) continue;
  let obj;
  try { obj = JSON.parse(line); } catch { bad++; console.error(`bad JSON: ${line.slice(0, 90)}`); continue; }
  const entry = work[obj.i];
  if (typeof obj.i !== 'number' || !entry) { bad++; console.error(`index ${obj.i} not in work file`); continue; }
  rows++;
  for (const l of TARGET_LOCALES) {
    const v = obj[l];
    if (typeof v !== 'string' || !v.trim()) continue;
    dicts[l][entry.en] = v;
    added++;
  }
}
for (const l of TARGET_LOCALES) {
  const sorted = Object.fromEntries(Object.entries(dicts[l]).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(join(DICT, `${l}.json`), JSON.stringify(sorted, null, 2) + '\n');
}
console.log(`merged ${added} translations from ${rows} row(s)${bad ? ` (${bad} bad line(s))` : ''}`);
if (bad) process.exit(1);
