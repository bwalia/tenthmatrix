#!/usr/bin/env python3
"""Seed the Nemotron 3.5 Lightning blog (business) + technical note (developers), EN copied to every locale.

Blog:           /docs/blogs/nvidia-nemotron-3-5-lightning-ollama-local-ai-agents-business
Technical note: /technical-notes/nemotron-3-5-lightning-ollama-developer-guide-local-agents

TenthMatrix originals (not in migration/manifest.json), so both are self-canonical
on www.tenthmatrix.com and listed in the sitemap.

Facts from Ollama's announcement, model page and tags page, Ollama's Claude Code and
tool-calling docs, NVIDIA's model card (build.nvidia.com) and the Nemotron 3.5 research
page, checked on 20 Nov 2026. Code follows the documented Ollama APIs; it was not run
against the model here.

Tags: new nemotron 1084; existing nvidia 1038, ollama 944, ai-agents 974, local-ai 946,
llm 975, data-privacy 1077, claude-code 979, apple-silicon 942, gpu 1009.

Run from the repo root:
  python3 scripts/content/nemotron-lightning/diagrams.py
  python3 scripts/content/nemotron-lightning/build_json.py "$PWD"
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
BLOCKED = [
    r"claude\.ai/",
    r"sk-ant-[A-Za-z0-9]",
    r"Bearer\s+[A-Za-z0-9._-]{20,}",
    r"192\.168\.",
    r"10\.4[23]\.",
    r'href="/[a-z]{2}/articles/',
]
for name, html in (("blog", blog_html), ("article", article_html)):
    for pat in BLOCKED:
        if re.search(pat, html, re.I):
            sys.exit(f"{name} body contains blocked pattern /{pat}/")

blog_slug = "nvidia-nemotron-3-5-lightning-ollama-local-ai-agents-business"
article_code = "nemotron-3-5-lightning-ollama-developer-guide-local-agents"
title = "NVIDIA Nemotron 3.5 Lightning on Ollama: Fast Local AI Agents That Keep Your Data In-House"
article_title = "Nemotron 3.5 Lightning on Ollama: A Developer's Guide to Local AI Agents"
sub_blog = (
    "What NVIDIA's open 30B model with 3B active parameters means for businesses running AI agents, "
    "what it costs to run and where it fits alongside the cloud"
)
sub_article = (
    "Tags and hardware sizing, context settings, Claude Code and OpenCode, reliable tool calls and structured output, "
    "local-to-cloud routing, team serving, security, benchmarking and post-training"
)
excerpt = (
    "NVIDIA Nemotron 3.5 Lightning is now on Ollama: an open 30B mixture-of-experts model with 3B active parameters "
    "and a 1M-token context, built for agents. What it is, where it fits, what it costs to run locally, and how to "
    "pair a local tier with the cloud."
)
cover = "/img/nemotron-lightning/nemotron-lightning-cover.svg"
published = "2026-11-20"

tags_blog = [
    {"name": "nemotron", "id": 1084},
    {"name": "nvidia", "id": 1038},
    {"name": "ollama", "id": 944},
    {"name": "ai-agents", "id": 974},
    {"name": "local-ai", "id": 946},
    {"name": "llm", "id": 975},
    {"name": "data-privacy", "id": 1077},
    {"name": "claude-code", "id": 979},
    {"name": "apple-silicon", "id": 942},
    {"name": "gpu", "id": 1009},
]

meta_title = "NVIDIA Nemotron 3.5 Lightning on Ollama: Local AI Agents"
meta_description = (
    "NVIDIA Nemotron 3.5 Lightning, an open 30B model with 3B active parameters, now runs locally on Ollama. "
    "What it means for businesses: faster agents, lower costs, data kept in-house."
)
meta_keywords = (
    "Nemotron 3.5 Lightning, NVIDIA Nemotron, Ollama, local LLM, local AI agents, open model, mixture of experts, "
    "30B-A3B, 1M token context, Mamba-2, agent tool calling, Claude Code Ollama, OpenCode, Hermes Agent, OpenClaw, "
    "RTX, DGX Spark, Apple silicon MLX, data privacy, on-premise AI"
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
    "uuid": "blog-nemotron-lightning-001",
    "internal_id": 1050,
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
            "id": 1050,
            "is_cover": True,
            "width": 1200,
            "height": 630,
            "alt": (
                "Nemotron 3.5 Lightning on Ollama: an always-on agent runs most steps on a local model on your own "
                "device and sends the few hard steps to a larger cloud model"
            ),
        }
    ],
    "content": blog_html,
    "user_id": 1,
    "user": user,
    "tags": tags_blog,
    "created_at": "2026-11-20T10:00:00Z",
    "updated_at": "2026-11-20T10:00:00Z",
    "published_date": published,
    "status": True,
}

article_entry = {
    "id": "50063",
    "uuid": "nemotron-lightning-developer-guide-article-01",
    "title": article_title,
    "sub_title": sub_article,
    "content": article_html,
    "type": "2",
    "status": "1",
    "code": article_code,
    "meta_title": "Nemotron 3.5 Lightning on Ollama: Developer Guide",
    "meta_description": (
        "Run NVIDIA Nemotron 3.5 Lightning locally with Ollama: tags and memory sizing, context, Claude Code and "
        "OpenCode, tool calling, structured output, local-to-cloud routing, security and benchmarks."
    ),
    "meta_keywords": meta_keywords,
    "custom_fields": None,
    "custom_assets": None,
    "user_uuid": None,
    "publish_date": "1795168800",
    "created": "2026-11-20 10:00:00",
    "uuid_business_id": "3d0d4c27-de8e-55e4-84ed-4d14eb9f721e",
    "categories": None,
    "published_date": None,
    "language_code": "en",
    "blog_type": "1",
    "image": cover,
    "industry": "Technology",
    "cats": [
        {"cat_name": "AI Agents"},
        {"cat_name": "Local AI"},
        {"cat_name": "Developer Tools"},
        {"cat_name": "NVIDIA"},
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
