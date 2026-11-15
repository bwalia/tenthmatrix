#!/usr/bin/env python3
"""Seed the local open-source models blog (business) + Docker technical note (developers), EN copied to every locale.

Blog:           /docs/blogs/private-ai-local-open-source-models-data-privacy
Technical note: /technical-notes/local-llm-docker-ollama-vllm-nvidia-nim-developer-guide

TenthMatrix originals (not in migration/manifest.json): self-canonical, in the sitemap.

Example outputs were produced on 14 Nov 2026: Ollama 0.40.16 in Docker (offline
demo), native Ollama on an Apple Silicon Mac (pirate review, redaction, haiku,
Wi-Fi names), Open WebUI 0.13.3 (screenshot). The scripts are in ./examples and
the Compose file is ./compose.yaml. vLLM and NIM commands come from their docs
(vLLM v0.33.0; NVIDIA NIM playbooks); neither was run for this note.

Images: Ollama logo from github.com/ollama/ollama docs/ollama-logo.svg (MIT repo),
vLLM logo from github.com/vllm-project/vllm docs/assets/logos (Apache-2.0 repo),
NIM badge is our own text illustration (no open-source NIM logo exists).

Tags: new vllm 1075, docker 1076, data-privacy 1077, nvidia-nim 1078;
existing ollama 944, local-ai 946, open-weights 1023, nvidia 1038, open-source 1074, llm 975, ai 956.

Run from the repo root:
  python3 scripts/content/local-llms-docker/build_json.py "$PWD"
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
from lib.articles_locales import ARTICLE_LOCALES, upsert_article_all_locales  # noqa: E402

blog_html = (SCRIPT / "blog-body.html").read_text(encoding="utf-8")
article_html = (SCRIPT / "article-body.html").read_text(encoding="utf-8")

# Guards: no secrets, no artifact links, no private hostnames, no old /articles links.
BLOCKED = [r"claude\.ai/", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/', r"priya\.sharma@(?!example\.com)"]
for name, html in (("blog", blog_html), ("article", article_html)):
    for pat in BLOCKED:
        if re.search(pat, html, re.I):
            sys.exit(f"{name} body contains blocked pattern /{pat}/")

blog_slug = "private-ai-local-open-source-models-data-privacy"
article_code = "local-llm-docker-ollama-vllm-nvidia-nim-developer-guide"
title = "Private AI on Your Own Hardware: Local Open-Source Models and Data Privacy"
article_title = "Local Open-Source Models in Docker: Ollama, vLLM and NVIDIA NIM, with Fun Examples"
sub_blog = "Why businesses are running open-weight AI models in-house: privacy, cost and control, and the honest trade-offs"
sub_article = (
    "Six Docker deployments (Ollama, Open WebUI, an offline container, vLLM, NVIDIA NIM, llama.cpp), one OpenAI client "
    "for all of them, real fun examples and a privacy hardening checklist"
)
excerpt = (
    "Open-weight AI models now run on hardware you own, so prompts, documents and answers never leave the building. "
    "What that means for data protection, cost and control, where it falls short, and how Ollama, vLLM and NVIDIA NIM fit."
)
cover = "/img/local-llm/local-llm-cover.svg"
published = "2026-11-14"

tags_blog = [
    {"name": "local-ai", "id": 946},
    {"name": "data-privacy", "id": 1077},
    {"name": "ollama", "id": 944},
    {"name": "vllm", "id": 1079},
    {"name": "nvidia-nim", "id": 1078},
    {"name": "open-weights", "id": 1023},
    {"name": "docker", "id": 1080},
    {"name": "nvidia", "id": 1038},
    {"name": "open-source", "id": 1074},
    {"name": "llm", "id": 975},
    {"name": "ai", "id": 956},
]

meta_title = "Private AI on Your Own Hardware: Local Models and Data Privacy"
meta_description = (
    "Run open-source AI models in-house so customer data never leaves your building: the privacy, cost and control "
    "benefits, the trade-offs, and when to use Ollama, vLLM or NVIDIA NIM."
)
meta_keywords = (
    "local LLM, private AI, open-source models, open-weight models, data privacy, UK GDPR, on-premise AI, self-hosted AI, "
    "Ollama, vLLM, NVIDIA NIM, Docker, Docker Compose, Open WebUI, llama.cpp, OpenAI-compatible API, offline AI, air-gapped AI"
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
    "uuid": "blog-local-llm-privacy-001",
    "internal_id": 1048,
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
            "id": 1047,
            "is_cover": True,
            "width": 1200,
            "height": 630,
            "alt": "Your AI, your hardware, your data stays in: Ollama, vLLM and NVIDIA NIM run inside your building",
        }
    ],
    "content": blog_html,
    "user_id": 1,
    "user": user,
    "tags": tags_blog,
    "created_at": "2026-11-14T10:00:00Z",
    "updated_at": "2026-11-14T10:00:00Z",
    "published_date": published,
    "status": True,
}

article_entry = {
    "id": "50060",
    "uuid": "local-llm-docker-guide-article-01",
    "title": article_title,
    "sub_title": sub_article,
    "content": article_html,
    "type": "2",
    "status": "1",
    "code": article_code,
    "meta_title": "Local LLMs in Docker: Ollama, vLLM and NVIDIA NIM Developer Guide",
    "meta_description": (
        "Deploy local open-source models with Docker: Ollama, Open WebUI, an offline container, vLLM, NVIDIA NIM and "
        "llama.cpp, one OpenAI client for all, fun real examples and a privacy checklist."
    ),
    "meta_keywords": meta_keywords,
    "custom_fields": None,
    "custom_assets": None,
    "user_uuid": None,
    "publish_date": "1794650400",
    "created": "2026-11-14 10:00:00",
    "uuid_business_id": "3d0d4c27-de8e-55e4-84ed-4d14eb9f721e",
    "categories": None,
    "published_date": None,
    "language_code": "en",
    "blog_type": "1",
    "image": cover,
    "industry": "Technology",
    "cats": [
        {"cat_name": "Local AI"},
        {"cat_name": "Data Privacy"},
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
