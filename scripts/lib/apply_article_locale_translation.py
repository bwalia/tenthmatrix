#!/usr/bin/env python3
"""Apply translated article fields into one locale's articles.json by code.

Usage:
  python3 scripts/lib/apply_article_locale_translation.py \\
    --root . --slug my-slug --locale fr --from-json path/to/fr.json

The JSON file may contain any of:
  title, sub_title, content, meta_title, meta_description, meta_keywords, cats

Or pass a directory of {locale}.json files:
  python3 scripts/lib/apply_article_locale_translation.py \\
    --root . --slug my-slug --from-dir scripts/article-i18n/patches/my-slug
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

TRANSLATABLE = (
    "title",
    "sub_title",
    "content",
    "meta_title",
    "meta_description",
    "meta_keywords",
    "cats",
)

NON_EN = [
    "ar",
    "bn",
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


def apply_locale(root: Path, slug: str, locale: str, fields: dict) -> None:
    if locale not in NON_EN:
        raise ValueError(f"locale must be one of {NON_EN}, got {locale}")
    path = root / "src/app/data" / locale / "articles.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    content = data.setdefault("data", {}).setdefault("content", [])
    idx = next((i for i, c in enumerate(content) if c.get("code") == slug), None)
    if idx is None:
        raise KeyError(f"{slug} not found in {path}")
    entry = content[idx]
    for key in TRANSLATABLE:
        if key in fields and fields[key] is not None:
            entry[key] = fields[key]
    entry["language_code"] = locale
    content[idx] = entry
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_progress(root: Path) -> dict:
    p = root / "scripts/article-i18n/progress.json"
    if not p.exists():
        return {"articles": {}}
    return json.loads(p.read_text(encoding="utf-8"))


def save_progress(root: Path, progress: dict) -> None:
    p = root / "scripts/article-i18n/progress.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(progress, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def mark_done(root: Path, slug: str, locales: list[str]) -> None:
    progress = load_progress(root)
    arts = progress.setdefault("articles", {})
    done = set(arts.get(slug, {}).get("locales", []))
    done.update(locales)
    arts[slug] = {"locales": sorted(done), "complete": sorted(done) == sorted(NON_EN)}
    save_progress(root, progress)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--slug", required=True)
    ap.add_argument("--locale")
    ap.add_argument("--from-json", type=Path)
    ap.add_argument("--from-dir", type=Path)
    args = ap.parse_args()
    root = args.root.resolve()

    applied: list[str] = []
    if args.from_dir:
        for locale in NON_EN:
            f = args.from_dir / f"{locale}.json"
            if not f.exists():
                continue
            fields = json.loads(f.read_text(encoding="utf-8"))
            apply_locale(root, args.slug, locale, fields)
            applied.append(locale)
            print(f"applied {args.slug} -> {locale}")
    elif args.locale and args.from_json:
        fields = json.loads(args.from_json.read_text(encoding="utf-8"))
        apply_locale(root, args.slug, args.locale, fields)
        applied.append(args.locale)
        print(f"applied {args.slug} -> {args.locale}")
    else:
        ap.error("Provide --from-dir OR (--locale and --from-json)")

    if applied:
        mark_done(root, args.slug, applied)


if __name__ == "__main__":
    main()
