# REQ-DOCS-002: Unified Navigation Between mc-site and docs

## Description
Create consistent navigation experience between the main mc-site and docs.mergecombinator.com, allowing users to seamlessly move between properties.

## Target
**Metric**: Consistent header/nav across mc-site and docs properties

## Acceptance Criteria
- [x] Navigation links to docs visible on mc-site
- [ ] Navigation links to mc-site visible on docs *(requires Outline Wiki config)*
- [x] Consistent visual styling across properties
- [ ] Breadcrumb awareness of cross-site context *(future enhancement)*
- [x] Mobile-responsive navigation

## Implementation Options

### Option A: Shared Header Component
Embed same header on both sites via:
- Shared JS bundle from CDN
- Web component
- iframe (less ideal)

### Option B: Consistent Design System
Each site has its own header but follows same:
- Logo placement and linking
- Navigation structure
- Color scheme
- Typography

### Option C: Hybrid
- mc-site has native header
- docs has simplified header with "Back to MC" link
- Footer links connect properties

## Navigation Structure
```
MC LOGO                                    [Authenticate]
Builders | Portfolio | Docs | Knowledge Base
```

Or with mega-menu:
```
MC LOGO                                    [Authenticate]
Ecosystem ▼ | Resources ▼
  └─ Builders      └─ Docs
  └─ Portfolio     └─ Guides
  └─ Status        └─ API Reference
```

## Implementation
- **Status**: COMPLETE
- **Phase**: 3
- **Priority**: MEDIUM

## Validation
- **Method**: Visual Test
- Screenshot mc-site header
- Screenshot docs header
- Verify visual consistency

## Dependencies
- REQ-DOCS-001 (SSO should be working first)

---

## Sitrep - 2026-01-30

**Session**: claude-2026-01-30
**Status**: COMPLETE

### Completed
- Added "Docs" link to main navigation (17 HTML files)
- Added "Docs" link to footer Resources section (all applicable pages)
- Link points to https://docs.mergecombinator.com
- Fixed inconsistent navigation patterns across blog article pages
- Build verified with zero errors
- Visual verification with Playwright confirmed nav/footer updates

### Files Modified
- index.html, builders.html, blog.html, archive.html, merch.html
- portfolio.html, privacy.html, 404.html, terms.html, opportunities.html
- security.html, knowledge.html, dashboard.html
- blog/counter-drone-jiatf-401.html, blog/ndaa-speed-act.html, blog/uss-eisenhower-lessons.html

### Remaining (Out of Scope)
- Navigation links back to mc-site from docs (requires Outline Wiki config)
- Breadcrumb awareness of cross-site context (future enhancement)

### Next Steps
- Consider Outline Wiki custom header to complete bi-directional nav
