# Knowledge Page Specification

## Overview

The knowledge page (`/knowledge`) serves as the documentation/resources hub. Should provide access to guides, playbooks, and educational content for defense tech builders.

## Page Structure

### Hero Section
- Headline: "Knowledge Base" or "Resources"
- Brief description of what's available
- Search bar (optional - for future implementation)

### Content Categories
Organize resources by category:

1. **Getting Started**
   - What is Merge Combinator
   - How to apply
   - What to expect

2. **For Builders**
   - Pitch deck guidelines
   - Demo day preparation
   - Government sales 101

3. **For Operators**
   - How to evaluate startups
   - Engagement models
   - Success stories

4. **Technical Resources**
   - API documentation (link to docs.mergecombinator.com)
   - Integration guides
   - Security requirements

### Resource Cards
Each resource displays as a card:
- Title
- Brief description (1-2 lines)
- Category tag
- Read time estimate (optional)
- Link to full content

## Design Requirements

### C2UX Compliance
- Operational language
- Clean, scannable layout
- No decorative elements

### Visual Style
- Card-based grid layout
- Consistent with `/builders` and `/portfolio` patterns
- Category filters (pills or tabs)

## Technical Implementation

### File Structure
```
knowledge.html           # Main page
js/knowledge/index.js    # Dynamic content loading
public/data/resources.json  # Resource metadata (optional)
```

### Data Options
1. **Static HTML**: Resources hardcoded in page
2. **Static JSON**: Load from `/data/resources.json`
3. **Ghost CMS**: If content lives in Ghost, fetch via API

### Linking Strategy
- Internal docs: Link to docs.mergecombinator.com
- External resources: Open in new tab
- PDF downloads: Direct links to assets

## Acceptance Criteria

1. [ ] Page renders at `/knowledge`
2. [ ] Resources organized by category
3. [ ] Resource cards are clickable
4. [ ] Responsive layout
5. [ ] C2UX compliant language
6. [ ] No console errors
7. [ ] Build passes

## Out of Scope

- Full-text search (future enhancement)
- User bookmarks/favorites
- Progress tracking
- Comments/discussion
