#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import frontmatter
from flask import Flask, Response, abort, flash, jsonify, redirect, render_template, request, send_from_directory, url_for

from blog_common import (
    BLOG_DRAFTS_DIR,
    BLOG_PUBLISHED_DIR,
    BLOG_SOURCE_ASSETS_DIR,
    DEFAULT_AUTHOR_NAME,
    allowed_image_extension,
    build_public_asset_url,
    create_new_post,
    ensure_blog_directories,
    markdown_to_html,
    safe_text,
    sanitize_upload_filename,
    slugify,
    strip_leading_markdown_h1,
    truncate_text,
    utc_now_iso,
)
from publish_blog import publish_post


ROOT = Path(__file__).resolve().parent.parent
EDITORIAL_UI_DIR = ROOT / "editorial-ui"
TEMPLATES_DIR = EDITORIAL_UI_DIR / "templates"
STATIC_DIR = EDITORIAL_UI_DIR / "static"

DEFAULT_HOST = os.getenv("EDITORIAL_UI_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.getenv("EDITORIAL_UI_PORT", "8787"))
DEFAULT_SECRET_KEY = os.getenv("EDITORIAL_UI_SECRET_KEY", "kapsdevelopment-editorial-ui")


app = Flask(
    __name__,
    template_folder=str(TEMPLATES_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static/editorial-ui",
)
app.secret_key = DEFAULT_SECRET_KEY


@dataclass
class AssetView:
    name: str
    url: str
    alt: str


@dataclass
class DraftView:
    path: Path
    post_id: str
    title: str
    slug: str
    summary: str
    body: str
    preview_html: str
    created_at: str
    updated_at: str
    published_at: str
    author_name: str
    meta_title: str
    meta_description: str
    cover_image: str
    cover_image_alt: str
    status: str
    assets: list[AssetView]


@dataclass
class PostListItem:
    post_id: str
    title: str
    slug: str
    summary: str
    updated_at: str
    published_at: str


def markdown_preview(body: str) -> str:
    text = strip_leading_markdown_h1(body.strip())
    if not text:
        return '<p class="empty-state-copy">No body content yet.</p>'
    return markdown_to_html(text)


def format_timestamp(value: str, fallback: str = "Unknown") -> str:
    text = safe_text(value)
    if not text:
        return fallback

    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is not None:
            dt = dt.astimezone()
            return dt.strftime("%Y-%m-%d %H:%M")
        return dt.strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return text


def list_assets(post_id: str) -> list[AssetView]:
    asset_dir = BLOG_SOURCE_ASSETS_DIR / post_id
    if not asset_dir.exists():
        return []

    assets: list[AssetView] = []
    for path in sorted(asset_dir.iterdir()):
        if not path.is_file():
            continue
        alt = path.stem.replace("-", " ").replace("_", " ").strip() or "Image"
        assets.append(
            AssetView(
                name=path.name,
                url=build_public_asset_url(post_id, path.name),
                alt=alt,
            )
        )
    return assets


def build_draft_view(path: Path) -> DraftView:
    post = frontmatter.load(path)
    author = post.get("author", {})
    if not isinstance(author, dict):
        author = {}

    seo = post.get("seo", {})
    if not isinstance(seo, dict):
        seo = {}

    post_id = safe_text(post.get("post_id")) or path.stem
    title = safe_text(post.get("title")) or "Untitled post"
    summary = safe_text(post.get("summary"))
    body = post.content.strip()

    return DraftView(
        path=path,
        post_id=post_id,
        title=title,
        slug=safe_text(post.get("slug")) or slugify(title, fallback=post_id),
        summary=summary,
        body=body,
        preview_html=markdown_preview(body),
        created_at=format_timestamp(safe_text(post.get("created_at"))),
        updated_at=format_timestamp(safe_text(post.get("updated_at")) or safe_text(post.get("created_at"))),
        published_at=format_timestamp(safe_text(post.get("published_at"))),
        author_name=safe_text(author.get("name")) or DEFAULT_AUTHOR_NAME,
        meta_title=safe_text(seo.get("meta_title")),
        meta_description=safe_text(seo.get("meta_description")),
        cover_image=safe_text(post.get("cover_image")),
        cover_image_alt=safe_text(post.get("cover_image_alt")),
        status=safe_text(post.get("status")) or "draft",
        assets=list_assets(post_id),
    )


def build_post_list_item(path: Path, status: str) -> PostListItem:
    post = frontmatter.load(path)
    title = safe_text(post.get("title")) or path.stem.replace("-", " ").title()
    summary = safe_text(post.get("summary")) or truncate_text(post.content, 160)
    return PostListItem(
        post_id=safe_text(post.get("post_id")) or path.stem,
        title=title,
        slug=safe_text(post.get("slug")) or slugify(title, fallback=path.stem),
        summary=summary,
        updated_at=format_timestamp(safe_text(post.get("updated_at")) or safe_text(post.get("created_at"))),
        published_at=format_timestamp(safe_text(post.get("published_at")) if status == "published" else ""),
    )


def list_drafts() -> list[DraftView]:
    drafts = [
        build_draft_view(path)
        for path in BLOG_DRAFTS_DIR.glob("*.md")
        if not path.name.startswith("_")
    ]
    drafts.sort(key=lambda draft: draft.path.stat().st_mtime, reverse=True)
    return drafts


def list_published_posts() -> list[PostListItem]:
    posts = [
        build_post_list_item(path, status="published")
        for path in BLOG_PUBLISHED_DIR.glob("*.md")
        if not path.name.startswith("_")
    ]
    posts.sort(key=lambda item: item.published_at, reverse=True)
    return posts


def resolve_draft_path(post_id: str) -> Path:
    path = BLOG_DRAFTS_DIR / f"{post_id}.md"
    if not path.exists():
        abort(404)
    return path


def slug_conflicts(slug: str, current_post_id: str) -> bool:
    for directory in (BLOG_DRAFTS_DIR, BLOG_PUBLISHED_DIR):
        for path in directory.glob("*.md"):
            if path.name.startswith("_"):
                continue
            post = frontmatter.load(path)
            post_id = safe_text(post.get("post_id")) or path.stem
            if post_id == current_post_id:
                continue
            existing_slug = safe_text(post.get("slug")) or slugify(safe_text(post.get("title")), fallback=post_id)
            if existing_slug == slug:
                return True
    return False


def save_draft_from_form(path: Path, form: Any) -> DraftView:
    post = frontmatter.load(path)
    post_id = safe_text(post.get("post_id")) or path.stem

    title = safe_text(form.get("title"))
    body = safe_text(form.get("body"))
    if not title:
        raise ValueError("Title is required.")
    if not body:
        raise ValueError("Body is required.")

    slug = slugify(safe_text(form.get("slug")) or title, fallback=post_id)
    if slug_conflicts(slug, current_post_id=post_id):
        raise ValueError(f"Slug '{slug}' is already used by another post.")

    author_name = safe_text(form.get("author_name")) or DEFAULT_AUTHOR_NAME
    summary = safe_text(form.get("summary"))
    now = utc_now_iso()

    seo = post.get("seo", {})
    if not isinstance(seo, dict):
        seo = {}
    seo["meta_title"] = safe_text(form.get("meta_title"))
    seo["meta_description"] = safe_text(form.get("meta_description"))

    post["post_id"] = post_id
    post["title"] = title
    post["slug"] = slug
    post["summary"] = summary
    post["status"] = safe_text(post.get("status")) or "draft"
    post["created_at"] = safe_text(post.get("created_at")) or now
    post["updated_at"] = now
    post["language"] = "en"
    post["author"] = {"name": author_name}
    post["seo"] = seo
    post["cover_image"] = safe_text(form.get("cover_image"))
    post["cover_image_alt"] = safe_text(form.get("cover_image_alt"))

    post.content = body.strip() + "\n"
    path.write_text(frontmatter.dumps(post), encoding="utf-8")
    return build_draft_view(path)


@app.context_processor
def template_globals() -> dict[str, Any]:
    return {
        "draft_count": len(list_drafts()),
        "published_count": len(list_published_posts()),
    }


@app.get("/healthz")
def healthz() -> tuple[str, int]:
    return "ok", 200


@app.get("/assets/blog/<path:asset_path>")
def serve_source_asset(asset_path: str) -> Response:
    return send_from_directory(str(BLOG_SOURCE_ASSETS_DIR), asset_path)


@app.get("/")
def index() -> Response:
    return redirect(url_for("drafts_index"))


@app.get("/drafts")
def drafts_index() -> str:
    return render_template(
        "drafts.html",
        drafts=list_drafts(),
        published_posts=list_published_posts(),
    )


@app.post("/drafts/new")
def new_draft() -> Response:
    ensure_blog_directories()
    post = create_new_post()
    post_id = safe_text(post.get("post_id"))
    target_path = BLOG_DRAFTS_DIR / f"{post_id}.md"
    target_path.write_text(frontmatter.dumps(post), encoding="utf-8")
    flash("New draft created.", "success")
    return redirect(url_for("edit_draft", post_id=post_id))


@app.get("/drafts/<post_id>")
def edit_draft(post_id: str) -> str:
    draft = build_draft_view(resolve_draft_path(post_id))
    return render_template("draft_edit.html", draft=draft)


@app.post("/drafts/<post_id>/save")
def save_draft(post_id: str) -> Response:
    try:
        draft = save_draft_from_form(resolve_draft_path(post_id), request.form)
    except ValueError as exc:
        flash(str(exc), "error")
        return redirect(url_for("edit_draft", post_id=post_id))

    flash("Draft saved.", "success")
    return redirect(url_for("edit_draft", post_id=draft.post_id))


@app.post("/drafts/<post_id>/publish")
def publish_draft(post_id: str) -> Response:
    try:
        draft = save_draft_from_form(resolve_draft_path(post_id), request.form)
        publish_post(draft.post_id)
    except (ValueError, FileExistsError, FileNotFoundError, RuntimeError) as exc:
        flash(str(exc), "error")
        return redirect(url_for("edit_draft", post_id=post_id))

    flash("Draft published and blog pages rebuilt.", "success")
    return redirect(url_for("drafts_index"))


@app.post("/drafts/<post_id>/upload-image")
def upload_image(post_id: str) -> Response:
    path = resolve_draft_path(post_id)
    if not path.exists():
        return jsonify({"error": "Draft not found."}), 404

    file = request.files.get("image")
    if file is None or not safe_text(file.filename):
        return jsonify({"error": "Choose an image file first."}), 400

    if not allowed_image_extension(file.filename):
        return jsonify({"error": "Supported formats: png, jpg, jpeg, webp, gif, avif."}), 400

    asset_dir = BLOG_SOURCE_ASSETS_DIR / post_id
    asset_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%H%M%S")
    safe_name = sanitize_upload_filename(file.filename)
    final_name = f"{timestamp}-{safe_name}"
    final_path = asset_dir / final_name
    file.save(final_path)

    asset_url = build_public_asset_url(post_id, final_name)
    alt_text = final_path.stem.replace("-", " ").strip() or "Image"

    return jsonify(
        {
            "asset_url": asset_url,
            "filename": final_name,
            "markdown": f"![{alt_text}]({asset_url})",
        }
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Kapsdevelopment editorial UI.")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host to bind. Defaults to 127.0.0.1.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to bind. Defaults to 8787.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_blog_directories()
    app.run(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
