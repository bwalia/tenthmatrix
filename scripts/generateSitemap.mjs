/**
 * public/sitemap.xml for https://www.tenthmatrix.com (prebuild step 2).
 *
 * Static routes × 13 locales, then every committed blog, article, insight and
 * blog pagination page. Fixture slugs (`__sample__`) are skipped. Routes are
 * added here as they are built — never list a URL that 404s.
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');
const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];
const isSample = (slug = '') => /^__.*__$/.test(String(slug));

const staticPages = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'articles', changefreq: 'weekly', priority: '0.8' },
  { path: 'docs/blogs', changefreq: 'daily', priority: '0.8' },
  { path: 'insights', changefreq: 'weekly', priority: '0.8' },
  { path: 'contact-us', changefreq: 'monthly', priority: '0.7' },
];

const data = (...p) => path.join(process.cwd(), 'src/app/data', ...p);
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
};
const listJson = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : []);

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = [];
  const push = (p, changefreq, priority, lastmod = today) => {
    for (const locale of LOCALES) {
      urls.push({ loc: `${BASE_URL}/${locale}${p ? `/${p}` : ''}`, lastmod, changefreq, priority });
    }
  };

  for (const page of staticPages) push(page.path, page.changefreq, page.priority);

  for (const file of listJson(data('blogs'))) {
    const slug = file.replace(/\.json$/, '');
    if (isSample(slug)) continue;
    const blog = readJson(data('blogs', file));
    const lastmod = String(blog?.updated_at || blog?.published_date || today).slice(0, 10);
    push(`docs/blogs/${slug}`, 'monthly', '0.6', /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? lastmod : today);
  }

  for (const article of readJson(data('en', 'articles.json'))?.data?.content || []) {
    if (!article?.code || isSample(article.code)) continue;
    push(`articles/${article.code}`, 'monthly', '0.6');
  }

  for (const file of listJson(data('en', 'insights', 'articles'))) {
    const slug = readJson(data('en', 'insights', 'articles', file))?.slug || file.replace(/\.json$/, '');
    if (isSample(slug)) continue;
    push(`insights/${slug}`, 'monthly', '0.6');
  }

  const pageCount = listJson(data('pages')).filter((f) => f.startsWith('page-')).length;
  for (let i = 2; i <= pageCount; i++) push(`docs/blogs/page/${i}`, 'weekly', '0.4');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const outPath = path.join(process.cwd(), 'public/sitemap.xml');
  fs.writeFileSync(outPath, xml);
  console.log(`🗺️  Generated ${path.relative(process.cwd(), outPath)} with ${urls.length} URLs.`);
}

generateSitemap();
