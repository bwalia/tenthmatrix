#!/usr/bin/env python3
"""Seed the OpsAPI blog post (EN copied to every locale).

Blog: /docs/blogs/opsapi-one-backend-sign-in-workspaces-business-modules
Product page: /opsapi (src/app/data/en/opsapi.json)

TenthMatrix original (not in migration/manifest.json): self-canonical, in the sitemap.
Facts come from opsapi.org (features, architecture, demo, technotes, blog; 28-29 Oct 2026)
and the bwalia/opsapi repository (README, mcp/README.md, .github/workflows).
Diagrams in public/img/opsapi/ were exported from the opsapi.org technical-note SVGs;
opsapi-ci-cd-pipeline.svg is our own drawing of the repository's workflows.

Tags: new multi-tenant 1081, single-sign-on 1082, self-hosted 1083;
existing opsapi 3, open-source 1074, kubernetes 931, lua 1025, platform-engineering 987,
devops 932, backend 1003.

Run from the repo root:
  python3 scripts/content/opsapi-blog/build_json.py "$PWD"
then `node scripts/fetchBlogs.mjs` and `npm run sitemap`.
"""
import json
import os
import re
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SCRIPT.parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from lib.articles_locales import ARTICLE_LOCALES  # noqa: E402

blog_html = (SCRIPT / "blog-body.html").read_text(encoding="utf-8")
BLOCKED = [r"claude\.ai/", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/', r"demo@opsapi\.org", r"diy\s*tax"]
for pat in BLOCKED:
    if re.search(pat, blog_html, re.I):
        sys.exit(f"blog body contains blocked pattern /{pat}/")

slug = "opsapi-one-backend-sign-in-workspaces-business-modules"
cover = "/img/opsapi/opsapi-architecture.svg"
blog = {
    "uuid": "blog-opsapi-one-backend-001",
    "internal_id": 1049,
    "slug": slug,
    "title": "One API for Every Product: How OpsAPI Handles Sign-In, Workspaces and Business Modules",
    "sub_title": "Why we stopped building a backend per product, with the diagrams and workflows from the OpsAPI project",
    "excerpt": (
        "OpsAPI is an open-source, self-hosted API that signs users in once for every app, keeps each customer in its own "
        "workspace and switches on only the business modules a product needs. How it works, with diagrams and workflows."
    ),
    "meta_title": "OpsAPI: One Self-Hosted API for Sign-In, Workspaces and Modules",
    "meta_description": (
        "How OpsAPI replaces a backend per product: single sign-on for every app, a workspace per customer, 20 business "
        "modules switched by PROJECT_CODE, webhooks, plugins and a Helm-based CI/CD workflow."
    ),
    "meta_keywords": (
        "OpsAPI, multi-tenant API, self-hosted backend, single sign-on, SAML, RBAC, workspaces, OpenResty, Lua, Lapis, "
        "PostgreSQL, Helm, Kubernetes, webhooks, headless CMS, HMRC MTD, MCP server, open source"
    ),
    "cover_image": cover,
    "images": [
        {
            "url": cover,
            "id": 1049,
            "is_cover": True,
            "width": 960,
            "height": 520,
            "alt": "OpsAPI system overview: clients, edge proxy, the OpsAPI container and its services",
        }
    ],
    "content": blog_html,
    "user_id": 1,
    "user": {
        "id": 1,
        "uuid": "usr-001",
        "username": "balinder",
        "email": "balinder@workstation.co.uk",
        "first_name": "Balinder",
        "last_name": "Walia",
        "active": True,
        "created_at": "2025-05-19 15:25:06",
        "updated_at": "2025-05-19 15:25:06",
    },
    "tags": [
        {"name": "opsapi", "id": 3},
        {"name": "multi-tenant", "id": 1081},
        {"name": "single-sign-on", "id": 1082},
        {"name": "self-hosted", "id": 1083},
        {"name": "open-source", "id": 1074},
        {"name": "kubernetes", "id": 931},
        {"name": "lua", "id": 1025},
        {"name": "platform-engineering", "id": 987},
        {"name": "devops", "id": 932},
        {"name": "backend", "id": 1003},
    ],
    "created_at": "2026-11-15T10:00:00Z",
    "updated_at": "2026-11-15T10:00:00Z",
    "published_date": "2026-11-15",
    "status": True,
}


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


write_json(ROOT / f"src/app/data/blogs/{slug}.json", blog)
write_json(ROOT / f"src/app/data/en/blogs/{slug}.json", blog)
for locale in [l for l in ARTICLE_LOCALES if l != "en"]:
    loc_dir = ROOT / f"src/app/data/{locale}/blogs"
    loc_path = loc_dir / f"{slug}.json"
    if loc_dir.exists() and (not loc_path.exists() or os.environ.get("RESEED_LOCALES") == "1"):
        write_json(loc_path, blog)

print(f"Wrote blog {slug}")
