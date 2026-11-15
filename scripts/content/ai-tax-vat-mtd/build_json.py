#!/usr/bin/env python3
"""Seed the AI tax and VAT returns / MTD for accountancy firms blog, EN copied to every locale.

Blog: /docs/blogs/ai-tax-vat-returns-mtd-software-accountancy-firms-uk

TenthMatrix original (not in migration/manifest.json), so it is self-canonical on
www.tenthmatrix.com and listed in the sitemap. Companion page: /ai-tax-filing.

Facts checked on 15 Nov 2026 against GOV.UK (MTD ITSA eligibility, quarterly updates,
VAT Notice 700/22, VAT penalty points, Agent Services Account, client sign-up), the HMRC
Developer Hub (testing guide, Create Test User, Test Fraud Prevention Headers, Income Tax
end-to-end guide incl. the pause on new 2026-27 production requests, terms of use security
questions, development practices), Anthropic list prices, gpuleasing.co.uk (no published
prices; calculator example figures only) and live shop.workstation.co.uk prices (ex VAT).

Tags: existing hmrc 952, mtd 953, vat 951, tax-return 962, accounting 954, ai-agents 974,
gpu 1009, local-ai 946, llm 975, ai 956; new making-tax-digital 1075, gpu-leasing 1076.

Run from the repo root:
  python3 scripts/content/ai-tax-vat-mtd/build_json.py "$PWD"
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
from lib.articles_locales import ARTICLE_LOCALES  # noqa: E402

blog_html = (SCRIPT / "blog-body.html").read_text(encoding="utf-8")

# Guards: no secrets, no artifact links, no private hostnames, no old /articles links.
BLOCKED = [r"claude\.ai/", r"Bearer\s+[A-Za-z0-9._-]{20,}", r"192\.168\.", r"10\.4[23]\.", r'href="/[a-z]{2}/articles/']
for pat in BLOCKED:
    if re.search(pat, blog_html, re.I):
        sys.exit(f"blog body contains blocked pattern /{pat}/")

slug = "ai-tax-vat-returns-mtd-software-accountancy-firms-uk"
cover = "/img/blog/ai-tax-vat-mtd-accountancy-firms/cover.svg"
published = "2026-11-15"

blog = {
    "uuid": "blog-ai-tax-vat-mtd-001",
    "internal_id": 1047,
    "slug": slug,
    "title": "AI for Tax and VAT Returns: MTD Software for UK Accountancy Firms",
    "sub_title": (
        "Six recorded scenarios, MTD software setup, HMRC sandbox to production, penetration testing, "
        "and what the AI costs on hosted models, rented GPUs or bought hardware"
    ),
    "excerpt": (
        "How AI agents prepare Income Tax and VAT returns under Making Tax Digital, what an accountancy firm "
        "needs from HMRC from sandbox to production (penetration testing included), and the real cost of the AI: "
        "hosted, rented private GPUs or bought outright."
    ),
    "meta_title": "AI for Tax and VAT Returns: MTD Software for UK Accountancy Firms",
    "meta_description": (
        "AI-assisted MTD Income Tax and VAT returns for UK accountancy firms: six recorded scenarios, HMRC "
        "sandbox and production approval, penetration testing, and AI costs from hosted models to private GPUs."
    ),
    "meta_keywords": (
        "Making Tax Digital software, MTD for Income Tax, MTD VAT software, AI tax return, AI bookkeeping, "
        "accountancy firm software UK, HMRC sandbox, HMRC production credentials, fraud prevention headers, "
        "penetration testing HMRC, Agent Services Account, private GPU, GPU leasing UK, RTX PRO 6000, DGX Spark"
    ),
    "cover_image": cover,
    "images": [
        {
            "url": cover,
            "id": 1047,
            "is_cover": True,
            "width": 1200,
            "height": 630,
            "alt": "AI for tax and VAT returns under Making Tax Digital: bank statements, AI agent, accountant review, filed with HMRC",
        }
    ],
    "content": blog_html,
    "user_id": 1,
    "user": {
        "id": 1,
        "uuid": "usr-001",
        "username": "balinder",
        "email": "balinder@tenthmatrix.com",
        "first_name": "Balinder",
        "last_name": "Walia",
        "active": True,
        "created_at": "2025-05-19 15:25:06",
        "updated_at": "2025-05-19 15:25:06",
    },
    "tags": [
        {"name": "making-tax-digital", "id": 1075},
        {"name": "mtd", "id": 953},
        {"name": "hmrc", "id": 952},
        {"name": "vat", "id": 951},
        {"name": "tax-return", "id": 962},
        {"name": "accounting", "id": 954},
        {"name": "ai-agents", "id": 974},
        {"name": "gpu", "id": 1009},
        {"name": "gpu-leasing", "id": 1076},
        {"name": "local-ai", "id": 946},
        {"name": "llm", "id": 975},
        {"name": "ai", "id": 956},
    ],
    "created_at": "2026-11-15T09:00:00Z",
    "updated_at": "2026-11-15T09:00:00Z",
    "published_date": published,
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
    # Keep translated copies on re-run; RESEED_LOCALES=1 overwrites them (only before translation).
    if loc_dir.exists() and (not loc_path.exists() or os.environ.get("RESEED_LOCALES") == "1"):
        write_json(loc_path, blog)

print(f"Wrote blog {slug}")
