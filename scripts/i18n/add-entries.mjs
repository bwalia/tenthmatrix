/**
 * Merge translations into the translation memory.
 *
 * Reads newline-delimited JSON on stdin, one object per English string:
 *   {"en":"Key Benefits","es":"Beneficios clave","fr":"Avantages clés", ...}
 *
 * Only the locales present on a line are written, so a line may cover one
 * language or all twelve. Existing entries are overwritten (last write wins)
 * which makes corrections easy to apply by re-sending a line.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TARGET_LOCALES } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DICT = join(HERE, 'dict');

const input = readFileSync(0, 'utf8');
const dicts = Object.fromEntries(TARGET_LOCALES.map((l) => {
  const p = join(DICT, `${l}.json`);
  return [l, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}];
}));

let lines = 0, added = 0, bad = 0;
for (const raw of input.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('//')) continue;
  let obj;
  try { obj = JSON.parse(line); } catch (e) { bad++; console.error(`bad JSON: ${line.slice(0, 90)}`); continue; }
  const en = obj.en;
  if (typeof en !== 'string' || !en) { bad++; console.error(`missing "en": ${line.slice(0, 90)}`); continue; }
  lines++;
  for (const l of TARGET_LOCALES) {
    const v = obj[l];
    if (typeof v !== 'string' || !v.trim()) continue;
    dicts[l][en] = v;
    added++;
  }
}
for (const l of TARGET_LOCALES) {
  const sorted = Object.fromEntries(Object.entries(dicts[l]).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(join(DICT, `${l}.json`), JSON.stringify(sorted, null, 2) + '\n');
}
console.log(`merged ${added} translations from ${lines} strings${bad ? ` (${bad} bad line(s))` : ''}`);
if (bad) process.exit(1);
