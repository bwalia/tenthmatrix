# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TenthMatrix (www.tenthmatrix.com) is the home for AI agents, AI tools, AI
applications and software products, plus the blog and technical articles about
them. It was split out of the Workstation website (`../workstation-website`,
which keeps GPU and hardware) and runs content the same way: a JSON data layer,
an OpsAPI CMS overlay, a prebuild fetch + verify step, a generated i18n
pipeline, lead capture, sitemap and SEO. Brand and design are new (see
`brand/BRAND.md` and `design/tm-theme.css`); nothing visual is ported from
Workstation. The build brief is `TENTHMATRIX_BUILD.prompt.md`.

Next.js 16 App Router, React 19, `output: 'standalone'`, every page under a
`[locale]` segment (13 locales, next-intl). No Bootstrap, no Font Awesome, no
AOS, no shop.

## Development Commands

```bash
npm run dev            # http://localhost:3300 (port set in package.json)
npm run build          # runs prebuild first: fetchBlogs → generateSitemap → verify
npm start              # next start on 3300 (or: node .next/standalone/server.js)
npm run lint           # eslint . (flat config, eslint-config-next)

npm run verify         # the CI gate without a full build (see Quality gates)
npm run verify:headings   # after a build: every prerendered page has exactly one <h1>

npm run i18n:build     # regenerate every locale from English + the translation memory
npm run i18n:report    # translation coverage per locale
npm run sync:articles-locales   # copy new EN articles into every locale's articles.json
npm run sync:theme     # copy design/tm-theme.css → src/app/styles/tm-theme.css

npm run cms:import     # import committed blogs into the CMS — DRY RUN unless --apply
```

## Quality gates

`npm run verify` (part of `prebuild`, so `npm run build` and CI run it):

1. **`verify:blog`** — every `/img/`, `/images/`, `/insights/`, `/brand/` reference in
   blog JSON (shared + per-locale), `articles.json`, `pages/` and insights JSON
   resolves under `public/`.
2. **`verify:svg`** — every `public/**/*.svg` is well-formed UTF-8 XML (browsers
   refuse to render broken SVGs in `<img>`).
3. **`verify:opsapi`** — the lead form's host → OpsAPI table (below) is exact.
4. **`verify:theme`** — `src/app/styles/tm-theme.css` is byte-identical to
   `design/tm-theme.css`. Fails with an explanation if the canonical file is missing.
5. **`verify:i18n`** — no locale-less page-data reads, every `t('key')` exists in
   `en.json`, catalogs have identical keys, generated locale files match English +
   the dict, and dict entries keep HTML tags / `{placeholders}` / URLs / emails / `**`.
6. **`verify:canonical`** — `src/lib/seoCanonical.json` matches the manifest, every
   manifest blog/article/insight canonicalises to Workstation, no rewritten/new
   page does, and `public/sitemap.xml` lists none of the canonicalised URLs.

## Architecture

### Key files
- `src/app/layout.js` — root `<html>`, token CSS, blocking theme script
  (`localStorage["tm-theme"]` = light | dark | system → `data-theme`), sets
  `lang`/`dir` from the URL. Fonts: TODO (next/font, design phase).
- `src/app/[locale]/layout.js` — validates locale, `setRequestLocale`,
  `NextIntlClientProvider`, header/footer, Organization + WebSite JSON-LD.
  `dynamic = 'force-static'`; data routes opt into ISR with `revalidate`.
- `src/proxy.js` — next-intl middleware (Next 16 name), `localePrefix: 'always'`.
- `src/i18n.js` — next-intl request config. `src/utils/getMessages.js` holds the locale list.
- `src/app/components/` — placeholder, semantic, `tm-`-prefixed markup only. The
  design phase rebuilds these; keep data access out of them.

### Data layer (`src/app/data/`)
- `en/*.json` — page copy per route (`home.json`, `contact-us.json`, …). Read with
  `loadLocaleData(file, locale)` (falls back to English).
- `blogs/<slug>.json` — full blog posts (shared EN); `{locale}/blogs/<slug>.json`
  optional translations (`loadBlog` prefers them).
- `pages/page-N.json`, `tags/<tag>.json`, `tags/<tag>-page-N.json` — **generated**
  by `scripts/fetchBlogs.mjs` from `blogs/` (10 per page). Don't hand-edit.
- `{locale}/articles.json` (+ root `articles.json` mirror) — technical articles,
  `data.content[]` keyed by `code`. `src/utils/articlesLocale.js` merges missing
  EN codes into each locale.
- `en/insights/index.json`, `en/insights/articles/*.json` — the insights hub;
  slugs come from each file's `slug` (`src/utils/loadInsight.js`), optional
  `en/insights/aliases.json` maps old slugs to files.
- `public/data/search-index.json` + `all-meta.json` — **generated** Fuse.js index
  (blogs + articles + insights).
