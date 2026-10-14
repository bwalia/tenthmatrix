#!/usr/bin/env node
/**
 * Theme audit: screenshots key routes in light + dark at 1440 and 390, runs
 * axe-core `color-contrast`, and fails on horizontal overflow, console errors,
 * failed same-origin asset requests (404/5xx), or page errors.
 *
 *   node scripts/visual/theme-audit.mjs [options] [routes...]
 *
 *   --base=http://localhost:3300   site origin (default: $AUDIT_BASE or :3300)
 *   --out=<dir>                    screenshot dir (default: ./.theme-audit)
 *   --themes=light,dark            themes to run (also: system)
 *   --widths=1440,390              viewport widths
 *   --full                         full-page screenshots (default: first two screens)
 *   --no-axe                       skip the contrast scan
 *   --lenient-contrast             report contrast violations without failing
 *   --menus                        also capture the open mega-menu (1440) and mobile drawer (390)
 *   --json=<file>                  write the full report as JSON
 *   --routes-file=<file>           newline-separated routes (# comments ok)
 *   --concurrency=<n>              parallel browser contexts (default 2)
 *
 * The theme is chosen by writing localStorage["tm-theme"] in an init script,
 * which runs before any page script, so the blocking head script in
 * src/app/layout.js is exercised exactly as for a returning visitor. The
 * cookie banner is pre-dismissed (localStorage["tm-cookie-consent"]).
 * Default routes include one real article and blog post, read from the data
 * layer so the audit follows the content.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const root = process.cwd();
const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  } catch {
    return null;
  }
};

function defaultRoutes() {
  const routes = ['/en', '/en/articles', '/en/docs/blogs', '/en/insights', '/en/docs', '/en/docs/faqs', '/en/search?q=agent', '/en/contact-us', '/en/brand', '/en/this-page-does-not-exist'];
  const articles = readJson('src/app/data/en/articles.json')?.data?.content || [];
  const article = articles.find((a) => a?.code && !/^__/.test(a.code)) || articles[0];
  if (article?.code) routes.splice(2, 0, `/en/articles/${article.code}`);
  const page1 = readJson('src/app/data/pages/page-1.json');
  const blogs = page1?.blogs || page1?.data || [];
  const blog = (Array.isArray(blogs) ? blogs : []).find((b) => b?.slug && !/^__/.test(b.slug)) || blogs[0];
  if (blog?.slug) routes.splice(4, 0, `/en/docs/blogs/${blog.slug}`);
  const insights = readJson('src/app/data/en/insights/index.json');
  void insights;
  routes.push('/ar');
  return routes;
}

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const base = opt('base', process.env.AUDIT_BASE || 'http://localhost:3300').replace(/\/$/, '');
const outDir = path.resolve(opt('out', '.theme-audit'));
const themes = opt('themes', 'light,dark').split(',').filter(Boolean);
const widths = opt('widths', '1440,390').split(',').map(Number).filter(Boolean);
const routesFile = opt('routes-file', '');
const fileRoutes = routesFile
  ? fs
      .readFileSync(routesFile, 'utf8')
      .split('\n')
      .map((l) => l.replace(/#.*/, '').trim())
      .filter(Boolean)
  : [];
const cliRoutes = [...fileRoutes, ...args.filter((a) => !a.startsWith('--'))];
const targets = cliRoutes.length ? cliRoutes : defaultRoutes();
const concurrency = Math.max(1, Number(opt('concurrency', '2')) || 1);
const fullPage = flag('full');
const runAxe = !flag('no-axe');
const lenientContrast = flag('lenient-contrast');
const captureMenus = flag('menus');
const jsonOut = opt('json', '');

fs.mkdirSync(outDir, { recursive: true });
const slug = (route) => route.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '_') || 'root';

const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /\[HMR\]/i,
  /recaptcha/i,
  // The intentional 404 route logs its own status.
  /status of 404/i,
];

const browser = await chromium.launch();
const report = [];
let failures = 0;

const jobs = [];
for (const route of targets) for (const theme of themes) for (const width of widths) jobs.push({ route, theme, width });

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // Walk the page so whileInView reveals fire, then return to the top.
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

