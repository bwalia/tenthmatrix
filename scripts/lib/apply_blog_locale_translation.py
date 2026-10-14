#!/usr/bin/env python3
"""Apply a translated blog JSON into src/app/data/{locale}/blogs/{slug}.json.

Usage:
  python3 scripts/lib/apply_blog_locale_translation.py \\
    --root . --slug my-slug --from-dir scripts/blog-i18n/patches/my-slug

Each {locale}.json may be a full blog object or a partial with translated fields
merged onto the English blog base.
"""
from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path

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

TRANSLATABLE = (
    "title",
    "sub_title",
    "excerpt",
    "meta_title",
    "meta_description",
    "meta_keywords",
    "content",
)


def apply_locale(root: Path, slug: str, locale: str, fields: dict) -> None:
    base_path = root / "src/app/data" / "blogs" / f"{slug}.json"
    if not base_path.exists():
        raise FileNotFoundError(base_path)
    blog = deepcopy(json.loads(base_path.read_text(encoding="utf-8")))
    for key in TRANSLATABLE:
        if key in fields and fields[key] is not None:
            blog[key] = fields[key]
    # Allow full override if patch looks like a complete blog
    if fields.get("slug") == slug and "content" in fields and "title" in fields:
        for k, v in fields.items():
            if k in TRANSLATABLE or k in ("images",):
                blog[k] = v
    out_dir = root / "src/app/data" / locale / "blogs"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.json"
    out_path.write_text(json.dumps(blog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--slug", required=True)
    ap.add_argument("--from-dir", type=Path, required=True)
    args = ap.parse_args()
    root = args.root.resolve()
    for locale in NON_EN:
        f = args.from_dir / f"{locale}.json"
        if not f.exists():
            continue
        fields = json.loads(f.read_text(encoding="utf-8"))
        apply_locale(root, args.slug, locale, fields)
        print(f"wrote {locale}/blogs/{args.slug}.json")


if __name__ == "__main__":
    main()
