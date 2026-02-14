# REQ-BUG-009: about.html Footer Has Stale Links and Outdated Structure

## Description
The about.html footer is completely out of sync with the canonical footer used on index.html and other pages. It has:
- `href="#"` placeholder links for LinkedIn, Twitter, Resources (Blog, Case Studies, Documentation, Press Kit), and Legal (Privacy Policy, Terms of Service, Security)
- Old logo markup (uses `footer__logo-mark` "M" style instead of current split text + arrows image)
- Copyright year says 2024 instead of 2026
- Location says "San Francisco • Tokyo • Singapore" instead of current "Honolulu • Seattle • Las Vegas"
- Missing platform links that other pages have

## Target
Footer matches canonical index.html footer structure and links.

## Acceptance Criteria
- [ ] Footer logo uses current markup (Merge/Combinator split text + arrows image)
- [ ] Social links point to real URLs (LinkedIn, X/Twitter)
- [ ] Resource links point to real pages (/blog, /portfolio, /knowledge, docs)
- [ ] Legal links point to real pages (/privacy, /terms, /security)
- [ ] Copyright year is 2026
- [ ] Location matches current branding

## Implementation
- **Status**: PARTIAL
- **Phase**: 5
- **Priority**: MEDIUM
