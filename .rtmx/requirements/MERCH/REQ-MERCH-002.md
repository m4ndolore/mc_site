# REQ-MERCH-002: Print Placement Sheets + Mockups

## Description
Create print placement sheets and mockups for each merch category to guide production and review. This includes front/back placement sizes and clear callouts for the full logo and arrows marks.

## Target
**Metric**: Each product category has an approved placement sheet with dimensions.

## Reference
- `docs/merch/mockup-spec.md`
- `docs/merch/assets/` (print assets)

## Acceptance Criteria
- [x] Placement sheets for polos, tees, aloha shirts, patches, stickers
- [x] Front placement dimensions specified in inches
- [x] Back/collar placement dimensions specified in inches
- [x] Uses updated arrows mark and full logo
- [x] Single-color print guidance preserved

## Implementation Notes
- Use consistent size callouts (e.g., 3.0 in / 3.25 in chest; 1.0 in collar arrows).
- Keep outputs in `docs/merch/` with descriptive filenames.

## Validation
- **Method**: Visual Test
- Review sheets with stakeholders for correctness.

## Status
- **Status**: COMPLETE
- **Phase**: 2
- **Priority**: MEDIUM

## Dependencies
- REQ-MERCH-001 (final SKU list)

---

## Implementation Notes

### Files Created

All placement sheets are in `docs/merch/placement-sheets/`:

| File | Category | SKUs |
|------|----------|------|
| `polo-placement.md` | Polos | MC-POLO-* |
| `tee-placement.md` | T-Shirts | MC-TEE-* |
| `aloha-placement.md` | Hawaiian Shirts | MC-ALOHA-* |
| `patch-placement.md` | Patches | MC-PATCH-* |
| `sticker-placement.md` | Stickers | MC-STICKER-* |
| `cap-placement.md` | Caps | MC-CAP-* |
| `accessory-placement.md` | Accessories | MC-NOTE-*, MC-MAT-* |
| `README.md` | Index + Quick Reference | All |

### Dimension Summary

| Category | Chest Logo | Back Arrows | Notes |
|----------|------------|-------------|-------|
| Polos | 3.0 in | 1.5 in | Standard apparel |
| T-Shirts | 3.25 in | 1.75 in | Slightly larger |
| Alohas | 2.5-3.0 in | 1.25-1.5 in | Back optional |
| Patches | 3.0 in | N/A | Single-sided |
| Stickers | 2.0 in | N/A | Die-cut |
| Caps | 2.5 in | N/A | Embroidery |

### Documentation Coverage

Each placement sheet includes:
- ASCII diagram showing exact placement
- Dimension tables in inches and mm
- Color specifications (fabric → print color)
- Print method recommendations
- Production notes
- SKU reference

---

## Sitrep - 2026-01-30

**Session**: claude-session
**Status**: COMPLETE

### Completed
- Created 7 category-specific placement sheets
- Added index/README with quick reference
- Documented all dimensions per mockup-spec.md
- Included print color guidance for all fabric colors
- Added production method recommendations

### Remaining
- Stakeholder review and approval (manual step)

### Blockers
- None

### Next Steps
- Share placement sheets with production vendors
- Proceed with REQ-MERCH-003 (product copy finalization)
