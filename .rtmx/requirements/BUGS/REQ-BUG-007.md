# REQ-BUG-007: /opportunities returns 500 from SBIR origin

## Metadata
- **Status**: PENDING
- **Priority**: LOW
- **Phase**: 2
- **Effort**: 0.5 weeks
- **Dependencies**: None
- **Blocks**: None

## Bug Description
The `/opportunities` route on mergecombinator.com returns a 500 error when proxied through the MC Router, despite the SBIR origin (sbir.mergecombinator.com) working correctly when accessed directly.

## Steps to Reproduce
1. Navigate to https://www.mergecombinator.com/opportunities
2. Observe 500 error response

## Expected Behavior
Page should load SBIR opportunities content from sbir.mergecombinator.com

## Actual Behavior
500 Internal Server Error returned

## Technical Details
- **Origin**: sbir.mergecombinator.com (Railway deployment)
- **Route**: `merge-router.js:210`
- **Direct access**: Works (200 OK)
- **Proxied access**: Fails (500 Error)

## Likely Causes
1. Header handling issue with `X-Forwarded-*` headers at Railway origin
2. Host header mismatch between proxy request and origin expectation
3. Railway-specific configuration expecting certain headers

## Investigation Notes
- sbir.mergecombinator.com has valid DNS
- Direct curl to origin returns 200
- Proxy adds `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`
- Railway may be rejecting based on unexpected Host header

## Resolution Path
1. Check Railway origin logs for error details
2. Verify header passthrough in MC Router
3. Test with explicit Host header override
4. Consider Railway configuration changes

## Acceptance Criteria
- [ ] `/opportunities` returns 200 with SBIR content
- [ ] No errors in MC Router logs
- [ ] No errors in Railway origin logs
