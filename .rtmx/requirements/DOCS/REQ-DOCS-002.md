# REQ-DOCS-002: Unified Navigation Between mc-site and docs

## Description
Create consistent navigation experience between the main mc-site and docs.mergecombinator.com, allowing users to seamlessly move between properties.

## Target
**Metric**: Consistent header/nav across mc-site and docs properties

## Acceptance Criteria
- [ ] Navigation links to docs visible on mc-site
- [ ] Navigation links to mc-site visible on docs
- [ ] Consistent visual styling across properties
- [ ] Breadcrumb awareness of cross-site context
- [ ] Mobile-responsive navigation

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
- **Status**: PENDING
- **Phase**: 3
- **Priority**: MEDIUM

## Validation
- **Method**: Visual Test
- Screenshot mc-site header
- Screenshot docs header
- Verify visual consistency

## Dependencies
- REQ-DOCS-001 (SSO should be working first)
