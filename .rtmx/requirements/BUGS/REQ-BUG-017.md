# REQ-BUG-017: Builder Images 404 (cfImageId Migration)

## Metadata
- **Status**: COMPLETE
- **Priority**: MEDIUM
- **Phase**: 9
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-PLATFORM-001

## Description
Guild builder tiles and details showed broken images because some views still used legacy `logoUrl` fields while data now expects Cloudflare Images IDs (`cfImageId`).

## Target
All builder and champion images resolve successfully in Guild using CF Images with deterministic fallback.

## Acceptance Criteria
- [x] List and detail views prioritize `cfImageId` rendering path
- [x] Fallback to `logoUrl` works when `cfImageId` missing
- [x] No broken image placeholders in Builders and Champions production views

## Notes
Tracked in RTMX database as COMPLETE. Builder logos were restored and production verification was previously closed in RTMX.
