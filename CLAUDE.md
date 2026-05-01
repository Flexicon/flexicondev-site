# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Tailwind watch + Hugo server concurrently)
make dev

# Production build
make build

# Hugo server only (chicago7 theme uses Dart Sass, no Tailwind needed)
hugo server --disableFastRender

# Generate OG images
make og-image
```

> Note: `make dev` and `npm run tailwind:watch` are leftovers from the Blowfish era and point to `themes/blowfish/` paths. The chicago7 theme uses Dart Sass instead — `hugo server` is sufficient for development.

## Architecture

**Stack**: Hugo static site generator, deployed on Netlify (`netlify.toml`). Domain: flexicon.dev.

**Theme**: `themes/chicago7` (git submodule, https://github.com/akopdev/hugo-theme-chicago7). Requires Dart Sass (`brew install sass/sass/sass`). A second submodule `themes/blowfish` remains for reference during migration.

**Config**: Split across `config/_default/`:
- `hugo.toml` — base URL, taxonomies, outputs, pagination
- `params.toml` — chicago7 params: `author` (plain string), `[social]` block
- `menus.en.toml` — uses `[[header]]` entries (chicago7 uses `.Site.Menus.header`)
- `languages.en.toml` — language/locale settings
- `params.toml.blowfish-backup` — archived blowfish config for reference

**Content**: `content/about/index.md` is the CV/resume page. `content/posts/` contains blog posts. `content/_index.md` is the homepage intro.

## Active Migration: Blowfish → Chicago7 (branch: redesign-2026)

The site is mid-migration from Blowfish to Chicago7. Key things to know:

- **`layouts.blowfish-backup/`** — archived blowfish layouts and shortcodes; not active but kept for reference
- **`layouts/shortcodes/`** — currently active shortcodes restored from the blowfish era; they use Tailwind CSS classes which no longer compile. These need migrating to plain CSS or chicago7-compatible markup
- **About page** — currently renders with the blog post (single) layout; needs a dedicated layout. Chicago7 provides `layouts/page/single.html` for standalone pages — content front matter should use `layout: page` or a custom layout should be created
- **Shortcodes using Tailwind**: `badges.html`, `avatar.html`, `work.html`, `print_skills.html`, `print_contact_info.html` — all reference Tailwind utility classes that no longer apply; these need to be rewritten with plain CSS or inline styles
- **Data files**: `work.json`, `skills.json`, `contact.json` live as page resources alongside `content/about/index.md` and are loaded by the shortcodes

## Chicago7 Theme Conventions

- Menus: `[[header]]` in `menus.en.toml` (not `[[main]]`)
- Author: plain string `author = "Name"` in `params.toml` (not a nested object)
- Social links: `[social]` table in `params.toml` with keys matching icon filenames in `themes/chicago7/static/icons/`
- Standalone pages (like About): use front matter `layout: page` to get `layouts/page/single.html` instead of the default blog post layout
