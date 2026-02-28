# AI and Search Indexing Notes

## Goals
- Make core pages discoverable for search engines and AI systems.
- Keep canonical references consistent.
- Ensure About page (`/about`) is publicly indexable.

## Implemented
- `about.html`:
  - canonical URL set to `https://mergecombinator.com/about`
  - robots meta allows indexing and rich previews
  - `AboutPage` JSON-LD added
- `public/sitemap.xml`:
  - includes `https://mergecombinator.com/about`
- `public/robots.txt`:
  - global allow
  - sitemap reference
  - explicit allow for `/llms.txt`
- `public/llms.txt`:
  - AI-facing index guide with canonical page map and usage notes

## Recommended Ongoing Practices
- Keep all nav/footer “About” links pointed to `/about`.
- Keep canonical URLs on top-level pages (`/`, `/about`, `/access`, `/builders`).
- Update `public/llms.txt` when key pages, naming, or public positioning changes.
- Keep sitemap URLs in canonical path format (prefer non-`.html` public paths).
