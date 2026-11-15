#!/usr/bin/env python3
"""Seed the Microsoft Graph technical note (EN copied to every locale's articles.json).

Technical note: /technical-notes/microsoft-graph-api-developer-guide-azure-microsoft-365
TenthMatrix original (not in migration/manifest.json): self-canonical, in the sitemap.

Facts from Microsoft Learn (Graph overview, use-the-api, auth concepts, auth-v2-service,
throttling, throttling-limits, json-batching, change notifications + webhook delivery,
delta query, deployments, Data Connect, SDKs overview, Graph PowerShell), read Nov 2026.
Code follows the documented API; it was not run against a live tenant.
Diagrams: scripts/content/microsoft-graph/diagrams.py → public/img/microsoft-graph/ (our own drawings).

Run from the repo root:
  python3 scripts/content/microsoft-graph/diagrams.py
  python3 scripts/content/microsoft-graph/build_json.py "$PWD"
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
for pat in [r"claude\.ai/", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/', r"diy\s*tax"]:
    if re.search(pat, html, re.I):
        sys.exit(f"article body contains blocked pattern /{pat}/")

cover = "/img/microsoft-graph/graph-end-to-end-workflow.svg"
entry = {
    "id": "50061",
    "uuid": "microsoft-graph-api-guide-article-01",
    "title": "Microsoft Graph API: One Endpoint for Entra ID, Microsoft 365 and Intune, Explained End to End",
    "sub_title": (
        "How Graph works from app registration to response, the cloud-scale problems it solves across Azure and "
        "Microsoft 365 services, and how to use it well: permissions, queries, batching, throttling, change "
        "notifications, delta query, Data Connect and national clouds"
    ),
    "content": html,
    "type": "2",
    "status": "1",
    "code": "microsoft-graph-api-developer-guide-azure-microsoft-365",
    "meta_title": "Microsoft Graph API Explained: Workflow, Limits and Best Practice",
    "meta_description": (
        "A developer guide to Microsoft Graph: the end-to-end request workflow, permissions and tokens, OData queries, "
        "batching, throttling limits, change notifications, delta query, Data Connect and national clouds."
    ),
    "meta_keywords": (
        "Microsoft Graph, Microsoft Graph API, graph.microsoft.com, Microsoft Entra ID, Azure AD, Microsoft 365 API, "
        "Intune API, Teams API, SharePoint API, OneDrive API, Outlook API, delegated permissions, application permissions, "
        "client credentials, MSAL, throttling, Retry-After, JSON batching, change notifications, webhooks, delta query, "
        "Azure Event Hubs, Event Grid, Microsoft Graph Data Connect, national clouds, Graph PowerShell"
    ),
    "custom_fields": None,
    "custom_assets": None,
    "user_uuid": None,
    "publish_date": "1794736800",
    "created": "2026-11-15 10:00:00",
    "uuid_business_id": "3d0d4c27-de8e-55e4-84ed-4d14eb9f721e",
    "categories": None,
    "published_date": None,
    "language_code": "en",
    "blog_type": "1",
    "image": cover,
    "industry": "Technology",
    "cats": [
        {"cat_name": "Microsoft 365"},
        {"cat_name": "Azure"},
        {"cat_name": "APIs"},
        {"cat_name": "Identity"},
    ],
}
upsert_article_all_locales(ROOT, entry)
print("Wrote technical note", entry["code"])
