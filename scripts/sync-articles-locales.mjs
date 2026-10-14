#!/usr/bin/env node
/**
 * Upsert missing English articles into every locale articles.json.
 * Does not overwrite existing locale entries (preserves real translations).
 * A locale with no articles.json yet gets one seeded from English.
 *
 * Usage: node scripts/sync-articles-locales.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'src/app/data');

const LOCALES = ['ar', 'bn', 'es', 'fr', 'hi', 'nl', 'pa', 'pt', 'ru', 'th', 'ur', 'zh'];

function loadArticles(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function saveArticles(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const enPath = join(DATA, 'en', 'articles.json');
const rootPath = join(DATA, 'articles.json');
const en = loadArticles(enPath);
const enContent = en?.data?.content || [];
const enByCode = new Map(enContent.map((a) => [a.code, a]));

// Keep root in sync with en (source of truth)
saveArticles(rootPath, en);
console.log(`Synced root articles.json with en (${enContent.length} articles)`);

for (const locale of LOCALES) {
  const path = join(DATA, locale, 'articles.json');
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    saveArticles(path, { ...en, data: { ...(en.data || {}), content: [] } });
    console.log(`${locale}: created articles.json`);
  }
  const data = loadArticles(path);
  if (!data.data) data.data = {};
  if (!Array.isArray(data.data.content)) data.data.content = [];

  const existing = new Set(data.data.content.map((a) => a.code).filter(Boolean));
  let added = 0;

  // Insert missing EN articles at the front in EN order
  const missing = [];
  for (const article of enContent) {
    if (!article?.code || existing.has(article.code)) continue;
    missing.push({ ...article, language_code: locale });
    added += 1;
  }

  if (added > 0) {
    data.data.content = [...missing, ...data.data.content];
    saveArticles(path, data);
  }

  console.log(
    `${locale}: ${data.data.content.length} articles` +
      (added ? ` (+${added} from EN)` : ' (already complete)')
  );
}

console.log('Done. Locale catalogs now include all EN article codes.');
