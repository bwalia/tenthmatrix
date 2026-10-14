"""Shared helper: upsert an article entry into root, en, and all locale articles.json files."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ARTICLE_LOCALES = [
    "ar",
    "bn",
    "en",
    "es",
    "fr",
    "hi",
    "nl",
    "pa",
    "pt",
    "ru",
    "th",
    "ur",
    "zh",
]


def upsert_article_all_locales(root: Path, article_entry: dict) -> None:
    """Write/replace article by `code` in root articles.json and every locale file."""
    slug = article_entry.get("code")
    if not slug:
        raise ValueError("article_entry must include code")

    paths = [root / "src/app/data/articles.json"]
    for locale in ARTICLE_LOCALES:
        paths.append(root / "src/app/data" / locale / "articles.json")

    for articles_path in paths:
        if not articles_path.exists():
            continue
        data = json.loads(articles_path.read_text(encoding="utf-8"))
        content = data.setdefault("data", {}).setdefault("content", [])
        entry = deepcopy(article_entry)
        # Tag non-EN copies with language_code for clarity
        if articles_path.parent.name in ARTICLE_LOCALES and articles_path.parent.name != "en":
            entry["language_code"] = articles_path.parent.name
        elif articles_path.name == "articles.json" and articles_path.parent.name == "data":
            entry["language_code"] = article_entry.get("language_code") or "en"

        idx = next((i for i, c in enumerate(content) if c.get("code") == slug), None)
        if idx is None:
            content.insert(0, entry)
        else:
            content[idx] = entry
        articles_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
