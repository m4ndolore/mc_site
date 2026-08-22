# Merge Combinator Print Assets

## What's Here
- `mc-logo-full.svg` — Editable full logo (text layers + vector arrows).
- `mc-logo-full-render.png` — Rasterized render of the full logo.
- `mc-logo-text.svg` / `mc-logo-text.png` — Wordmark only, no arrow mark.
- `mc-logo-bad.png` — Known-bad render kept for comparison; do not ship.
- `arrows-2.png` — Arrow mark raster.

## Typography (Navbar Spec)
- **Merge**: Lora, italic, 11px in navbar (scaled 2× in `mc-logo-full.svg`).
- **Combinator**: Helvetica Neue / Inter, 22px in navbar (scaled 2× in `mc-logo-full.svg`).

See `styles.css` under `.nav__logo-merge` and `.nav__logo-combinator` for the exact spec.

## Print Notes
- For production, outline fonts before exporting final artwork.
- The PNG logo is large enough for 3" wide prints at 300 DPI.
- `mc-logo-full.svg` carries the arrow mark as true vector paths.
