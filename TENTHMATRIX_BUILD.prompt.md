# TenthMatrix — brand split & site build prompt

You are building **TenthMatrix**, a new brand and website in this repo
(`/Users/balinderwalia/projects/tenthmatrix`). TenthMatrix becomes the home for
**AI agents, AI tools, AI applications and software products**, plus the
**blog and technical articles** about them. It is split out of the Workstation
website at `../workstation-website`, which keeps **AI GPU and hardware
solutions** (workstations, GPU clusters, DGX/Mac Studio, the shop).

Done means:
1. A working Next.js site in this repo that runs content the same way
   Workstation does (JSON data layer, OpsAPI CMS overlay, prebuild
   fetch + verify, i18n pipeline, lead capture, sitemap, SEO), with a
   **completely new brand and design**, not a reskin of Workstation.
2. Every software page, blog post and technical article listed in the
   approved migration manifest is live on TenthMatrix, rebranded, with all
   images resolving.
3. `npm run build` and `npm run verify` pass locally. Playwright visual and
   accessibility checks pass in light and dark themes.
4. A short report back (see §9).

Do not change `../workstation-website` until §8. Until then it is read-only
and is your source.

---

## 0. Read first

Read these in full before writing code:

- `../workstation-website/CLAUDE.md`: architecture, data layer, i18n rules,
  OpsAPI env table, quality gates.
- `../workstation-website/package.json`: scripts (`prebuild`, `verify*`,
  `i18n:*`, `sync:articles-locales`).
- `../workstation-website/src/lib/cms.js` and `src/lib/cmsMap.mjs`: CMS
  overlay model (git JSON base + OpsAPI posts on top, timeout fallback).
- `../workstation-website/scripts/fetchBlogs.mjs`, `generateSitemap.mjs`,
  `verify-blog-assets.mjs`, `verify-svg-xml.mjs`, `verify-i18n.mjs`,
  `verify-opsapi-env.mjs`, `sync-articles-locales.mjs`, `scripts/i18n/*`,
  `scripts/lib/*`, `import-blogs-to-cms.mjs`.
- `../workstation-website/src/utils/*` (`loadBlog`, `articlesLocale`,
  `opsapiEnv.mjs`, `loadLocaleData`, `getMessages`), `src/i18n.js`,
  `src/proxy.js`, `src/app/[locale]/layout.js`, `ClientLayout.jsx`.
- `../workstation-website/src/app/[locale]/articles/**`,
  `docs/blogs/**`, `insights/**`, `search/**`, `api/blogs/**`: blog and
  article rendering, tags, pagination, search index, likes and comments.
- `../workstation-website/design/THEME.prompt.md`: copy its **quality bar**
  and token/theme-switching mechanics. Do **not** copy its look.
- `../workstation-website/next.config.mjs`, `Dockerfile.prod`,
  `.github/workflows/build-and-deploy.yaml`, `devops/helm-charts/wsw-chart/`.

## 1. How Workstation works (what to replicate)

| Concern | Workstation implementation | TenthMatrix |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, `output: 'standalone'`, `[locale]` segment | Same |
| Page copy | `src/app/data/en/*.json` per route; other locales generated | Same pattern |
| Blogs | `src/app/data/blogs/*.json` (+ `pages/`, `tags/`, `blogs.json`) and `data/{locale}/blogs/` | Same, filtered to software posts |
| Articles | `src/app/data/{locale}/articles.json` (`data.content[]`, keyed by `code`) | Same, filtered |
| Insights | `src/app/data/en/insights/{articles,benchmarks}` (Jev hub) | Move whole section |
| CMS | OpsAPI `GET {OPSAPI_URL}api/v2/public/cms/{WEBSITE_NAMESPACE}/posts`, overlay on git JSON, ISR tag `cms-posts` | Namespace `tenthmatrix` |
| Leads | Browser POST `{opsapi}/api/v2/public/leads/{NEXT_PUBLIC_LEADS_NAMESPACE}`, base URL resolved per host | Leads namespace `tenthmatrix`; host table re-done for TenthMatrix domains |
| i18n | next-intl, 13 locales, translation memory `scripts/i18n/dict/{locale}.json`, `i18n:build` | Same pipeline; port the dict entries for moved content |
| Gates | `prebuild` = fetchBlogs → sitemap → `verify` (blog assets, SVG XML, opsapi env, theme, i18n) | Same gates, renamed tokens |
| Deploy | Docker image → k3s via Helm (`wsw-chart`), prod static export to S3 | New chart `tm-chart`; same flow |

