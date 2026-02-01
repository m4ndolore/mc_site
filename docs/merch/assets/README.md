# Merge Combinator Print Assets

## What's Here
- `mc-logo-full.png` — High‑res full logo (text + arrows) from `assets/logos/merge-combinator-logo.png`.
- `mc-logo-full.svg` — Editable SVG with text layers + **vector** arrows.
- `mc-arrows.png` — Current arrow mark (source: `arrows-new.png`).
- `mc-arrows.svg` — Vector trace of `mc-arrows.png` (generated via potrace).
- `arrows-new.png` — Source art provided on 2026-01-30.

## Typography (Navbar Spec)
- **Merge**: Lora, italic, 11px in navbar (scaled 2× in `mc-logo-full.svg`).
- **Combinator**: Helvetica Neue / Inter, 22px in navbar (scaled 2× in `mc-logo-full.svg`).

See `styles.css` under `.nav__logo-merge` and `.nav__logo-combinator` for the exact spec.

## Print Notes
- For production, outline fonts before exporting final artwork.
- The PNG logo is large enough for 3" wide prints at 300 DPI.
- `mc-logo-full.svg` embeds `mc-arrows.svg` (true vector arrows).
