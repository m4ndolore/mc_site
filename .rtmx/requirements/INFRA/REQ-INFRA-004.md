# REQ-INFRA-004: Deploy mc-api Cloudflare Worker

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 5
- **Effort**: 0.25 weeks
- **Dependencies**: None
- **Blocks**: None
- **Completed**: 2026-02-15

## Requirement
Deploy mc-api Cloudflare Worker to api.mergecombinator.com with health and post-2fa endpoints live.

## Implementation
Worker deployed with route api.mergecombinator.com/*. DNS changed from CNAME ghs.googlehosted.com to proxied A record. VIA templates updated to default to MC endpoint. Supersedes REQ-INFRA-001.

Endpoints: GET /auth/post-2fa, POST /api/verify-email, GET /health.
