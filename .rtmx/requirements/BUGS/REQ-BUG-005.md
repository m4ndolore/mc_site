# REQ-BUG-005: Inconsistent script type="module" loading across pages

## Summary
Multiple HTML pages had inconsistent `type="module"` attributes on script tags, causing Vite build warnings and potential runtime issues.

## Issue
- `dashboard.html` and `combine.html` loaded `script.js` without `type="module"`
- `builders.html` loaded `auth-nav.js` with `type="module"` (not needed for IIFE pattern)
- Vite cannot bundle scripts without `type="module"` attribute

## Impact
- Build warnings for unbundled scripts
- Potential module scope conflicts
- Inconsistent JS execution patterns

## Fix Applied
1. Added `type="module"` to `script.js` in dashboard.html and combine.html
2. Removed `type="module"` from `auth-nav.js` in builders.html (IIFE doesn't need it)
3. Standardized pattern: `script.js` always has `type="module"`, `auth-nav.js` never needs it

## Files Changed
- `dashboard.html` (line 120-122)
- `combine.html` (line 662-663)
- `builders.html` (line 309)

## Validation
- Build passes with fewer warnings
- Pages load correctly in dev server

## Status
- **Status**: COMPLETE
- **Completed**: 2026-01-30
