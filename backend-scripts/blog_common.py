from __future__ import annotations

import os
import re
import secrets
import shutil
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import frontmatter
import markdown


ROOT = Path(__file__).resolve().parent.parent
CONTENT_BLOG_DIR = ROOT / "content" / "blog"
BLOG_DRAFTS_DIR = CONTENT_BLOG_DIR / "drafts"
BLOG_PUBLISHED_DIR = CONTENT_BLOG_DIR / "published"
BLOG_SOURCE_ASSETS_DIR = CONTENT_BLOG_DIR / "assets"

BLOG_OUTPUT_DIR = ROOT / "blog"
BLOG_PUBLIC_ASSETS_DIR = ROOT / "assets" / "blog"
BLOG_TEMPLATES_DIR = ROOT / "build-templates"

SITE_URL = os.getenv("BLOG_SITE_URL", "https://kapsdevelopment.com").rstrip("/")
DEFAULT_AUTHOR_NAME = os.getenv("BLOG_AUTHOR_NAME", "Ken Andersen").strip() or "Ken Andersen"

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}


def ensure_blog_directories() -> None:
    BLOG_DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    BLOG_PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    BLOG_SOURCE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)


def clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def sync_tree(source: Path, target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)

    if source.exists():
        shutil.copytree(source, target)
    else:
        target.mkdir(parents=True, exist_ok=True)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def utc_today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def safe_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    return ""


def slugify(text: str, fallback: str) -> str:
    value = safe_text(text).lower()
    value = re.sub(r"[’'`]", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or fallback.lower()


def create_post_id() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y_%m_%d_%H%M%S")
    return f"blog_{timestamp}_{secrets.token_hex(3)}"


def normalize_date_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    return text or None


def display_date_value(value: Any) -> str | None:
    normalized = normalize_date_value(value)
    if not normalized:
        return None

    if "T" in normalized:
        date_prefix = normalized.split("T", 1)[0]
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_prefix):
            return date_prefix

    return normalized


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def truncate_text(text: str, max_length: int = 180) -> str:
    normalized = " ".join((text or "").split())
    if len(normalized) <= max_length:
        return normalized
    return normalized[: max_length - 1].rsplit(" ", 1)[0] + "…"


def first_non_heading_paragraph_text(markdown_text: str) -> str:
    parts = [part.strip() for part in markdown_text.split("\n\n") if part.strip()]
    for part in parts:
        if part.startswith("#"):
            continue
        if part.startswith("!["):
            continue
        if part.startswith("<figure"):
            continue
        return part
    return ""


def extract_first_image_url(markdown_text: str) -> str | None:
    markdown_match = re.search(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)", markdown_text)
    if markdown_match:
        return markdown_match.group(1).strip()

    html_match = re.search(r'<img[^>]+src="([^"]+)"', markdown_text)
    if html_match:
        return html_match.group(1).strip()

    return None


def strip_leading_markdown_h1(markdown_text: str) -> str:
    parts = [part.strip() for part in markdown_text.split("\n\n") if part.strip()]
    if parts and parts[0].startswith("# "):
        parts = parts[1:]
    return "\n\n".join(parts).strip()


def markdown_to_html(markdown_text: str) -> str:
    return markdown.markdown(
        markdown_text,
        extensions=["extra", "smarty", "sane_lists", "fenced_code", "tables"],
    )


def estimate_reading_time(markdown_text: str, words_per_minute: int = 220) -> int:
    text = strip_html(markdown_to_html(markdown_text))
    words = len(text.split())
    if words <= 0:
        return 1
    return max(1, round(words / words_per_minute))


def allowed_image_extension(filename: str) -> bool:
    return Path(filename).suffix.lower() in IMAGE_EXTENSIONS


def sanitize_upload_filename(filename: str) -> str:
    original = Path(filename)
    suffix = original.suffix.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", original.stem.lower()).strip("-")
    stem = stem or "image"
    return f"{stem}{suffix}"


def build_public_asset_url(post_id: str, filename: str) -> str:
    return f"/assets/blog/{post_id}/{filename}"


def create_new_post() -> frontmatter.Post:
    post_id = create_post_id()
    title = "Untitled post"
    slug = slugify(f"untitled-{post_id[-6:]}", fallback=post_id)
    now = utc_now_iso()
    metadata = {
        "post_id": post_id,
        "title": title,
        "slug": slug,
        "summary": "",
        "status": "draft",
        "created_at": now,
        "updated_at": now,
        "published_at": None,
        "language": "en",
        "author": {
            "name": DEFAULT_AUTHOR_NAME,
        },
        "seo": {
            "meta_title": "",
            "meta_description": "",
        },
        "cover_image": "",
        "cover_image_alt": "",
    }
    content = "# Untitled post\n\nWrite here.\n"
    return frontmatter.Post(content, **metadata)
