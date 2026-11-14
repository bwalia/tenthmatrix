#!/usr/bin/env python3
"""Seed the OpenShell / CNCF blog (business managers) + technical note (developers), EN copied to every locale.

Blog:           /docs/blogs/openshell-cncf-sandbox-ai-agent-runtime-security
Technical note: /technical-notes/nvidia-openshell-developer-guide-sandbox-policies-credentials

TenthMatrix originals (not in migration/manifest.json), so both are self-canonical
on www.tenthmatrix.com and listed in the sitemap.

Facts are from the CNCF announcement of 10 Nov 2026, the OpenShell README and the
NVIDIA OpenShell docs (latest = v0.1.8, released 10 Nov 2026), checked on 14 Nov 2026.

Tags: new cncf 1073, open-source 1074; existing openshell 1037, nvidia 1038,
ai-agents 974, security 1021, kubernetes 1007, claude-code 979, ai 956.

Run from the repo root:
  python3 scripts/content/openshell-cncf/build_json.py "$PWD"
then `node scripts/fetchBlogs.mjs` (pages/, tags/, search index) and `npm run sitemap`.
Locale bodies stay English until translated.
"""
import json
import os
import re
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SCRIPT.parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from lib.articles_locales import ARTICLE_LOCALES, upsert_article_all_locales  # noqa: E402

blog_html = (SCRIPT / "blog-body.html").read_text(encoding="utf-8")
article_html = (SCRIPT / "article-body.html").read_text(encoding="utf-8")

# Guards: no secrets, no artifact links, no private hostnames, no old /articles links.
BLOCKED = [r"claude\.ai/", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/']
for name, html in (("blog", blog_html), ("article", article_html)):
    for pat in BLOCKED:
        if re.search(pat, html, re.I):
            sys.exit(f"{name} body contains blocked pattern /{pat}/")

blog_slug = "openshell-cncf-sandbox-ai-agent-runtime-security"
article_code = "nvidia-openshell-developer-guide-sandbox-policies-credentials"
title = "OpenShell Joins the CNCF: Why AI Agent Safety Starts at the Runtime"
article_title = "Running AI Agents Safely with NVIDIA OpenShell: Sandboxes, Policies and Credentials"
sub_blog = "What the CNCF's newest Sandbox project means for businesses adopting AI agents, and how we use it every day"
sub_article = (
    "A developer's guide to OpenShell 0.1.8: architecture, Landlock and seccomp isolation, policy YAML, "
    "live network rules, credential placeholders, inference, a daily workflow and the gotchas"
)
excerpt = (
    "OpenShell, the secure runtime for AI agents created by NVIDIA, is now a CNCF Sandbox project. "
    "What it does in plain English, why runtime controls beat prompt instructions, the business benefits, "
    "and how TenthMatrix runs its own agents inside it every day."
)
cover = "/img/openshell-cncf-cover.svg"
published = "2026-11-14"

tags_blog = [
    {"name": "openshell", "id": 1037},
    {"name": "cncf", "id": 1073},
    {"name": "ai-agents", "id": 974},
    {"name": "security", "id": 1021},
    {"name": "nvidia", "id": 1038},
    {"name": "open-source", "id": 1074},
    {"name": "kubernetes", "id": 1007},
    {"name": "claude-code", "id": 979},
    {"name": "ai", "id": 956},
]

meta_title = "OpenShell Joins the CNCF: AI Agent Safety at the Runtime"
meta_description = (
    "NVIDIA's OpenShell is now a CNCF Sandbox project. What it means for businesses: sandboxed AI agents, "
    "policy controls, hidden credentials and network rules, and how we use it daily."
)
meta_keywords = (
    "OpenShell, NVIDIA OpenShell, CNCF Sandbox, AI agent security, AI agent sandbox, secure runtime for AI agents, "
    "agent guardrails, prompt injection, credential isolation, policy as code, Landlock, seccomp, Claude Code, "
    "OpenCode, Kubernetes, cloud native AI"
)

user = {
    "id": 1,
    "uuid": "usr-001",
    "username": "balinder",
    "email": "balinder@workstation.co.uk",
    "first_name": "Balinder",
    "last_name": "Walia",
    "active": True,
    "created_at": "2025-05-19 15:25:06",
    "updated_at": "2025-05-19 15:25:06",
}

blog = {
    "uuid": "blog-openshell-cncf-001",
    "internal_id": 1046,
    "slug": blog_slug,
    "title": title,
    "sub_title": sub_blog,
    "excerpt": excerpt,
    "meta_title": meta_title,
    "meta_description": meta_description,
    "meta_keywords": meta_keywords,
    "cover_image": cover,
    "images": [
        {
            "url": cover,
            "id": 1046,
            "is_cover": True,
            "width": 1200,
            "height": 630,
            "alt": "OpenShell joins the CNCF Sandbox: an AI agent in an isolated sandbox, with a supervisor that allows, asks or denies each request",
        }
    ],
    "content": blog_html,
    "user_id": 1,
    "user": user,
    "tags": tags_blog,
    "created_at": "2026-11-14T09:00:00Z",
    "updated_at": "2026-11-14T09:00:00Z",
    "published_date": published,
    "status": True,
}

article_entry = {
    "id": "50059",
    "uuid": "openshell-developer-guide-article-01",
    "title": article_title,
    "sub_title": sub_article,
    "content": article_html,
    "type": "2",
    "status": "1",
    "code": article_code,
    "meta_title": "NVIDIA OpenShell Developer Guide: Sandboxes, Policies, Credentials",
    "meta_description": (
        "Run AI agents safely with NVIDIA OpenShell, now in the CNCF Sandbox: architecture, Landlock and seccomp "
        "isolation, policy YAML, live network rules, credential placeholders, CLI commands and gotchas."
    ),
    "meta_keywords": meta_keywords,
    "custom_fields": None,
    "custom_assets": None,
    "user_uuid": None,
    "publish_date": "1794646800",
    "created": "2026-11-14 09:00:00",
    "uuid_business_id": "3d0d4c27-de8e-55e4-84ed-4d14eb9f721e",
    "categories": None,
    "published_date": None,
    "language_code": "en",
    "blog_type": "1",
    "image": cover,
    "industry": "Technology",
    "cats": [
        {"cat_name": "AI Agents"},
        {"cat_name": "Security"},
        {"cat_name": "DevOps"},
        {"cat_name": "Open Source"},
    ],
}


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


write_json(ROOT / f"src/app/data/blogs/{blog_slug}.json", blog)
write_json(ROOT / f"src/app/data/en/blogs/{blog_slug}.json", blog)
for locale in [l for l in ARTICLE_LOCALES if l != "en"]:
    loc_dir = ROOT / f"src/app/data/{locale}/blogs"
    loc_path = loc_dir / f"{blog_slug}.json"
    # Keep translated copies on re-run; RESEED_LOCALES=1 overwrites them (only before translation).
    if loc_dir.exists() and (not loc_path.exists() or os.environ.get("RESEED_LOCALES") == "1"):
        write_json(loc_path, blog)

upsert_article_all_locales(ROOT, article_entry)

print(f"Wrote blog {blog_slug} and technical note {article_code}")