async function runJob({ route, theme, width }) {
  const height = width < 600 ? 844 : 900;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  });
  await context.addInitScript((value) => {
    try {
      window.localStorage.setItem('tm-theme', value);
      window.localStorage.setItem('tm-cookie-consent', 'essential');
    } catch {
      /* storage blocked: the page must still render */
    }
  }, theme);
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const expect404 = /does-not-exist/.test(route);
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    consoleErrors.push(text.slice(0, 300));
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err.message).slice(0, 300)}`));
  page.on('response', (res) => {
    const url = res.url();
    if (!url.startsWith(base) || res.status() < 400) return;
    if (expect404 && res.request().resourceType() === 'document') return;
    failedRequests.push(`${res.status()} ${url.slice(base.length)}`);
  });

  const entry = { route, theme, width, status: null, overflow: null, h1: null, consoleErrors, failedRequests, contrast: [], screenshot: null };
  try {
    const res = await page.goto(base + route, { waitUntil: 'load', timeout: 180000 });
    entry.status = res ? res.status() : null;
    await settle(page);
    entry.appliedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    entry.h1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    // body uses overflow-x: clip, so scrollWidth alone would hide overflow:
    // also measure every element that pokes past the viewport and isn't
    // inside a scroll/clip container or a fixed layer.
    entry.overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = doc.clientWidth;
      let px = Math.max(0, doc.scrollWidth - vw);
      const culprits = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || (r.right <= vw + 1 && r.left >= -1)) continue;
        let skip = false;
        for (let a = el; a && a !== document.body; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') { skip = true; break; }
          if (a !== el && ['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowX)) { skip = true; break; }
        }
        if (skip) continue;
        px = Math.max(px, Math.round(r.right - vw), Math.round(-r.left));
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        culprits.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''} (${Math.round(r.left)}→${Math.round(r.right)})`);
        if (culprits.length >= 5) break;
      }
      return { px, culprits };
    });

    const file = path.join(outDir, `${slug(route)}--${theme}--${width}.png`);
    if (fullPage) {
      await page.screenshot({ path: file, fullPage: true });
    } else {
      await page.setViewportSize({ width, height: height * 2 });
      await page.waitForTimeout(150);
      await page.screenshot({ path: file });
      await page.setViewportSize({ width, height });
    }
    entry.screenshot = file;

    if (runAxe) {
      const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      entry.contrast = axe.violations.flatMap((v) =>
        v.nodes.map((n) => ({ target: n.target.join(' '), summary: (n.any[0] && n.any[0].message) || n.failureSummary }))
      );
    }

    if (captureMenus && route === targets[0]) {
      if (width >= 1080) {
        await page.locator('header button[aria-controls^="tm-mega-"]').first().click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `menu-mega--${theme}--${width}.png`) });
        if (runAxe) {
          const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).include('header').analyze();
          entry.contrast.push(...axe.violations.flatMap((v) => v.nodes.map((n) => ({ target: `[mega] ${n.target.join(' ')}`, summary: n.any[0]?.message }))));
        }
        await page.keyboard.press('Escape');
      } else {
        await page.locator('button[aria-controls="tm-mobile-nav"]').click();
        await page.waitForTimeout(500);
        await page.locator('#tm-mobile-nav button[aria-expanded]').first().click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(outDir, `menu-drawer--${theme}--${width}.png`) });
        if (runAxe) {
          const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).include('#tm-mobile-nav').analyze();
          entry.contrast.push(...axe.violations.flatMap((v) => v.nodes.map((n) => ({ target: `[drawer] ${n.target.join(' ')}`, summary: n.any[0]?.message }))));
        }
        await page.keyboard.press('Escape');
      }
    }
  } catch (err) {
    entry.error = String(err.message || err).slice(0, 300);
  }

  const bad =
    entry.error ||
    (entry.overflow && entry.overflow.px > 1) ||
    consoleErrors.length ||
    failedRequests.length ||
    (!lenientContrast && entry.contrast.length);
  if (bad) failures += 1;
  report.push(entry);

  const tag = bad ? 'FAIL' : 'ok  ';
  console.log(
    `${tag} ${route.padEnd(34)} ${theme.padEnd(5)} ${String(width).padStart(4)}  ` +
      `theme=${entry.appliedTheme || '?'} status=${entry.status} overflow=${entry.overflow ? entry.overflow.px : '?'}px ` +
      `console=${consoleErrors.length} 4xx=${failedRequests.length} contrast=${entry.contrast.length} h1=${entry.h1}` +
      (entry.error ? `  ERROR ${entry.error}` : '')
  );
  if (entry.overflow && entry.overflow.culprits.length) console.log(`       overflow: ${entry.overflow.culprits.join(' | ')}`);
  for (const e of consoleErrors.slice(0, 3)) console.log(`       console: ${e}`);
  for (const e of failedRequests.slice(0, 3)) console.log(`       request: ${e}`);
  for (const c of entry.contrast.slice(0, 6)) console.log(`       contrast: ${c.target} — ${c.summary}`);
  if (entry.contrast.length > 6) console.log(`       contrast: … ${entry.contrast.length - 6} more`);
  await context.close();
}

let next = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (next < jobs.length) await runJob(jobs[next++]);
  })
);
await browser.close();

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
const sum = (fn) => report.filter(fn).length;
console.log(
  `\n${report.length} captures, ${failures} failing. ` +
    `overflow>1px=${sum((e) => e.overflow && e.overflow.px > 1)} ` +
    `consoleErrors=${sum((e) => e.consoleErrors.length)} ` +
    `failedRequests=${sum((e) => e.failedRequests.length)} ` +
    `contrastNodes=${report.reduce((n, e) => n + e.contrast.length, 0)} ` +
    `h1!=1=${sum((e) => e.h1 !== 1)} errors=${sum((e) => e.error)}. Screenshots: ${outDir}`
);
process.exit(failures ? 1 : 0);
