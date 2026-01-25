# About Page Specification

## Overview

The about page (`/about`) showcases Merge Combinator's mission, team, and partner ecosystem. Currently redirects to homepage - needs full implementation.

## Page Structure

### Hero Section
- Headline: "Building the Future of Defense Technology"
- Subtext: Brief mission statement (2-3 sentences max, C2UX compliant - operational, not marketing)
- No CTA buttons in hero (operational sites don't hard-sell)

### Mission Section
- Title: "Mission"
- Content: What Merge Combinator does (connect defense innovators with operators)
- Keep brief - 1-2 paragraphs max

### Partner Ecosystem Section
- Title: "Partner Network" or "Ecosystem"
- Grid of partner logos (use assets from `assets/logos/partners/`)
- Partners include: DIU, AFRL, AFSOC, SOFWERX, INDOPACOM, etc.
- Logos should be grayscale or muted, hover to full color
- Link each logo to partner website (external, new tab)

### Team Section (Optional - if data available)
- Title: "Team"
- Grid of team member cards
- Card format: Photo, Name, Role, optional LinkedIn link
- Data source options:
  1. Ghost CMS API (if team members are Ghost users/authors)
  2. Static JSON file (`public/data/team.json`)
  3. Hardcoded in HTML (least preferred)

**Note:** If team data not available, omit section entirely rather than showing placeholder.

## Design Requirements

### C2UX Compliance
- Operational language only (no "We're excited to..." or marketing speak)
- Sharp edges, clean lines
- Inter font family
- Status-focused, not story-focused

### Visual Style
- Match existing site patterns (see `/builders`, `/portfolio`)
- Dark mode support (if implemented elsewhere)
- Responsive: 1920px, 1024px, 768px, 375px breakpoints

### Logo Grid
- 6-8 logos per row on desktop
- 3-4 on tablet
- 2 on mobile
- Consistent sizing (use CF Image Resizing via `cfImage()`)

## Technical Implementation

### File Structure
```
about.html          # Main page file
js/about/index.js   # Module for dynamic content (partners, team)
```

### Data Loading
```javascript
// Option 1: Static partners
const partners = [
  { name: 'DIU', logo: '/assets/logos/partners/diu.png', url: 'https://diu.mil' },
  // ...
];

// Option 2: If team data available from API
async function loadTeam() {
  // Try Ghost CMS authors endpoint or static JSON
}
```

### Build Integration
- Partners can be static (no API needed)
- Team data: If using API, add to seed script pattern from builders

## Acceptance Criteria

1. [ ] Page renders at `/about` (no redirect)
2. [ ] Mission section with operational language
3. [ ] Partner logos display in responsive grid
4. [ ] Partner logos link to external sites
5. [ ] C2UX compliant (no marketing language)
6. [ ] Responsive at all breakpoints
7. [ ] No console errors
8. [ ] Build passes (`npm run build`)

## Out of Scope

- Team section (if no data source available)
- Contact form (separate page or section)
- Career listings (link to external if needed)
- Blog/news feed (separate page exists)

## Dependencies

- Partner logo assets in `assets/logos/partners/`
- Site-wide CSS/Tailwind setup
- C2UX language patterns established in other pages
