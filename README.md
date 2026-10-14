# TenthMatrix website

Source for **www.tenthmatrix.com**: AI agents, AI tools, AI applications and
software products, plus the blog and technical articles about them.

Next.js 16 (App Router, standalone) · React 19 · next-intl (13 locales) ·
OpsAPI CMS overlay · Fuse.js search · k3s via Helm.

## Quick start

```bash
nvm use            # Node 24 (>= 20.9 works)
npm install
cp .env.example .env.local   # optional; everything works with no API
npm run dev                  # http://localhost:3300 → /en
```

## Common tasks

| Task | Command |
|---|---|
| Production build (runs fetch → sitemap → verify first) | `npm run build` |
| CI gate without building | `npm run verify` |
| Lint | `npm run lint` |
| One `<h1>` per page (after a build) | `npm run verify:headings` |
| Regenerate locales from English + dict | `npm run i18n:build` |
| Sync article catalogues across locales | `npm run sync:articles-locales` |
| Copy theme tokens from `design/tm-theme.css` | `npm run sync:theme` |
| CMS import (dry run; `-- --apply` to write) | `npm run cms:import` |

## Where things live

- `src/app/[locale]/` — routes (home, articles, docs/blogs, insights, search, contact-us)
- `src/app/data/` — content JSON (committed base layer)
- `src/lib/cms.js` — OpsAPI CMS overlay (namespace `tenthmatrix`)
- `src/utils/opsapiEnv.mjs` — lead-form API host per environment
- `scripts/` — prebuild, verify gates, i18n pipeline, publish helpers
- `devops/` — Helm chart `tm-chart`, Vault seeding, secrets docs
- `.github/` — build/deploy workflows and wslproxy vhost data

Architecture, data model and rules for contributors: **[CLAUDE.md](CLAUDE.md)**.
Secrets: **[devops/VAULT-SECRETS.md](devops/VAULT-SECRETS.md)**. Never commit a `.env`.