- **Fixtures:** anything with a slug/code like `__sample__` is a placeholder. It
  renders (noindex) but is excluded from the sitemap, search index and CMS
  import. Delete the fixtures once real content is migrated from
  `migration/manifest.json`.

### CMS overlay (`src/lib/cms.js`, `src/lib/cmsMap.mjs`)
Same model as Workstation, namespace **`tenthmatrix`**:
1. Committed JSON is always the base layer.
2. `GET {OPSAPI_URL}api/v2/public/cms/tenthmatrix/posts` is fetched (5 s
   timeout, ISR tag `cms-posts`, `CMS_REVALIDATE_SECONDS`) and merged on top —
   same slug → CMS wins; CMS-only slugs are appended.
3. API down/slow → the git catalogue renders in full.

`CMS_CONTENT_MODE=prefer` restores the legacy either/or. Enabled only when both
`WEBSITE_NAMESPACE` and `OPSAPI_URL` are set. `POST /api/revalidate` (HMAC
`X-Opsapi-Signature-256` with `REVALIDATE_SECRET`) busts `cms-posts`.
`fetchBlogs.mjs` writes CMS posts onto `blogs/` at build and always rebuilds
`pages/`, `tags/` and the search index from disk.

### API routes
- `api/blog-search` — live CMS search (`force-dynamic`); the client falls back to the Fuse index.
- `api/revalidate` — signed OpsAPI webhook → `revalidateTag('cms-posts', { expire: 0 })`.
- `api/blogs/[slug]/like`, `api/blogs/[slug]/comment` — engagement, stored by
  `src/lib/engagement.js` in `ENGAGEMENT_STORE_DIR` (per pod, non-durable;
  TODO move to OpsAPI). Rate-limited, honeypot on comments.

### SEO
- **Cross-domain canonicals (protects www.workstation.co.uk).** Content copied
  and rebranded from Workstation is still published there at the same paths.
  Every TenthMatrix page that is still a copy declares
  `<link rel="canonical" href="https://www.workstation.co.uk/{locale}/…">`, has no
  hreflang (hreflang only counts on canonical URLs), keeps `index,follow`, points
  JSON-LD `url`/`mainEntityOfPage` at Workstation, and is left out of the sitemap.
  Source of truth: `src/lib/seoCanonical.json`, generated from
  `migration/manifest.json` by `npm run seo:canonical`
  (`scripts/migration/build-seo-canonical.mjs`); read it through
  `src/lib/seoCanonical.js` (`seoAlternates`, `workstationCanonical`).
  `pageMetadata`/`createRoute` apply it automatically; hand-written
  `generateMetadata` must use `seoAlternates(route, locale, …)`.
  **Rule:** when a copied page is substantially rewritten, add its route to
  `SELF_CANONICAL` (marketing routes) or `SELF_CANONICAL_CONTENT`
  (blog/article/insight paths) in the build script, re-run `npm run seo:canonical`
  and `npm run sitemap`, and commit — it becomes self-canonical and returns to
  the sitemap. New routes and CMS-only posts (not in the manifest) are
  self-canonical by default; never key the list on "everything".
- `scripts/generateSitemap.mjs` → `public/sitemap.xml` (static routes + every
  blog/article/insight × 13 locales). Add a route there when you build it.
- `src/app/robots.js` — `ROBOTS_DISALLOW_ALL=true` on int/test/acc (Helm).
- JSON-LD builders in `src/app/utils/schemaMarkup.js` (Organization, WebSite,
  BlogPosting, Article, TechArticle, BreadcrumbList), rendered by `<JsonLd>`.
- OG images: `opengraph-image.js` next to blog and article detail pages, sharing
  `src/lib/ogImage.js` (placeholder layout; design phase refines).

### i18n — never hand-edit a non-English locale file
English (`src/app/data/en/*.json`, `src/messages/en.json`) is the source. Other
locales are generated from it plus `scripts/i18n/dict/{locale}.json` by
`npm run i18n:build`. After editing English copy: list new strings
(`node scripts/i18n/report.mjs --work <file>.json`), add translations
(`scripts/i18n/add-entries.mjs` or `merge-indexed.mjs`), run `npm run i18n:build`,
commit the dict and the regenerated files. Articles: after publishing, run
`npm run sync:articles-locales` (or `upsert_article_all_locales` in
`scripts/lib/articles_locales.py`). Use British English in source copy.

### Environment

