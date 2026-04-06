# Human-Blocked Infra Gate (2026-03-31)

These are the next infra actions that should happen before new backlog execution.

## 1. Docs Routing Fix

Tracks:
- `REQ-BUG-015`

Action:
- [x] Main-site docs link now reaches `docs.mergecombinator.com` instead of bouncing back to MC.
- [ ] Confirm whether any remaining Cloudflare routing work is still needed, or whether the issue has shifted fully to auth/session behavior.

Preferred fix:
- [ ] Exclude `docs.mergecombinator.com/*` from the worker route entirely.

Fallback fix:
- [ ] Add a dedicated `DOCS_ORIGIN` proxy path in the router if route exclusion is not possible.

Verification:
- [x] `https://docs.mergecombinator.com` loads instead of returning to MC
- [x] No redirect loop from the main-site docs link
- [ ] Session remains intact across MC and docs without a second login
- [ ] Product intent is explicit: internal-only docs vs Guild-linked docs

## 2. Docs Contributor Group Setup

Tracks:
- `REQ-INFRA-002`
- `REQ-DOCS-003`

Actions:
- [ ] Create `mc-docs-contributors` in VIA
- [ ] Ensure Outline OIDC provider includes `groups`
- [ ] Create `mc-docs-contributors` in Outline
- [ ] Apply collection permissions in Outline

Verification:
- [ ] User appears in VIA group claims
- [ ] User appears in Outline group
- [ ] Contributor can edit docs
- [ ] Non-contributor remains read-only

## Execution Rule

Do these before taking new phase 10 backlog items unless there is an explicit exception.
