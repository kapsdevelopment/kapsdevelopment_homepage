#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import frontmatter
from jinja2 import Environment, FileSystemLoader, select_autoescape

from blog_common import (
    BLOG_OUTPUT_DIR,
    BLOG_PUBLIC_ASSETS_DIR,
    BLOG_PUBLISHED_DIR,
    BLOG_SOURCE_ASSETS_DIR,
    BLOG_TEMPLATES_DIR,
    ROOT,
    SITE_URL,
    clean_dir,
    display_date_value,
    ensure_blog_directories,
    estimate_reading_time,
    extract_first_image_url,
    first_non_heading_paragraph_text,
    markdown_to_html,
    normalize_date_value,
    safe_text,
    slugify,
    strip_html,
    strip_leading_markdown_h1,
    sync_tree,
    truncate_text,
    utc_now_iso,
    utc_today_iso,
)


STATIC_SITE_PAGES: tuple[tuple[str, Path], ...] = (
    ("/", ROOT / "index.html"),
    ("/sathu/support/", ROOT / "sathu" / "support" / "index.html"),
    ("/sathu/privacy/", ROOT / "sathu" / "privacy" / "index.html"),
    ("/sathu/terms/", ROOT / "sathu" / "terms" / "index.html"),
)


def sortable_date(value: Any) -> str:
    normalized = normalize_date_value(value)
    return normalized or ""


def sitemap_lastmod(value: Any) -> str | None:
    normalized = normalize_date_value(value)
    if not normalized:
        return None
    return normalized.split("T", 1)[0]


def iso_datetime(value: Any, fallback: str) -> str:
    normalized = normalize_date_value(value)
    if not normalized:
        return fallback
    if "T" in normalized:
        return normalized
    return f"{normalized}T00:00:00Z"


def file_lastmod(path: Path) -> str | None:
    if not path.exists():
        return None
    modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
    return modified.date().isoformat()


def build_sitemap_entries(posts: list[dict[str, Any]]) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    def add_entry(url: str, lastmod: str | None) -> None:
        if url in seen_urls:
            return
        seen_urls.add(url)
        entries.append({"loc": url, "lastmod": lastmod or utc_today_iso()})

    add_entry(f"{SITE_URL}/", file_lastmod(ROOT / "index.html"))
    add_entry(f"{SITE_URL}/blog/", file_lastmod(BLOG_OUTPUT_DIR / "index.html"))

    for route, source_path in STATIC_SITE_PAGES[1:]:
        add_entry(f"{SITE_URL}{route}", file_lastmod(source_path))

    for post in posts:
        post_path = BLOG_OUTPUT_DIR / post["slug"] / "index.html"
        add_entry(
            post["canonical_url"],
            sitemap_lastmod(post.get("updated_at"))
            or sitemap_lastmod(post.get("published_at"))
            or sitemap_lastmod(post.get("created_at"))
            or file_lastmod(post_path),
        )

    return entries


def most_recent_post_datetime(posts: list[dict[str, Any]]) -> str:
    if not posts:
        return iso_datetime(None, fallback=utc_now_iso())

    newest = max(
        posts,
        key=lambda item: sortable_date(item.get("updated_at") or item.get("published_at") or item.get("created_at")),
    )
    return iso_datetime(
        newest.get("updated_at") or newest.get("published_at") or newest.get("created_at"),
        fallback=utc_now_iso(),
    )


