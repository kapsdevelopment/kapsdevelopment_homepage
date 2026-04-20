# Kapsdevelopment Blog Workflow

This repo now includes a local editorial workflow for the English Kapsdevelopment blog.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Start the local editor

```bash
python3 backend-scripts/editorial_ui.py
```

Default local URL:

```text
http://127.0.0.1:8787
```

## Writing flow

1. Open the local editorial UI.
2. Create a new draft.
3. Write the article in Markdown.
4. Upload images from the editor when you want to place them inline.
5. Save while drafting.
6. Press `Publish` when you want the static site files rebuilt.

## Where things live

- Drafts: `content/blog/drafts/`
- Published post source: `content/blog/published/`
- Source images: `content/blog/assets/<post_id>/`
- Generated blog pages: `blog/`
- Generated public images: `assets/blog/`
- Generated discovery files: `blog/feed.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`

## Manual deploy

Publishing in the editor does not commit or push anything.

After publishing, you can review the generated files and deploy manually:

```bash
git status
git add content/blog/published content/blog/assets blog assets/blog
git commit -m "Publish blog post"
git push
```