Port the **infrastructure code** (loaders, CMS layer, scripts, verify gates,
API routes, search index generation) and adapt names. Do **not** port
Workstation's components, SCSS, `ws-theme.css`, Bootstrap look, fonts, icons
or images. Those get rebuilt under the new brand (§3).

Don't port the one-off `scripts/*-publish/` and `*-youtube/` folders. Port
only the shared helpers they use (`scripts/lib`, `upsert_article_all_locales`
or equivalent) so future publishing works the same way.

## 2. Migration manifest (do this before moving anything)

Build `migration/manifest.json` that classifies every route, page-data file,
blog, article and insight in `../workstation-website`:

```json
{ "routes": [{ "path": "/ai-agents", "dest": "tenthmatrix", "reason": "…" }],
  "blogs": [{ "slug": "…", "dest": "tenthmatrix|workstation|both|ask", "reason": "…" }],
  "articles": [], "insights": [], "assets": [] }
```

**Rule:** if the subject is software (agents, models, LLM apps, frameworks,
dev tooling, DevOps/SRE software, security software, databases, our software
products), it goes to TenthMatrix. If the subject is physical compute
(GPUs, workstations, servers, clusters as hardware, Apple Silicon/DGX boxes,
buying or sizing hardware), it stays on Workstation. If both apply, set
`ask`.

