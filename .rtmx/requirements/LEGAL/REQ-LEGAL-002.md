# REQ-LEGAL-002: SigmaBlox Privacy Policy

## Description
Create a comprehensive privacy policy for SigmaBlox (sigmablox.com) that covers data collection, usage, storage, and user rights for the defense tech combine platform.

## Target
**Metric**: Compliant privacy policy published at sigmablox.com/privacy

## Reference
- SigmaBlox platform: sigmablox.com
- VIA authentication integration
- Cohort participant data handling

## Acceptance Criteria
- [ ] Privacy policy covers all SigmaBlox data collection
- [ ] Explains cohort application data handling
- [ ] Documents VIA authentication data
- [ ] Includes video/media content permissions
- [ ] Covers participant directory data sharing
- [ ] GDPR and CCPA compliant language
- [ ] Contact information for privacy inquiries
- [ ] Published and linked from registration and footer

## Implementation Considerations

### Data Types to Document
- Cohort application data
- Participant profiles and bios
- Company information
- Video pitches and recordings
- Authentication data (VIA/SSO)
- Event attendance and engagement

### Special Considerations
- Defense-related data handling
- Participant consent for directory inclusion
- Media release permissions
- Data sharing with Merge Combinator

## Implementation
- **Status**: PARTIAL
- **Phase**: 2
- **Priority**: HIGH

## Validation
- **Method**: Manual Test
- Privacy policy accessible at sigmablox.com/privacy
- All required sections present
- Links work from registration flow and footer

## Dependencies
- None

## Related
- REQ-LEGAL-001 (Merge Combinator privacy policy - should be consistent)

---

## Sitrep - 2026-01-25 (Session 1)

**Session**: claude-2026-01-25-sigmablox-privacy-policy
**Status**: PARTIAL

### Completed This Session
- Researched SigmaBlox data collection patterns across codebase:
  - `company.js`: profiles, contact info, TRL, funding, mission areas
  - `company-profile.js`: onboarding data (contact, technical, business info)
  - `coach.js`: profiles, protected contact details, expertise, bios
  - `cohort.js`: participant data, attendance records
  - `favorite.js`: user preferences for companies/coaches/cohorts
  - `note.js`: user notes with sharing permissions, tags, reminders
  - `access-request.js`: VIA authentication flow data
  - `story-invite.js`: founder story contributions
  - `email-service.js`: transactional communications
- Designed comprehensive privacy policy covering:
  - Cohort application data (contact, company, technical, business, product)
  - Participant directory data with tiered access controls
  - VIA/Authentik authentication data
  - Video/media content and permissions
  - User activity data (favorites, notes, engagement)
  - GDPR and CCPA compliance sections
  - Contact: privacy@sigmablox.com

### Files to Create (Next Session)
- `/Users/paulgarcia/Dev/sigmablox/apps/ghost-theme/ease/custom-privacy.hbs`

### Deployment Steps (Next Session)
1. Create Ghost theme template with policy content
2. Deploy updated theme to sigmablox.com
3. Create Ghost Page: Title "Privacy Policy", Slug "privacy"
4. Add privacy link to footer navigation
5. Link from /join registration page
