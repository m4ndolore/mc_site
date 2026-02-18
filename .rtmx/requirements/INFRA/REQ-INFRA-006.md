# REQ-INFRA-006: CF Pages Custom Domain Binding (app/wingman subdomains)

## Status: COMPLETE

## Requirement
Bind Cloudflare Pages custom domains to app.mergecombinator.com and wingman.mergecombinator.com. DNS records already exist with placeholder CF Pages deployments. Requires Cloudflare dashboard action to complete custom domain binding.

## Acceptance Criteria
1. app.mergecombinator.com serves CF Pages deployment (console app or placeholder)
2. wingman.mergecombinator.com serves CF Pages deployment (wingman app or placeholder)
3. HTTPS certificates provisioned and active
4. mc-router can successfully proxy /app/* and /app/wingman/* to these origins

## Implementation
1. Cloudflare Dashboard → Pages → mc-console project → Custom domains → Add app.mergecombinator.com
2. Cloudflare Dashboard → Pages → mc-wingman project → Custom domains → Add wingman.mergecombinator.com
3. Verify DNS propagation and HTTPS
4. Test mc-router proxy paths

## Dependencies
- REQ-INFRA-003 (MC Router restructuring) — COMPLETE

## Source
- `docs/completed/restructure.md` section 8

## Notes
This is primarily a human admin action in Cloudflare dashboard, not a code change.

## Effort
~0.25 weeks (manual)