Seed classification (verify each against the content; don't trust titles alone):

**→ TenthMatrix routes:** `/ai-agents`, `/agent-building`, `/claude-agents`,
`/openai-agents`, `/grok-bot`, `/ai-automation`, `/generative-ai`,
`/applied-ai`, `/enterprise-ai`, `/ai-solutions`, `/workstation-ai-solutions`,
`/ai-industries`, `/ai-healthcare`, `/ai-financial-services`, `/ai-startups`,
`/ai-upskilling`, `/crm`, `/marketing`, `/jobshout`, `/ring-promoter`,
`/wsl-proxy`, `/wsl-vault`, `/insights/**` (Jev), `/services/**`, `/articles/**`,
`/docs/**` (blogs, APIs, documentation, FAQs), `/news`, `/stories`,
`/video-gallery`, `/search`, and the software half of `/products`.

**Stay on Workstation:** `/ai-workstations`, `/gpu-clusters`,
`/gpu-vs-workstations`, `/ai-labs`, `/private-ai`, `/edge-ai`, `/shop`, the
hardware half of `/products` (`hardwareProducts` in `products.json`).

**`ask` (list them in the report and wait for my answer):** `/mlops-setup`,
`/ai-sme-packages`, `/sysops247`, `/book-online`, `/pricing`, `/partners`,
`/about-us`, `/why-workstation`, `/events`, `/industries`.

**Hardware blogs/articles (stay):** `ai-gpu-workstations-nvidia-dgx-mac-studio`,
`apple-silicon-ai-mac-mini-studio-openclaw`, `apple-silicon-vs-nvidia-gpu-ml`,
`best-nvidia-gpus-ai-training-2026`, `dgx-os-explained-ai-engineers`,
`nvidia-ai-workstations-dgx-thinkstation`,
`unboxing-mac-studio-m4-running-your-first-llm`,
`what-is-deep-learning-workstation-guide`.

**Likely `ask`:** `cloud-vs-onpremise-ai-infrastructure`,
`nvidia-openshell-secure-agents-mac-studio`,
`muse-glimmer-ollama-local-agents-workstation-guide`,
`openclaw-ai-robotics-guide`, `workstation-ai-shop-ring-promoter-int-to-prod`,
`kimi-k3-open-weights-adoption-workstation-guide`,
`claude-opus-5-aws-bedrock-workstation-guide`.

Everything else in `src/app/data/blogs/` (109 files), `data/en/blogs/`
(27), `data/en/articles.json` (63 items) and `data/en/insights/` is
presumed TenthMatrix. Confirm each one.

**Stop after the manifest.** Show me the counts per destination and the full
`ask` list, then wait for my approval before migrating content. You can build
the brand and the empty site shell (§3–§5) while you wait.

## 3. Brand from the ground up

Nothing from Workstation's identity carries over: not the pink/navy palette,
not Poppins/Unbounded/JetBrains Mono, not the datasheet grid, not the logo or
icon. TenthMatrix must look like a separate company.

Use the `ui-ux-pro-max` skill for palette, type pairing and style research.

1. **Concept.** Write `brand/BRAND.md` with positioning ("software that puts
   AI agents to work", or something better), audience (engineering leaders,
   founders, ops teams), voice (direct, technical, British English, no hype
   words: revolutionary, game-changing, seamless, unlock), and three distinct
   visual directions. For each direction give the logo idea, palette, type
   and mood, with a one-paragraph rationale. The name suggests ideas you can
   use: *tenth* (10, the next dimension, a step beyond), *matrix* (grid,
   lattice, tensor, the maths behind neural networks). Recommend one direction
   and build that one. Keep the other two in the doc.
2. **Logo system (hand-written SVG, valid XML):** primary lockup
   (mark + wordmark), stacked lockup, mark only, monochrome light and dark
   variants, favicon set (`favicon.ico`, `icon.svg`, `apple-icon.png`
   180×180, `icon-192/512.png`), and an OG image template (1200×630) that
   renders article titles at build time via `next/og`. The mark has to read
   at 16 px. Files go in `public/brand/`.
3. **Tokens:** `design/tm-theme.css` is canonical. Use a `--tm-*` prefix for
   colour (surface, raised, line, text, muted, accent, accent-contrast,
   success/warn/danger, code bg), type scale, spacing, radius, shadow and
   motion. Define light and dark themes as intentional palettes, not
   inversions. Add `scripts/sync-theme.mjs` + `verify:theme` like Workstation
   does.
4. **Type:** a new pairing via `next/font/google` with `display: swap`: one
   display face, one body face and one mono face for code, specs and eyebrows.
5. **Brand page:** `/brand` (noindex) shows the logo variants, palette with
   contrast ratios, type scale, buttons, cards, code block and article
   typography in both themes. This page doubles as the design review page.

## 4. Design system & layout

- Styling: SCSS modules + the `--tm-*` tokens. **No Bootstrap.** Keep
  `framer-motion` for motion and respect `prefers-reduced-motion`. Use one
  icon set, either inline SVG or `lucide-react`. Font Awesome is out.
- Theme switching: copy the mechanics from Workstation's THEME.prompt.md
  (blocking head script, `localStorage["tm-theme"]` light|dark|system, no
  flash, 44 px toggle with aria-label via next-intl).
- Core components: header with mega-menu (Agents · Tools · Applications ·
  Products · Services · Resources), footer, hero, product card, article card,
  tag pills, article layout (TOC, reading time, code blocks with Prism, share,
  like, comments), docs layout, search (Fuse.js index), contact/lead form,
  cookie consent, 404/error pages.
- Information architecture: group the moved routes under the nav above.
  Keep each moved route's **path unchanged** where it makes sense, so the
  Workstation → TenthMatrix 301 map is a straight host swap. If you rename a
  path, record it in `migration/redirects.json`.
- Homepage: a new narrative, not a port of `dashboard.json`. Cover what
  TenthMatrix builds (agents, tools, apps), featured products (Ring Promoter,
  WSL Proxy, WSL Vault, Jobshout, Jev, Nebula*), latest articles, services,
  a CTA, and a "Need the hardware? → Workstation" cross-link.

## 5. Content migration (after manifest approval)

- Copy approved blog/article/insight JSON, page-data JSON (all locales) and
  every referenced asset under `public/img`, `public/images`,
  `public/insights` and so on. Keep paths so `verify:blog` passes. Drop
  unreferenced assets.
- **Rebrand pass**, scripted and reviewed:
  - "Workstation" as *our company/brand* becomes "TenthMatrix".
  - "workstation" as a *common noun* (GPU workstation, AI workstation) stays.
  - Hardware mentions link to Workstation (`https://www.workstation.co.uk/...`).
  - Product names (WSL Proxy, WSL Vault, Ring Promoter, Jobshout, Jev,
    NebulaDB/DNS/CR/CB, KubePilot) **stay as they are**. Ask me if you think
    one should be renamed.
  - Emails, URLs, schema.org `Organization`, `meta_title`/`meta_description`,
    canonical URLs and OG data get updated.
  - Output a diff summary (`migration/rebrand-report.md`) listing every
    replacement category with counts and 20 sampled before/after lines. I
    review this before it is applied to all locales.
- After rewriting English, follow the i18n workflow from Workstation's
  CLAUDE.md: report the new strings, add translations to the dict, run
  `i18n:build`, run `sync:articles-locales`. Never hand-edit non-English
  locale files.
- Regenerate `pages/`, `tags/`, the search index and the sitemap from the
  migrated set.

## 6. Environment & integrations

```
SITE_URL=https://www.tenthmatrix.com
OPSAPI_URL=                 # server-side, for CMS fetches
WEBSITE_NAMESPACE=tenthmatrix
WEBSITE_CATEGORY=
CMS_CONTENT_MODE=overlay
NEXT_PUBLIC_OPSAPI_URL=
NEXT_PUBLIC_LEADS_NAMESPACE=tenthmatrix
CAPTCHA_SITE_KEY=  API_SECRET=  JWT_SECRET_KEY=  BUSINESS_CODE=
```

- Rebuild `src/utils/opsapiEnv.mjs` + `verify:opsapi` for TenthMatrix hosts
  (`int.tenthmatrix.com`, `test.`, `acc.`, `www.` + apex `tenthmatrix.com`).
  TenthMatrix shares Workstation's OpsAPI instances (`{env-}opsapi.workstation.co.uk`)
  with the `tenthmatrix` namespace.
- **Domain & edge (decided):** `tenthmatrix.com` (Cloudflare zone). Hosts are
  CNAMEd (grey cloud) to the wslproxy edge `lon1.pop0.uk`; vhosts are registered
  on the control plane `cp.pop0.uk` and the `lon1` / `lon2` edges, backend =
  k3s ingress `193.237.176.232:8888` routing by Host to the `tm-frontend`
  service. Prod runs on k3s too (no S3 export needed).
- **No shop.** TenthMatrix has no shop, cart, checkout or `shop/` app. Don't
  port anything from `../workstation-website/shop`, and don't link to it.
  Hardware cross-links go to Workstation's marketing pages, not the shop.
- Seeding the CMS namespace: adapt `import-blogs-to-cms.mjs` and **dry-run
  only**. Writing to the OpsAPI CMS needs my explicit go-ahead.
- No secrets committed. Use `.env.example` only. (Workstation commits `.env`.
  Don't repeat that.)

## 7. Build, quality & deploy

- Scripts mirror Workstation's: `dev` (port 3300), `build`, `prebuild`,
  `verify`, `verify:*`, `i18n:*`, `sync:theme`, `sync:articles-locales`.
- Quality bar: WCAG AA in both themes (axe via Playwright), no horizontal
  overflow at 390 px, LCP image preloaded, no CLS from fonts, valid
  heading order (`verify:headings`), JSON-LD on articles (`BlogPosting`) and
  org (`Organization`), `robots.txt` and `sitemap.xml` correct.
- `scripts/visual/`: Playwright screenshots of every route at 1440 and 390,
  light and dark. Fail on console errors, 404 assets or overflow.
- Write `CLAUDE.md` for this repo in the same style as Workstation's.
- Deploy artefacts: `Dockerfile.prod`, `.github/workflows/build-and-deploy.yaml`,
  `devops/helm-charts/tm-chart/` adapted from `wsw-chart`. Don't run any
  deploy and don't push without my approval.

## 8. Workstation follow-up (separate step, needs my approval)

Prepare this as a branch in `../workstation-website`. Don't merge or deploy it:
- 301 redirects for every moved path → TenthMatrix (from
  `migration/redirects.json`), in `next.config.mjs` and the nginx/S3 redirect
  rules.
- Remove moved routes, data, blogs and articles, and their nav/footer entries.
  Refocus the homepage and nav on AI GPU and hardware solutions.
- Add a "Software & AI agents → TenthMatrix" cross-link in nav and footer.
- Keep `npm run verify` green and regenerate the sitemap.

## 9. Report back

- Manifest counts (tenthmatrix / workstation / both / ask) and the `ask` list.
- Chosen brand direction with logo + palette screenshots and the `/brand` URL.
- Rebrand report summary and anything you were unsure about.
- `verify`/`build`/Playwright results, with failures quoted verbatim.
- Open questions: domain, OpsAPI instance, CMS seeding, Workstation branch.
