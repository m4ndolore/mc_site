# REQ-LEGAL-001: Merge Combinator Privacy Policy

## Description
Create a comprehensive privacy policy for Merge Combinator (mergecombinator.com) that covers data collection, usage, storage, and user rights.

## Target
**Metric**: Compliant privacy policy published at /privacy.html

## Reference
- Current placeholder: `/privacy.html`
- VIA authentication data handling
- Defense Builders user data

## Acceptance Criteria
- [x] Privacy policy covers all data collection practices
- [x] Explains VIA authentication data handling
- [x] Documents cookie usage and tracking
- [x] Includes user rights (access, deletion, portability)
- [x] GDPR and CCPA compliant language
- [x] Contact information for privacy inquiries
- [x] Published and linked from access page and footer

## Implementation Considerations

### Data Types to Document
- Authentication data (VIA/SSO)
- User profile information
- Usage analytics
- Session cookies
- Defense Builders platform data

### Legal Review
Consider legal review before publishing to ensure compliance with:
- GDPR (EU users)
- CCPA (California users)
- Government contractor requirements

## Implementation
- **Status**: COMPLETE
- **Phase**: 2
- **Priority**: HIGH

## Validation
- **Method**: Manual Test
- Privacy policy accessible at /privacy.html
- All required sections present
- Links work from access page and footer

## Dependencies
- None

---

## Sitrep - 2026-01-25 (Session 1)

**Session**: claude-2026-01-25-privacy-policy
**Status**: COMPLETE

### Completed This Session
- Researched MC site data collection practices by examining:
  - `/privacy.html` (placeholder)
  - `/access.html` (VIA authentication flow, Google SSO)
  - `/builders.html` (SigmaBlox API integration)
  - `/js/auth-nav.js` (session management)
  - `/js/builders/auth.js` (OAuth token handling)
  - `/js/builders/api.js` (data fetching patterns)
  - `/script.js` (usage analytics)
- Created comprehensive 14-section privacy policy covering:
  1. Information We Collect (direct, automatic, third-party)
  2. How We Use Your Information
  3. Authentication and VIA (with data retention table)
  4. Cookies and Tracking Technologies (with cookie types table)
  5. Information Sharing and Disclosure
  6. Data Retention (specific periods)
  7. Data Security
  8. Your Rights and Choices
  9. California Privacy Rights (CCPA)
  10. European Privacy Rights (GDPR)
  11. International Data Transfers
  12. Children's Privacy
  13. Changes to This Policy
  14. Contact Us
- Added professional styling with table of contents, highlight boxes, and data tables
- Privacy policy accessible at /privacy.html (504 lines)
- Links verified in access.html and footer

### Files Modified This Session
- `/privacy.html` - Complete rewrite with comprehensive policy
- `/.rtmx/database.csv` - Updated REQ-LEGAL-001 status to COMPLETE
- `/.rtmx/requirements/LEGAL/REQ-LEGAL-001.md` - Updated acceptance criteria and added sitrep

### Notes
- Existing links from access page (`/privacy.html`) and footer work correctly
- Contact email: privacy@mergecombinator.com
- Security email: security@mergecombinator.com
- Recommend legal review before final deployment
