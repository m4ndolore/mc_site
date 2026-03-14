# Ralph Status

## Current Session
- **Started**: 2026-03-13
- **Task**: REQ-PLATFORM-001 + REQ-DOCS-007 — Roles source-of-truth alignment, archive stale plans, RTMX parity pass

## Queue (Next 5)
1. REQ-PLATFORM-001 - Unify /control authorization source (group vs canonical role) (PARTIAL)
2. REQ-BUG-014 - Guild/API persona E2E verification with real tokens (PARTIAL)
3. REQ-DOCS-006 - Visual artifact storage policy and enforcement (PENDING)
4. REQ-UX-010 - SEO improvements (BACKLOG)
5. REQ-BUG-001 - VIA passkey flow verification (PARTIAL)

## Recently Completed
- REQ-DOCS-007 - RTMX parity pass completed; missing requirement files restored (2026-03-13)
- REQ-PLATFORM-001 - Role model decision documented (Option B) + stale plan docs archived (2026-03-13)
- REQ-CONTENT-007 - About Us page complete with claims mapping (2026-03-01)
- REQ-CONTENT-004 - P1 claims source mapping complete (2026-03-01)
- REQ-CONTENT-005 - Homepage testimonials rewritten as non-quoted summaries (2026-03-01)
- REQ-CONTENT-006 - Factual speed/validation claims de-risked (2026-03-01)

## Blocked / Needs Human
- REQ-BUG-015: Docs redirect — mc-router catches docs.* and proxies to MC Pages. Fix: exclude docs subdomain from worker routes in CF dashboard.
- REQ-PLATFORM-001: Phase 1 Last Mile code complete — awaiting VIA redirect URI config + deploy + E2E smoke test
- REQ-BUG-014: Guild SPA deployed, OIDC code complete — awaiting VIA config for E2E verification
- REQ-PLATFORM-001: Decision needed for `/control` source of truth (router group allowlist vs canonical roles in token)
- REQ-AUTH-004: VIA passkey setup denied after 2FA flow — user investigating Authentik logs
- REQ-INFRA-002: VIA group done, Outline group pending (Outline offline)
- REQ-DOCS-003: VIA group created, Outline offline — group creation pending
- REQ-BUG-001: VIA passkey flow blueprints deployed — needs testing

---
_Last updated: 2026-03-13_
