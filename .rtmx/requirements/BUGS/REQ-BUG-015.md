# REQ-BUG-015: Docs page redirects back to base site instead of loading

## Description
Clicking the Docs link in the Guild SPA navigation redirects back to the base site (mergecombinator.com) instead of loading docs.mergecombinator.com. This may be a routing issue in merge-router, a missing DNS record, or an Outline Wiki configuration problem.

## Target
Docs link loads docs.mergecombinator.com with VIA SSO session intact.

## Acceptance Criteria
- [ ] Docs link navigates to docs.mergecombinator.com
- [ ] Page loads without redirect loop
- [ ] SSO session carries over (user is authenticated)

## Implementation
- **Status**: PENDING
- **Phase**: 9 (Platform Convergence)
- **Priority**: MEDIUM
- **Effort**: 0.5w
- **Dependencies**: REQ-DOCS-001
- **Notes**: Check merge-router rules for docs.* subdomain, Outline Wiki OIDC config, and cookie domain settings. May be related to the COOKIE_DOMAIN change in REQ-DOCS-001.
