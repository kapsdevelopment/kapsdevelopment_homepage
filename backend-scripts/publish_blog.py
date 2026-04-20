#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import frontmatter

from blog_common import BLOG_DRAFTS_DIR, BLOG_PUBLISHED_DIR, ensure_blog_directories, safe_text, utc_now_iso
from build_blog import build_blog


def resolve_draft_path(post_id: str) -> Path:
    path = BLOG_DRAFTS_DIR / f"{post_id}.md"
    if not path.exists():
        raise FileNotFoundError(f"Draft not found for post_id '{post_id}'.")
    return path


def publish_post(post_id: str) -> Path:
    ensure_blog_directories()
    draft_path = resolve_draft_path(post_id)
    post = frontmatter.load(draft_path)

    target_path = BLOG_PUBLISHED_DIR / draft_path.name
    if target_path.exists():
        raise FileExistsError(
            f"A published post already exists for '{post_id}'. Move or remove it before publishing again."
        )

    now = utc_now_iso()
    post["status"] = "published"
    post["updated_at"] = now
    if not safe_text(post.get("published_at")):
        post["published_at"] = now
    post.content = post.content.strip() + "\n"

    target_path.write_text(frontmatter.dumps(post), encoding="utf-8")
    draft_path.unlink()
    build_blog()
    return target_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish a Kapsdevelopment blog draft.")
    parser.add_argument("post_id", help="The draft post_id / filename stem to publish.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    target_path = publish_post(args.post_id)
    print(f"[OK] Published: {target_path}")


if __name__ == "__main__":
    main()
