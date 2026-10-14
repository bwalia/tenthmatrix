/* global process */
import fs from 'fs';
import path from 'path';
import { loadLocaleData } from './loadLocaleData';

/**
 * Insights (the Jev hub) live in src/app/data/{locale}/insights/articles/*.json.
 * Unlike Workstation's hard-coded SLUG_TO_FILE map, slugs are discovered from
 * the English files' `slug` field; optional aliases (old slug → file) live in
 * src/app/data/en/insights/aliases.json so migrated URLs keep working.
 */
const enDir = () => path.join(process.cwd(), 'src/app/data/en/insights/articles');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

/** slug → file name, from the English catalogue (+ aliases). */
export function insightSlugMap() {
  const map = {};
  const dir = enDir();
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const slug = readJson(path.join(dir, file))?.slug || file.replace(/\.json$/, '');
      map[slug] = file;
    }
  }
  const aliases = readJson(path.join(process.cwd(), 'src/app/data/en/insights/aliases.json')) || {};
  for (const [alias, file] of Object.entries(aliases)) {
    if (typeof file === 'string' && !map[alias]) map[alias] = file;
  }
  return map;
}

export async function loadInsight(slug, locale = 'en') {
  const file = insightSlugMap()[slug];
  if (!file) return null;
  try {
    return await loadLocaleData(`insights/articles/${file}`, locale);
  } catch {
    return null;
  }
}

/** Listing cards for the insights index, newest first. */
export async function listInsights(locale = 'en') {
  const map = insightSlugMap();
  const files = [...new Set(Object.values(map))];
  const items = [];
  for (const file of files) {
    try {
      const a = await loadLocaleData(`insights/articles/${file}`, locale);
      if (a?.slug) items.push(a);
    } catch {
      /* skip unreadable */
    }
  }
  return items.sort((a, b) => String(b.published_iso || '').localeCompare(String(a.published_iso || '')));
}
