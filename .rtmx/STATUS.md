# Ralph Status

## Current Session
- **Started**: 2026-03-31
- **Task**: REQ-DOCS-007 + REQ-PLATFORM-001 — RTMX validation repair, platform ship gate, admin auth simplification

## Queue (Next 5)
1. REQ-PLATFORM-001 - Close authenticated platform ship gate using [platform checklist](../docs/platform/2026-03-31-platform-ship-checklist.md) (PARTIAL)
2. REQ-BUG-014 + REQ-BUG-017 - Run live persona E2E after VIA config and Guild deploy (PARTIAL)
3. REQ-BUG-015 - Docs host loads, but MC and docs still require separate logins; decide internal-only exposure and fix session continuity (PARTIAL)
4. REQ-INFRA-002 + REQ-DOCS-003 - Enable narrow internal docs access for the 3 approved `@mergecombinator.com` users using the same canonical admin rule as Guild `/admin` (PENDING/PARTIAL)
5. REQ-DOCS-006 - Visual artifact storage policy and enforcement (PENDING)

## Recently Completed
- REQ-DOCS-007 - RTMX validator added, CSV normalized, validation now passes (2026-03-31)
- REQ-DOCS-007 - RTMX parity pass completed; missing requirement files restored (2026-03-13)
- REQ-PLATFORM-001 - Role model decision documented (Option B) + stale plan docs archived (2026-03-13)
- REQ-CONTENT-007 - About Us page complete with claims mapping (2026-03-01)
- REQ-CONTENT-004 - P1 claims source mapping complete (2026-03-01)
- REQ-CONTENT-005 - Homepage testimonials rewritten as non-quoted summaries (2026-03-01)
- REQ-CONTENT-006 - Factual speed/validation claims de-risked (2026-03-01)

## Blocked / Needs Human
- REQ-INFRA-002: Verify VIA + Outline configuration for narrow internal docs admin access and shared admin rule.
- REQ-DOCS-003: Internal docs access cannot close until approved internal users are verified end-to-end.
- REQ-PLATFORM-001: Phase 1 Last Mile code complete — awaiting VIA redirect URI config + deploy + E2E smoke test
- REQ-BUG-014: Guild SPA deployed, OIDC code complete — awaiting VIA config for E2E verification
- REQ-PLATFORM-001: Simplify admin auth so Guild `/admin` and internal docs share one canonical rule; `/control` should be treated as a legacy alias only.
- REQ-BUG-015: Docs host now loads, but cross-app session continuity is still unresolved and expected Guild exposure is not explicit.
- REQ-AUTH-004: VIA passkey setup denied after 2FA flow — user investigating Authentik logs
- REQ-INFRA-002: Prior contributor-group framing is superseded by narrow internal docs admin access.
- REQ-DOCS-003: Prior contributor-workflow framing is superseded by internal docs access workflow.
- REQ-BUG-001: VIA passkey flow blueprints deployed — needs testing

## Deferred Until Platform Ship
- REQ-INFRA-007 - SAM.gov opportunities expansion
- REQ-UX-012 - Onboarding personalization engine
- REQ-UX-013 - Social proof layer in onboarding hero
- REQ-UX-014 - Post-approval activation flow
- REQ-UX-015 - Onboarding A/B testing infrastructure
- REQ-AUTH-006 - Reduce Authentik dependency research

---
_Last updated: 2026-04-06_
