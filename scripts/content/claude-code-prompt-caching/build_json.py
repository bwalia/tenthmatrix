#!/usr/bin/env python3
"""Seed the prompt-caching technical note (EN copied to every locale's articles.json).

Technical note: /technical-notes/reduce-claude-code-usage-prompt-caching-developer-guide
TenthMatrix original (not in migration/manifest.json): self-canonical, in the sitemap.

Facts from Anthropic's prompt caching docs (platform.claude.com) and Claude Code's
"How Claude Code uses prompt caching" and "Manage costs effectively" pages
(code.claude.com), read Nov 2026. Rewritten in our own words.
Code follows the documented API and SDKs; it was not run against a live account.
Diagrams: scripts/content/claude-code-prompt-caching/diagrams.py → public/img/claude-code-prompt-caching/.

Run from the repo root:
  python3 scripts/content/claude-code-prompt-caching/diagrams.py
  python3 scripts/content/claude-code-prompt-caching/build_json.py "$PWD"
then `node scripts/fetchBlogs.mjs` and `npm run sitemap`.
"""
import re
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SCRIPT.parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from lib.articles_locales import upsert_article_all_locales  # noqa: E402

html = (SCRIPT / "article-body.html").read_text(encoding="utf-8")
for pat in [r"claude\.ai/", r"sk-ant-[A-Za-z0-9]", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/', r"diy\s*tax"]:
    if re.search(pat, html, re.I):
        sys.exit(f"article body contains blocked pattern /{pat}/")

cover = "/img/claude-code-prompt-caching/prompt-cache-prefix-turns.svg"
entry = {
    "id": "50062",
    "uuid": "claude-code-prompt-caching-article-01",
    "title": "Reduce Claude Code Usage with Prompt Caching: A Developer's Guide",
    "sub_title": (
        "How prompt caching works, what it costs, what silently breaks it in Claude Code, and copy-and-paste "
        "Python, TypeScript and curl patterns for caching in your own Claude API applications"
    ),
    "content": html,
    "type": "2",
    "status": "1",
    "code": "reduce-claude-code-usage-prompt-caching-developer-guide",
    "meta_title": "Reduce Claude Code Usage with Prompt Caching",
    "meta_description": (
        "Cut Claude Code and Claude API costs with prompt caching: how the prefix cache works, pricing and TTLs, "
        "what breaks the cache in Claude Code, and developer-friendly code to cache, measure and debug it."
    ),
    "meta_keywords": (
        "Claude Code, prompt caching, Claude API, reduce Claude Code usage, Claude Code cost, cache_control, "
        "cache TTL, cache_read_input_tokens, promptCacheTtl, /usage, /compact, /clear, Anthropic SDK, "
        "Claude Opus 5.5, Claude Sonnet 5.5, token cost, AI agent cost optimisation"
    ),
    "custom_fields": None,
    "custom_assets": None,
    "user_uuid": None,
    "publish_date": "1795082400",
    "created": "2026-11-19 10:00:00",
    "uuid_business_id": "3d0d4c27-de8e-55e4-84ed-4d14eb9f721e",
    "categories": None,
    "published_date": None,
    "language_code": "en",
    "blog_type": "1",
    "image": cover,
    "industry": "Technology",
    "cats": [
        {"cat_name": "AI Agents"},
        {"cat_name": "Claude"},
        {"cat_name": "Developer Tools"},
        {"cat_name": "Cost Optimisation"},
    ],
}
upsert_article_all_locales(ROOT, entry)
print("Wrote technical note", entry["code"])
