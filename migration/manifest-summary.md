# Migration manifest: summary

Source: `../workstation-website` (read-only), generated 2026-10-14. Full data: `manifest.json`; 301 map: `redirects.json`.

Destinations: **tenthmatrix** = move and 301; **workstation** = stays; **both** = each site keeps its own version or a split of the content (no redirect); **ask** = needs your decision.

## Counts per destination

| Category | tenthmatrix | workstation | both | ask | total |
|---|---:|---:|---:|---:|---:|
| routes | 49 | 9 | 15 | 17 | 90 |
| pageData | 47 | 10 | 29 | 25 | 111 |
| blogs | 94 | 7 | 0 | 8 | 109 |
| articles | 56 | 2 | 0 | 5 | 63 |
| insights | 14 | 0 | 0 | 0 | 14 |
| assets | 199 | 4 | 3 | 16 | 222 |

- routes = 87 `[locale]` page routes, 2 API routes (`/api/blog-search`, `/api/revalidate`) and the separate `shop/` app (workstation).
- blogs = 109 unique slugs: 109 in `data/blogs/` and 27 in `data/en/blogs/`. **All 27 en/blogs slugs also exist in data/blogs/** (no en-only posts).
- articles = 63 items in `data/en/articles.json` (`data/articles.json` holds the same 63 codes). 40 articles are long-form companions of a blog with the same slug; every companion pair got the same destination.
- pageData counts include `data/en/*.json`, `data/en/insights/{index,benchmarks/lab,articles/jev-hub}.json`, legacy top-level `data/*.json` and `public/data/*.json`. Each file takes its route's destination, so ask routes make their page files ask too.
- assets = 222 distinct local media paths referenced by content/page JSON. 4 are referenced only by workstation items. Asset dest "ask" follows the ask items that reference them.
- redirects.json = 211 entries: 1 locale-pattern rule, plus TenthMatrix routes, blog URLs (`/docs/blogs/<slug>`), article URLs (`/articles/<code>`) and insight slugs (including the aliases `jev-system-one`, `jev-agent-harness` and `jev-benchmarks`). Ask and both items are left out until you decide.

## Ask list (your decision needed)

| Item | Title / subject | Why it is ambiguous | Recommendation |
|---|---|---|---|
| route `/about-us` | about-us.json | Seed ask. Copy is "Workstation AI ... AI Vibe Coding / app development" (software) but it is the company page both brands need | both: each brand writes its own; reuse the vibe-coding/software copy for TenthMatrix |
| route `/ai-financial-services` | ai-financial-services.json | Seed says TenthMatrix but content is "AI Workstations for Financial Services": on-prem GPU infrastructure (hw terms 41 vs sw 6) | workstation (hardware page); TenthMatrix gets a new software-led industry page later if wanted |
| route `/ai-healthcare` | ai-healthcare.json | Seed says TenthMatrix but content is "AI Workstations for Healthcare & Research": GPU workstations for imaging/genomics (hw 39 vs sw 9) | workstation; the healthcare agents blog/article already covers the software angle for TenthMatrix |
| route `/ai-industries` | ai-industries.json | Seed says TenthMatrix but content is "AI Workstations for Every Industry": GPU-accelerated hardware configs (hw 77 vs sw 13) | workstation |
| route `/ai-sme-packages` | ai-sme-packages.json | Seed ask. Packages bundle hardware + software (Generative AI / Agents / OpenClaw packages, hw 52 vs sw 49) | workstation (hardware bundles); TenthMatrix links to it |
| route `/ai-startups` | ai-startups.json | Seed says TenthMatrix but content is "AI Infrastructure for Startups": Mac Mini to GPU clusters, cloud vs owned hardware (hw 50 vs sw 20) | workstation |
| route `/book-online` | book-online.json | Seed ask. Consultation booking (AI consultancy, cyber, DevOps, software scoping) that also links to buying workstations from the shop | both: TenthMatrix version without the shop option |
| route `/events/cybersecurity-and-devops-summit` | cybersecurity-devops-summit.json | Seed /events ask. Cybersecurity & DevOps summit (zero trust, DevSecOps, k8s security) — software subject | tenthmatrix |
| route `/events/financial-services-data-expo` | financial-services-data-expo.json | Seed /events ask. AI/ML/data solutions for banking & fintech — software subject | tenthmatrix |
| route `/events/healthcare-data-science-workshop` | healthcare-data-science-workshop.json | Seed /events ask. Medical imaging AI, genomics, clinical NLP training — software subject | tenthmatrix |
| route `/industries` | industries.json | Seed ask. "Industry-specific AI and DevOps solutions" (sw 28 vs hw 1) — reads as software | tenthmatrix |
| route `/mlops-setup` | mlops-setup.json | Seed ask. "MLOps Infrastructure on AI Workstations": MLflow/Kubeflow/DVC software framed on local GPU hardware | workstation (framed on local GPU workstations); TenthMatrix has the Kubeflow + Argo CD MLOps content |
| route `/partners` | partners.json | Seed ask. Partners page mixes software alliances (OpenAI etc.) with hardware partners | both: software alliances on TenthMatrix, hardware partners on Workstation |
| route `/partners/boston` | partners-boston.json | Boston Limited partnership: Workstation software + Boston enterprise AI hardware (hw 24 / sw 19) | workstation (hardware partner) |
| route `/pricing` | pricing.json | Seed ask. SaaS plans ("Starter $99/month ... AI automation", hw 0) — reads as software | tenthmatrix (SaaS plans) |
| route `/sysops247` | sysops247.json | Seed ask. SysOps 24/7 is a self-hostable monitoring product with AI incident summaries — reads as our software | tenthmatrix (our software product) |
| route `/why-workstation` | why-workstation.json | Seed ask. Content is "AI Vibe Coding — build apps 10x faster with Cursor" (software), but the path is Workstation-branded | tenthmatrix content as /why-tenthmatrix (record rename in redirects.json); Workstation writes a new hardware "why" page |
| blog `claude-opus-5-aws-bedrock-workstation-guide` | Claude Opus 5 on AWS: Workstation Guide for Builders & Business | Claude Opus 5 on Bedrock/Claude Platform (pure cloud software); "workstation" in slug is the brand. | tenthmatrix |
| blog `cloud-vs-onpremise-ai-infrastructure` | Cloud vs On-Premise AI: Which Infrastructure Is Right for You? | Infrastructure decision: cloud GPUs vs owned DGX/H100 hardware with cost model (gpu x14, hardware x10). | workstation |
| blog `kimi-k3-open-weights-adoption-workstation-guide` | Kimi K3 & Open Weights: Frontier Agents Without Locked-In APIs | Open-weight model adoption (software); slug "workstation" is the brand; only a short self-hosting/hardware aside. | tenthmatrix |
| blog `muse-glimmer-ollama-local-agents-workstation-guide` | Muse Glimmer on Ollama: Always-On Local Agents on One GPU | Open 30B agent model on Ollama (software) pitched as "always-on local agents on one GPU" / Apple Silicon. | tenthmatrix, cross-link hardware |
| blog `nvidia-openshell-secure-agents-mac-studio` | NVIDIA OpenShell: Secure Agent Runtime on Mac Studio and GPU Workstations | Agent sandbox/policy runtime (software) but framed around running it on Mac Studio / GPU workstations (gpu x20). | tenthmatrix, with hardware section linking to Workstation |
| blog `openclaw-ai-robotics-guide` | OpenClaw AI: Open-Source Robotics on Apple Silicon | Open-source robotics/RL framework (software) whose premise is training on Apple Silicon Mac Mini/Studio. | tenthmatrix, cross-link hardware |
| blog `what-is-deep-learning-workstation-guide` | Deep Learning Systems: Technical Brief for Engineers & Agents | Seed lists it as hardware-stay, but the content is a deep-learning concept brief (DL vs ML vs gen AI, task metrics, routing to Bedrock/vLLM); "workstation" in slug is the brand. | tenthmatrix |
| blog `workstation-ai-shop-ring-promoter-int-to-prod` | Workstation AI Shop: Promoting the AI Sales Storefront Through int → test → acc → prod | Ring Promoter release-engineering case study (software) whose subject is the Workstation AI Shop selling GPU machines. | tenthmatrix as Ring Promoter case study; keep shop links pointing to Workstation |
| article `workstation-ai-shop-ring-promoter-int-to-prod` | Workstation AI Shop on Ring Promoter: Orbit, Version-Verified Health and the Path from INT to PROD | Ring Promoter release-engineering case study (software) whose subject is the Workstation AI Shop selling GPU machines. | tenthmatrix as Ring Promoter case study; keep shop links pointing to Workstation |
| article `muse-glimmer-ollama-local-agents-workstation-guide` | Muse Glimmer on Ollama: Always-On Local Agents on One GPU | Open 30B agent model on Ollama (software) pitched as "always-on local agents on one GPU" / Apple Silicon. | tenthmatrix, cross-link hardware |
| article `what-is-deep-learning-workstation-guide` | Deep Learning Systems: Technical Brief for Engineers & Agents | Seed lists it as hardware-stay, but the content is a deep-learning concept brief (DL vs ML vs gen AI, task metrics, routing to Bedrock/vLLM); "workstation" in slug is the brand. | tenthmatrix |
| article `kimi-k3-open-weights-adoption-workstation-guide` | Kimi K3 & Open Weights: Frontier Agents Without Locked-In APIs | Open-weight model adoption (software); slug "workstation" is the brand; only a short self-hosting/hardware aside. | tenthmatrix |
| article `claude-opus-5-aws-bedrock-workstation-guide` | Claude Opus 5 on AWS: Workstation Guide for Builders & Business | Claude Opus 5 on Bedrock/Claude Platform (pure cloud software); "workstation" in slug is the brand. | tenthmatrix |

Seed items I am querying because the content does not match the seed:
- `/ai-financial-services`, `/ai-healthcare`, `/ai-industries` and `/ai-startups` are seeded as TenthMatrix, but each one is an **AI workstation / GPU hardware** page ("AI Workstations for Financial Services", etc.).
- `what-is-deep-learning-workstation-guide` (blog and article) is seeded as hardware-stay, but the content is a **deep-learning concept brief** with no hardware focus.
- `claude-opus-5-aws-bedrock-workstation-guide` and `kimi-k3-open-weights-adoption-workstation-guide` are seeded as "likely ask". In both, "workstation" in the slug is the brand name and the subject is software, so I recommend TenthMatrix.

## Staying on Workstation (hardware)

**Routes:** `/`, `/ai-labs`, `/ai-workstations`, `/edge-ai`, `/gpu-clusters`, `/gpu-vs-workstations`, `/login`, `/private-ai`, `shop/ (separate app)`. Also the `hardwareProducts` section of `/products` (DGX Spark, DGX Station, Mac Studio M5, enterprise GPU boxes).

**Blogs:** `ai-gpu-workstations-nvidia-dgx-mac-studio`, `apple-silicon-ai-mac-mini-studio-openclaw`, `apple-silicon-vs-nvidia-gpu-ml`, `best-nvidia-gpus-ai-training-2026`, `dgx-os-explained-ai-engineers`, `nvidia-ai-workstations-dgx-thinkstation`, `unboxing-mac-studio-m4-running-your-first-llm`

**Articles:** `ai-gpu-workstations-nvidia-dgx-mac-studio`, `unboxing-mac-studio-m4-running-your-first-llm`

`dgx-os-explained-ai-engineers` stays: DGX OS is tied to the DGX hardware stack.

## Broken or missing references

- `/images/video-placeholder.jpg` is referenced 12 times as `thumbnail` in `data/en/video-gallery.json` and does not exist in `public/`. The fallback in `VideoPlayer.jsx` (`/img/video-placeholder.jpg`) is missing too.
- `src/app/[locale]/docs/documentation/page.js` imports `/src/app/data/session.json`, which does not exist.
- `data/en/documentation.json` is placeholder content ("Lets Fly", lorem ipsum, webimpetus clone steps). `data/en/license.json` is a 2015 EULA for an app called "hotspot". Both are seeded to move under `/docs/**`, but they need rewriting or dropping.
- Three blogs still have placeholder titles: `streamlining-devops-kubernetes-operators` ("Example Blog Post 2"), `scalable-ui-flutter-riverpod` ("Example Blog Post 3") and `optimizing-api-performance-node-mysql` ("Example Blog Post 4"). The bodies are real software content, so they are marked tenthmatrix; fix the title and meta when migrating.
- Apart from that, every local `/img`, `/images` and `/insights` path referenced by any blog, article, insight or page JSON resolves under `public/`. External image refs are limited to YouTube thumbnails and partner/client logos.
- `seo-metadata.json` and the top-level `data/*.json` page copies (other than `articles.json` and `all-meta.json`) are not read by any code. They are legacy files, so port only the `data/en/` versions.

## Data mismatches

- None. All 27 slugs present in both `data/blogs/` and `data/en/blogs/` are identical on title, sub_title, excerpt, meta, content, tags, images, cover_image, dates and status.
- `data/articles.json` and `data/en/articles.json` hold the same 63 codes with identical title, sub_title, content, image and meta. There are no duplicate codes.
- No blog/article companion pair is split across destinations.

## Notes for migration

- Shop (`shop/` app, links to shop.workstation.co.uk) is out entirely. The `workstation-ai-shop-ring-promoter-int-to-prod` blog and article are on the ask list.
- Split pages: `/products` (software sections move), `/news` (the NVIDIA partnership item stays) and `/workstation-ai-solutions` (drop 3 hardware package cards). In `/docs/faqs`, strip or cross-link the NVIDIA/Apple Silicon section.
- Redirect caveat: `/docs/blogs`, `/docs/blogs/page/:page` and the tag routes are marked conditional in `redirects.json`, because Workstation keeps 7 hardware posts and may keep its own listing. Individual post URLs redirect unconditionally.

## Decisions (2026-10-14, user approved the recommendations)

- **→ TenthMatrix:** `/events/*` (3), `/industries`, `/pricing`, `/sysops247`, `/why-workstation` → renamed **`/why-tenthmatrix`**; blogs/articles: claude-opus-5-aws-bedrock, kimi-k3, muse-glimmer, nvidia-openshell, openclaw, workstation-ai-shop-ring-promoter (case study; shop links point to Workstation), what-is-deep-learning.
- **→ Workstation:** `/ai-financial-services`, `/ai-healthcare`, `/ai-industries`, `/ai-startups` (all "AI Workstations for X"), `/ai-sme-packages`, `/mlops-setup`, `/partners/boston`; blog `cloud-vs-onpremise-ai-infrastructure`.
- **Both (each site gets its own copy):** `/about-us`, `/book-online` (TenthMatrix version without shop link), `/partners` (software partners only on TenthMatrix).
- Legacy top-level `src/app/data/*.json` copies not read by code → `skip`.
- Final counts: routes 56 TM / 16 WS / 18 both · blogs 101 / 8 · articles 61 / 2 · insights 14 / 0 · assets 197 / 4 / 21 both · redirects 230.
- Pre-decision snapshots: `manifest.pre-decisions.json`, `redirects.pre-decisions.json`.
