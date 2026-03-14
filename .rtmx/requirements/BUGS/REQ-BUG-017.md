# REQ-BUG-017: Builder Images 404 (cfImageId Migration)

## Metadata
- **Status**: PARTIAL
- **Priority**: MEDIUM
- **Phase**: 9
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-PLATFORM-001

## Description
Guild builder tiles and details showed broken images because some views still used legacy `logoUrl` fields while data now expects Cloudflare Images IDs (`cfImageId`).

## Target
All builder and champion images resolve successfully in Guild using CF Images with deterministic fallback.

## Acceptance Criteria
- [ ] List and detail views prioritize `cfImageId` rendering path
- [ ] Fallback to `logoUrl` works when `cfImageId` missing
- [ ] No broken image placeholders in Builders and Champions production views

## Notes
Tracked in RTMX database as PARTIAL. Awaiting post-deploy production E2E confirmation.
