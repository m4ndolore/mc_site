# REQ-INFRA-005: Canonical Domain Redirects (www/build aliases)

## Status: COMPLETE

## Requirement
Configure 301 redirects from alias domains (www.mergecombinator.com, build.mergecombinator.com) to the canonical apex domain (mergecombinator.com). Ensures SEO consolidation and prevents duplicate content.

## Acceptance Criteria
1. www.mergecombinator.com/* → 301 → mergecombinator.com/*
2. build.mergecombinator.com/* → 301 → mergecombinator.com/*
3. Path and query string preserved in redirect
4. Redirect happens at Worker/edge level (not client-side)

## Implementation
Add hostname check to mc-router Cloudflare Worker:
```javascript
if (['www.mergecombinator.com', 'build.mergecombinator.com'].includes(url.hostname)) {
  url.hostname = 'mergecombinator.com';
  return Response.redirect(url.toString(), 301);
}
```

## Dependencies
- REQ-INFRA-003 (MC Router restructuring) — COMPLETE

## Source
- `docs/completed/restructure.md` section 1

## Effort
~0.25 weeks
