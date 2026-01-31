# REQ-BUG-004: Partner logos referenced wrong path in index.html

## Summary
Partner logo images in the homepage "Integration Partners" section were referencing the wrong path, causing broken images.

## Root Cause
The logos exist in `assets/logos/partners/` but index.html referenced them from `assets/logos/` (missing the `/partners/` subdirectory).

## Affected Files
- `/index.html` lines 873-879

## Fix Applied
Changed paths from `assets/logos/*.svg` to `assets/logos/partners/*.svg` for all 7 partner logos:
- indopacom.svg
- DIU.svg
- AFSOC.svg
- AFRL.svg
- 613_aoc.svg
- sofwerx.svg
- tak_product_center.svg

## Validation
- Build passes (`npm run build` exit 0)
- Vite now bundles the partner logo assets (visible in build output)

## Sitrep - 2026-01-30

**Session**: claude-2026-01-30
**Status**: COMPLETE

### Completed
- Identified broken image paths during codebase scan
- Fixed path references in index.html
- Verified build passes and assets are bundled

### Discovery Method
Automated codebase scan comparing `<img src>` references against existing file paths in `assets/logos/` directory.