def load_post(path: Path) -> dict[str, Any] | None:
    post = frontmatter.load(path)
    status = safe_text(post.get("status")).lower()
    if status != "published":
        return None

    post_id = safe_text(post.get("post_id")) or path.stem
    title = safe_text(post.get("title")) or post_id.replace("-", " ").title()
    slug = slugify(safe_text(post.get("slug")) or title, fallback=post_id)

    body_markdown = strip_leading_markdown_h1(post.content.strip())
    content_html = markdown_to_html(body_markdown)

    summary = safe_text(post.get("summary")) or first_non_heading_paragraph_text(post.content)
    author = post.get("author", {})
    if not isinstance(author, dict):
        author = {}

    seo = post.get("seo", {})
    if not isinstance(seo, dict):
        seo = {}

    cover_image = safe_text(post.get("cover_image")) or extract_first_image_url(post.content) or ""
    cover_image_alt = safe_text(post.get("cover_image_alt")) or title

    published_at = normalize_date_value(post.get("published_at")) or normalize_date_value(post.get("created_at"))

    data = {
        "post_id": post_id,
        "title": title,
        "slug": slug,
        "summary": summary,
        "status": status,
        "language": safe_text(post.get("language")) or "en",
        "author": {
            "name": safe_text(author.get("name")) or "Ken Andersen",
        },
        "cover_image": cover_image,
        "cover_image_alt": cover_image_alt,
        "content_html": content_html,
        "body_markdown": body_markdown,
        "created_at": normalize_date_value(post.get("created_at")),
        "updated_at": normalize_date_value(post.get("updated_at")),
        "published_at": published_at,
        "published_at_display": display_date_value(published_at),
        "reading_time_minutes": estimate_reading_time(body_markdown),
        "meta_title": safe_text(seo.get("meta_title")) or title,
        "meta_description": safe_text(seo.get("meta_description"))
        or truncate_text(summary or strip_html(content_html), 160),
        "canonical_url": f"{SITE_URL}/blog/{slug}/",
    }
    return data


def load_published_posts() -> list[dict[str, Any]]:
    posts: list[dict[str, Any]] = []
    used_slugs: dict[str, Path] = {}

    if not BLOG_PUBLISHED_DIR.exists():
        return posts

    for path in sorted(BLOG_PUBLISHED_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue

        post = load_post(path)
        if not post:
            continue

        slug = post["slug"]
        if slug in used_slugs:
            raise RuntimeError(
                f"Duplicate blog slug '{slug}' in {path.name} and {used_slugs[slug].name}. "
                "Change one of the slugs before building."
            )
        used_slugs[slug] = path
        posts.append(post)

    posts.sort(key=lambda item: sortable_date(item.get("published_at") or item.get("created_at")), reverse=True)
    return posts


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def build_blog() -> list[dict[str, Any]]:
    ensure_blog_directories()

    env = Environment(
        loader=FileSystemLoader(str(BLOG_TEMPLATES_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )

    clean_dir(BLOG_OUTPUT_DIR)
    posts = load_published_posts()

    index_html = env.get_template("blog-index.html").render(
        posts=posts,
        canonical_url=f"{SITE_URL}/blog/",
        build_date=utc_today_iso(),
        page_language="en",
        site_url=SITE_URL,
    )
    write_text(BLOG_OUTPUT_DIR / "index.html", index_html)

    for post in posts:
        html = env.get_template("blog-post.html").render(
            **post,
            build_date=utc_today_iso(),
            page_language=post.get("language") or "en",
            site_url=SITE_URL,
        )
        write_text(BLOG_OUTPUT_DIR / post["slug"] / "index.html", html)

    sync_tree(BLOG_SOURCE_ASSETS_DIR, BLOG_PUBLIC_ASSETS_DIR)

    feed_xml = env.get_template("blog-feed.xml").render(
        posts=posts,
        site_url=SITE_URL,
        feed_updated=most_recent_post_datetime(posts),
    )
    write_text(BLOG_OUTPUT_DIR / "feed.xml", feed_xml)

    sitemap_xml = env.get_template("sitemap.xml").render(entries=build_sitemap_entries(posts))
    write_text(ROOT / "sitemap.xml", sitemap_xml)

    robots_txt = env.get_template("robots.txt").render(site_url=SITE_URL)
    write_text(ROOT / "robots.txt", robots_txt)

    llms_txt = env.get_template("llms.txt").render(site_url=SITE_URL, posts=posts[:10])
    write_text(ROOT / "llms.txt", llms_txt)

    return posts


def main() -> None:
    posts = build_blog()
    print(f"[OK] Built {len(posts)} blog page(s)")
    print(f"[OK] Blog output: {BLOG_OUTPUT_DIR}")
    print(f"[OK] Blog assets: {BLOG_PUBLIC_ASSETS_DIR}")


if __name__ == "__main__":
    main()
