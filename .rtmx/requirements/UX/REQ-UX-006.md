# REQ-UX-006: Consolidate Page-Specific CSS

## Metadata
- **Status**: PENDING
- **Priority**: MEDIUM
- **Phase**: 4
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-UX-002
- **Blocks**: None

## Requirement
Consolidate scattered CSS into a maintainable architecture with clear separation between global styles and page-specific overrides.

## Current State
CSS files:
- `styles.css` - Main stylesheet (4600+ lines)
- `styles/builders.css` - Builders page light theme
- `styles/builders-dark.css` - Builders dark override
- `styles/dashboard.css` - Dashboard C2UX styles
- `dark-theme.css` - Site-wide dark override
- `subpage.css` - Subpage styles (212 lines)

Inline styles:
- `access.html` - 500+ lines of inline CSS
- `knowledge.html` - 300+ lines of inline CSS
- `style-guide.html` - Embedded styles (acceptable for reference)

## Target Architecture
```
styles/
├── base.css          # Reset, variables, typography
├── components.css    # Buttons, cards, panels, nav
├── layouts.css       # Grid, section, container
├── pages/
│   ├── builders.css  # Dark-native
│   ├── dashboard.css # C2UX console
│   └── knowledge.css # Knowledge hub
└── main.css          # Imports all above
```

Or simplified:
```
styles.css            # All base + components (dark-native)
styles/dashboard.css  # C2UX operational overrides
styles/builders.css   # Builder directory specifics
```

## Acceptance Criteria
- [ ] No inline `<style>` blocks exceeding 50 lines
- [ ] Clear import hierarchy documented
- [ ] CSS file count reduced by 50%
- [ ] Duplicate rules eliminated
- [ ] Build output size reduced
- [ ] Developer can find any style within 30 seconds

## Implementation Steps
1. Extract `access.html` inline styles to `styles/access.css`
2. Extract `knowledge.html` inline styles to `styles/knowledge.css`
3. Merge `dark-theme.css` into `styles.css` (per REQ-UX-002)
4. Merge `builders-dark.css` into `builders.css`
5. Audit for duplicate rules
6. Document import order

## Validation
- All pages render correctly after consolidation
- Build passes
- No 404s on CSS requests
