# Company Modal Enhancement Ideas

## Overview
Future enhancements for the company modal to provide richer preview experience on the My Company page without page navigation.

## Current State
- Company modal exists on cohorts page with full functionality
- My Company "Preview Full Profile" button opens cohorts page in new tab
- Modal includes: Quick Stats, Synopsis sections, Contact info, Mission/Tech details

## Enhancement Ideas

### 1. Shared Modal JavaScript Module
**Goal**: Single source of truth for modal rendering logic

**Implementation**:
- Extract `showCompanyModal()` from `custom-cohorts.hbs` into `assets/js/company-modal-shared.js`
- Include shared module on both cohorts and my-company pages
- Functions to extract:
  - `showCompanyModal(airtableId)`
  - `buildQuickStats(company)`
  - `buildSynopsisSections(company)`
  - `formatParagraphs(text)`
  - `buildModalVideoSection(videoMetadata, company)`
  - Modal HTML structure and CSS

**Benefits**:
- Eliminates code duplication
- Ensures consistency across pages
- Easier to maintain and update
- Modal can open on My Company page without navigation

**Considerations**:
- Need to handle dependencies (auth, favorites manager, etc.)
- Ensure modal CSS is available on both pages
- Test modal behavior on different page contexts

### 2. Enhanced Quick Stats Cards
**Current**: Shows TRL, Team Size, GPC Ready

**Additions**:
- Pod Ranking (if available)
- Combine Standout badges count
- Government Champion status
- Funding Stage
- Technical Maturity level

**Display**:
- Responsive grid layout
- Tooltips on hover with descriptions
- Color-coded indicators for key metrics

### 3. Video Section Integration
**Feature**: Display demo/pitch videos in modal

**Implementation**:
- Video thumbnail with play button
- Toggle to show/hide video
- Support for YouTube, Vimeo, direct video links
- Lazy load video iframe

### 4. Bootcamp Performance Scores
**Feature**: Display competition scores in modal

**Data Shown**:
- Score table (Day, Brief, Red Team, Total, Badges)
- Judge badges as chips
- Performance trends visualization

### 5. Action Buttons Enhancement
**Current**: Basic favorite/interest buttons on cohorts

**Additions for My Company page**:
- "Edit This Field" quick links from modal to specific tabs
- "Share Profile" button with copy link
- "Download as PDF" export
- "Request Introduction" for networking

### 6. Field-Specific Edit Links
**Feature**: Click field in preview modal to jump to edit form

**UX Flow**:
1. User views modal on My Company page
2. Clicks on Mission Area field
3. Modal closes, page scrolls to Mission & Technology tab
4. Field highlights for editing

**Benefits**:
- Seamless edit workflow
- Reduces friction in profile updates
- Clear connection between preview and edit

### 7. Real-Time Preview Updates
**Feature**: Live preview as user types in edit form

**Implementation**:
- Debounced updates to modal content
- Side-by-side edit/preview layout option
- Toggle between full-screen edit and split view

### 8. Progressive Disclosure in Modal
**Feature**: Expandable sections for detailed information

**Sections**:
- Team & Founders (expandable)
- Government Contracts (expandable)
- Compliance & Security (expandable)
- Full mission area breakdown

### 9. Modal Navigation
**Feature**: Browse between companies in modal

**For cohorts page**:
- Next/Previous buttons in modal
- Keyboard shortcuts (arrow keys)
- Breadcrumb showing position in list

### 10. Structured Synopsis Parsing
**Enhancement**: Better parsing of description field

**Current**: Simple text blocks

**Improved**:
- Detect section headers (Problem:, Solution:, etc.)
- Auto-categorize into primary/secondary sections
- Rich text formatting support
- Bullet point preservation

## Implementation Priority

### High Priority (Near-term)
1. Shared Modal JavaScript Module
2. Field-Specific Edit Links
3. Enhanced Quick Stats Cards

### Medium Priority
4. Video Section Integration
5. Progressive Disclosure
6. Structured Synopsis Parsing

### Low Priority (Future)
7. Real-Time Preview Updates
8. Action Buttons Enhancement
9. Modal Navigation
10. Bootcamp Performance Scores

## Technical Considerations

### Dependencies
- Authentication service (for permission checks)
- Favorites manager (for favorite button)
- Company data structure (ensure consistency)

### Performance
- Lazy load modal content
- Cache rendered HTML for quick re-opening
- Minimize JavaScript bundle size

### Accessibility
- Keyboard navigation (ESC to close, TAB through elements)
- ARIA labels for screen readers
- Focus management (trap focus in modal, restore on close)

### Mobile Responsiveness
- Full-screen modal on mobile
- Touch-friendly close gestures
- Optimized stat card grid for small screens

## Related Files
- `/ghost-cloudrun/ghost-data/themes/ease/custom-cohorts.hbs` (lines 3327-3850) - Current modal implementation
- `/ghost-cloudrun/ghost-data/themes/ease/assets/js/my-company.js` - My Company page logic
- `/ghost-cloudrun/ghost-data/themes/ease/custom-my-company.hbs` - My Company page template

## Notes
- Modal should remain the single source of truth for company profile display
- Any enhancements should work on both cohorts and my-company pages
- Consider extracting to separate component/module for maintainability
