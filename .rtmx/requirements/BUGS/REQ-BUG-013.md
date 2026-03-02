# REQ-BUG-013: Builder images 404 — Airtable CDN URLs not migrated to CF Images

## Description
Builder card images on the /builders page return 404 from `dl.airtableusercontent.com`. The `logoUrl` field in the SigmaBlox Company table still contains legacy Airtable CDN URLs. These should reference Cloudflare Images (`imagedelivery.net`) using the `cfImageId` field instead.

## Target
All builder images load from CF Images. No requests to airtableusercontent.com.

## Acceptance Criteria
- [ ] Guild SPA renders company logos via CF Images URL pattern using cfImageId
- [ ] Fallback for companies without cfImageId (placeholder or skip)
- [ ] Zero 404s on /builders page for images

## Implementation
- **Status**: PARTIAL
- **Phase**: 9 (Platform Convergence)
- **Priority**: MEDIUM
- **Effort**: 0.5w
- **Dependencies**: REQ-PLATFORM-001
- **Notes**: Fixed in Guild SPA via adapters.ts — `adaptCompany()` uses `cfImageId` to construct CF Images URL (`imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/{id}/public`), falls back to `logoUrl` if no cfImageId. Awaiting E2E verification after deploy.
