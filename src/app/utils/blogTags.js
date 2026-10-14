/* global process */
import fs from 'fs';
import path from 'path';

const ACRONYMS = {
  ai: 'AI', llm: 'LLM', api: 'API', devops: 'DevOps', finops: 'FinOps', mlops: 'MLOps',
  sre: 'SRE', iot: 'IoT', gpu: 'GPU', k8s: 'K8s', ci: 'CI', cd: 'CD', ui: 'UI', ux: 'UX',
  aiops: 'AIOps', nlp: 'NLP', saas: 'SaaS', gitops: 'GitOps', nodejs: 'Node.js',
  golang: 'Go', bun: 'Bun.js', njs: 'njs', lua: 'Lua', rust: 'Rust',
};

export function prettifyTag(slug = '') {
  if (ACRONYMS[slug]) return ACRONYMS[slug];
  return slug
    .split('-')
    .map((w) => ACRONYMS[w] || w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Map article cat labels (any locale) onto blog tag slugs when a tag page exists. */
const CAT_TO_TAG = {
  devops: 'devops',
  rust: 'rust',
  go: 'golang',
  golang: 'golang',
  'bun.js': 'bun',
  bun: 'bun',
  lua: 'lua',
  python: 'python',
  njs: 'njs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  architecture: 'architecture',
  performance: 'performance',
  polyglot: 'polyglot',
  benchmarks: 'benchmarks',
  arquitectura: 'architecture',
  architectuur: 'architecture',
  arquitetura: 'architecture',
  rendimiento: 'performance',
  prestaties: 'performance',
  desempenho: 'performance',
};

export function catToTagSlug(catName = '') {
  const key = String(catName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.]/g, '');
  return CAT_TO_TAG[key] || null;
}
const prettify = prettifyTag;

/** Read the tag index files and return the top N tags as [{ slug, label, count }]. */
export function getTopBlogTags(limit = 8) {
  try {
    const dir = path.join(process.cwd(), 'src/app/data/tags');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !/-page-\d+\.json$/.test(f));
    const tags = files
      .map((f) => {
        const slug = f.replace('.json', '');
        let count = 0;
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          count = Array.isArray(data) ? data.length : (data.blogs?.length || 0);
        } catch { /* ignore */ }
        return { slug, label: prettify(slug), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    return tags;
  } catch {
    return [];
  }
}
