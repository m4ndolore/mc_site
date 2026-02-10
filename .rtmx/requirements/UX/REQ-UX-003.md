# REQ-UX-003: Add Missing Footers to All Pages

## Metadata
- **Status**: PENDING
- **Priority**: MEDIUM
- **Phase**: 4
- **Effort**: 0.25 weeks
- **Dependencies**: REQ-UX-002
- **Blocks**: None

## Requirement
All pages on mergecombinator.com shall have a consistent footer with branding, navigation links, and location information.

## Current State
Pages missing footer:
- `/access.html` - No footer
- `/wingman.html` - No footer
- `/guild.html` - No footer
- `/dashboard.html` - No footer (intentional for C2UX?)
- `/briefs.html` - No footer

Pages with footer (reference):
- `/index.html` - Full footer with logo, links, social, locations
- `/knowledge.html` - Full footer
- `/builders.html` - Full footer
- `/blog.html` - Full footer

## Acceptance Criteria
- [ ] All public-facing pages have consistent footer
- [ ] Footer uses updated logo (Merge/Combinator + arrows)
- [ ] Locations: Honolulu, Seattle, Las Vegas
- [ ] Social links: LinkedIn, X, The Combine, Knowledge
- [ ] Footer links organized: Platform, Company, Resources, Legal
- [ ] C2UX pages (dashboard) may omit footer if design requires

## Footer Structure
```html
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="/" class="footer__logo">
          <span class="footer__logo-text">
            <span class="footer__logo-merge">Merge</span>
            <span class="footer__logo-combinator">Combinator</span>
          </span>
          <img src="/assets/arrows-2.png" alt="Merge arrows" class="footer__logo-icon">
        </a>
        <p class="footer__tagline">The builder-led venture studio for national security.</p>
        <div class="footer__social">...</div>
      </div>
      <div class="footer__links">...</div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">&copy; 2026 Merge Combinator. All rights reserved.</p>
      <p class="footer__location">Honolulu &bull; Seattle &bull; Las Vegas</p>
    </div>
  </div>
</footer>
```

## Validation
- Visual inspection of all pages
- Footer renders correctly on mobile
- All links functional
