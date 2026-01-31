# REQ-MERCH-003: Product Copy + Tags (Operational Tone)

## Description
Write final product descriptions, tag sets, and listing metadata for all merch items. Language must remain operational and brand-consistent (no charity/consumer framing).

## Target
**Metric**: All listings have consistent operational copy and tag sets.

## Reference
- `docs/merch/catalog.csv` (draft descriptions)
- `docs/ai/RULES.md` (no hardcoded config, tone guidance)

## Acceptance Criteria
- [x] Each item has final product title + short description
- [x] Tags are consistent across similar products
- [x] Copy avoids charity language and consumer marketing tone
- [x] Copy aligns with approved slogans (BWWN, RAD, Chatham House)

## Implementation Notes
- Keep copy concise and tactical.
- Ensure uniform naming conventions across categories.

## Validation
- **Method**: Manual Review
- Stakeholder review for brand alignment.

## Status
- **Status**: COMPLETE
- **Phase**: 2
- **Priority**: MEDIUM

## Dependencies
- REQ-MERCH-001 (final SKU list)

---

## Implementation Notes

### Files Created/Updated

1. **`docs/merch/product-copy.md`** - Comprehensive product copy guide
   - Full descriptions for all 19 products
   - Tag taxonomy with category, theme, descriptor, and material tags
   - Brand voice guidelines (DO/DON'T)
   - Anti-pattern list (phrases to avoid)
   - SEO metadata format

2. **`docs/merch/catalog.csv`** - Updated with standardized tags
   - Consistent 5-tag format per product
   - Added `apparel` and `accessories` meta-tags
   - Cleaned up SKU naming (e.g., `MC-ALOHA-SIG` not `MC-ALOHA-SIGNAL`)

### Tag Taxonomy

| Tag Type | Examples |
|----------|----------|
| Category | `polo`, `tee`, `aloha`, `patch`, `sticker`, `cap` |
| Theme | `ops`, `bwwn`, `rad`, `chatham`, `govcon`, `air` |
| Descriptor | `core`, `minimal`, `tactical`, `spicy`, `strategic` |
| Material | `apparel`, `accessories`, `velcro`, `vinyl`, `embroidered` |

### Copy Tone Compliance

All copy reviewed for operational tone:
- No charity language ("support", "give back")
- No consumer marketing ("premium", "exclusive", "limited")
- Action-oriented verbs ("build", "deploy", "signal")
- Directive statements over passive descriptions

---

## Sitrep - 2026-01-30

**Session**: claude-session
**Status**: COMPLETE

### Completed
- Created product-copy.md with full descriptions and guidelines
- Standardized tag taxonomy across all products
- Updated catalog.csv with consistent tagging
- Documented anti-patterns and brand voice rules
- Added SEO metadata format guidance

### Remaining
- Stakeholder review for final approval (manual step)

### Blockers
- None

### Next Steps
- Use product-copy.md for e-commerce listings
- Reference tag taxonomy for filtering/search
- All Phase 2 MERCH requirements complete