See `.env.example`. No `.env` is committed (Workstation commits one; don't).

```
SITE_URL=https://www.tenthmatrix.com
OPSAPI_URL=                    # server-side CMS base, trailing slash; in k3s the in-cluster service
WEBSITE_NAMESPACE=tenthmatrix
WEBSITE_CATEGORY=
CMS_CONTENT_MODE=overlay
NEXT_PUBLIC_OPSAPI_URL=        # lead-form fallback for non-env hosts only
NEXT_PUBLIC_LEADS_NAMESPACE=tenthmatrix
CAPTCHA_SITE_KEY=  API_SECRET=  JWT_SECRET_KEY=  BUSINESS_CODE=  OPSAPI_API_KEY=
```

Runtime secrets live in Vault (`vault.workstation.co.uk`, `kv` mount,
`tenthmatrix/<env>/config`) and reach pods through the ExternalSecret — see
`devops/VAULT-SECRETS.md`.

### Environment-specific API URLs (lead form)

`NEXT_PUBLIC_*` values are inlined at build time and one image serves every
environment, so `src/utils/opsapiEnv.mjs` derives the browser-facing OpsAPI base
from the page host. TenthMatrix has its own API hostnames, which proxy to the
same OpsAPI instances Workstation uses:

| Site host | OpsAPI base |
|---|---|
| `int.tenthmatrix.com`, `int-www.…` | `https://int-api.tenthmatrix.com` |
| `test.tenthmatrix.com`, `test-www.…` | `https://test-api.tenthmatrix.com` |
| `acc.tenthmatrix.com`, `acc-www.…` | `https://acc-api.tenthmatrix.com` |
| `www.tenthmatrix.com`, `prod-www.…`, apex | `https://api.tenthmatrix.com` |

Path: `POST /api/v2/public/leads/tenthmatrix`. Other hosts fall back to
`NEXT_PUBLIC_OPSAPI_URL`, then `https://api.tenthmatrix.com`. `npm run verify:opsapi`
asserts the table.

### Deployment
Prod (`www.tenthmatrix.com` + apex) is a **static export on S3**, like
Workstation's prod; int/test/acc run the standalone image on k3s.

- **Prod → S3:** `scripts/deploy-s3.sh` runs `npm run verify`, then
  `scripts/build-static.mjs` (sets `TM_STATIC_EXPORT=1` → `output: 'export'`,
  `trailingSlash`; moves `src/app/api`, `src/proxy.js` and `src/app/robots.js`
  aside for the build and always restores them; writes the prod `robots.txt`
  and a `/` → `/en/` redirect page into `out/`), checks one `<h1>` per page and
  syncs `out/` to bucket **`tenthmatrix-website`** (eu-west-2, website hosting,
  public read; assets cached, HTML `no-cache`). No versioned copies in the
  bucket (they'd be public duplicates). The `deploy-s3` job runs it on every
  push to `main` with secrets `TM_AWS_ACCESS_KEY_ID`/`TM_AWS_SECRET_ACCESS_KEY`
  (IAM user `tm-website-deploy`, write access to this bucket only).
- **What the export can't do:** no API routes, so likes/comments are hidden,
  search uses the prebuilt Fuse index, CMS posts appear only at build time
  (rebuild to publish), and the contact form posts straight to OpsAPI from the
  browser (`api.tenthmatrix.com`). Dynamic blog routes enumerate their params
  from committed JSON only when exporting (`src/lib/staticSlugs.js`); on k3s
  they stay on-demand ISR.
- **OG images** are prerendered (`dynamic = 'force-static'` + locale params).
  The brand fonts are Latin-only, so non-Latin titles fall back to the English
  title (`renderOgImage({ fallbackTitle })`).
- **int/test/acc → k3s:** `Dockerfile.prod` builds one standalone image
  (`tm-frontend`); `deploy-k3s.yaml` deploys int on push, test/acc by dispatch.
  `devops/helm-charts/tm-chart/` (`values-prod.yaml` is unused while prod is on S3).
- **Edge:** Cloudflare CNAMEs (grey cloud → `lon1.pop0.uk`). wslproxy rules in
  `.github/wslproxy/data/`: `tm-website-s3-proxy` (www + apex →
  `http://tenthmatrix-website.s3-website.eu-west-2.amazonaws.com`; plain HTTP
  and HTTPS both answer 200, edge cache 3600 s — same as www.workstation.co.uk) and
  `tm-prod-default` (int/test/acc → k3s ingress `193.237.176.232:8888`). The
  `api.tenthmatrix.com` vhosts are managed outside this repo.
- **tenthmatrix.co.uk** (apex + www) is an alias of prod: same wslproxy rule
  `tm-website-s3-proxy` → same bucket, same vhost settings as the .com hosts
  (Cloudflare CNAME → `lon1.pop0.uk`, created via cp DNS provisioning). Pages
  keep their `https://www.tenthmatrix.com/…` canonicals, so the alias doesn't
  compete in search. The contact form resolves it to `api.tenthmatrix.com`.
- Never run a deploy, push, or `--apply` a CMS import / Vault seed without the
  owner's explicit go-ahead.

## Development Notes

- Prefer `.jsx` for components; class names are `tm-` prefixed.
- Styling: SCSS + `--tm-*` tokens only. Respect `prefers-reduced-motion`.
- Icons: `lucide-react` only.
- Images are served unoptimised (`next.config.mjs`); content images come from JSON.
