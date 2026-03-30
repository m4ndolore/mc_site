# Merge Combinator Print Placement Sheets

**Version:** 1.0
**Date:** 2026-01-30

---

## Overview

This directory contains print placement specifications for all Merge Combinator merchandise categories. These sheets guide production vendors on exact dimensions, positioning, and print methods.

---

## Index

| Category | File | SKU Prefix |
|----------|------|------------|
| [Polos](./polo-placement.md) | `polo-placement.md` | MC-POLO-* |
| [T-Shirts](./tee-placement.md) | `tee-placement.md` | MC-TEE-* |
| [Hawaiian Shirts](./aloha-placement.md) | `aloha-placement.md` | MC-ALOHA-* |
| [Patches](./patch-placement.md) | `patch-placement.md` | MC-PATCH-* |
| [Stickers](./sticker-placement.md) | `sticker-placement.md` | MC-STICKER-* |
| [Caps](./cap-placement.md) | `cap-placement.md` | MC-CAP-* |
| [Accessories](./accessory-placement.md) | `accessory-placement.md` | MC-NOTE-*, MC-MAT-* |

---

## Quick Reference

### Standard Dimensions

| Placement | Polos | T-Shirts | Alohas |
|-----------|-------|----------|--------|
| **Chest Logo Width** | 3.0 in | 3.25 in | 2.5-3.0 in |
| **Back Arrows Width** | 1.5 in | 1.75 in | 1.25-1.5 in (optional) |
| **Top Edge from Collar** | 2.5-3.0 in | 2.5-3.0 in | 2.5-3.0 in |
| **Back Arrows from Collar** | 1.0-1.25 in | 1.0-1.25 in | 1.0-1.25 in |

### Print Colors

| Fabric Color | Print Color |
|--------------|-------------|
| Black | White |
| Slate | White |
| Navy | White |
| Charcoal | White / Light Gray |
| Carbon | White |
| Midnight | White |
| Deep Blue | White |
| Sand | Black |
| Olive | White / Tan |

---

## Brand Rules (All Products)

1. **Single-color prints only** - No gradients, no drop shadows, no outlines
2. **Typography** - Inter or Space Grotesk, 600-700 weight, ALL CAPS, +40 to +80 tracking
3. **Proportions** - Never stretch logos; maintain aspect ratio
4. **Outline fonts** - Convert text to paths before production
5. **Quality** - PNG assets are 300 DPI capable

---

## Print Assets Location

All print-ready assets are in `docs/merch/assets/`:

| File | Format | Usage |
|------|--------|-------|
| `mc-logo-full.png` | PNG | High-res full logo |
| `mc-logo-full.svg` | SVG | Editable full logo |
| `mc-arrows.png` | PNG | Arrows-only mark |
| `mc-arrows.svg` | SVG | Editable arrows |

---

## Approval Workflow

1. Vendor receives placement sheets
2. Vendor produces sample/proof
3. Stakeholder reviews for:
   - Correct positioning
   - Correct dimensions
   - Color accuracy
   - Print quality
4. Approval or revision request
5. Production run after approval

---

## Related Documents

- [Mockup Spec](../mockup-spec.md) - Brand placement rules
- [Catalog CSV](../catalog.csv) - Product list
- [Fourthwall Import](../fourthwall-import.csv) - E-commerce data
- [Assets README](../assets/README.md) - Asset details
