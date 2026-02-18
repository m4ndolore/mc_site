# Frontend Truth and UX Remediation Backlog

**Date:** 2026-02-17  
**Status:** Active  
**Scope:** `www.mergecombinator.com` frontend, content integrity, operational workflow

## Heart-to-Heart: What We Need to Fix

We have real momentum on design and shipping speed, but the site now risks saying things that are not fully true, not fully current, or not consistently sourced. That is dangerous for trust.

If a visitor catches one inaccurate claim, they may assume everything else is marketing spin, including the parts that are true. For defense and operations audiences, trust is the product.

We should treat content accuracy like production reliability:
- Every material claim has an owner.
- Every claim has a source or verification note.
- Every claim has a review cadence.
- Claims that cannot be verified are rewritten or removed.

This is not about slowing down; it is about shipping fewer regressions in credibility.

## Goal

Build a repeatable system where the frontend is:
1. Clear and conversion-focused
2. Accessible and technically sound
3. Factually accurate and auditable
4. Ready for automation (Ralph + upcoming agents)

## Workstreams

### A) UX and Frontend Quality

| ID | Priority | Item | Owner | Status | Done Criteria |
|---|---|---|---|---|---|
| UX-001 | P0 | Unify canonical domain and route behavior | Web | Todo | `www` and apex redirect strategy documented; all nav links use canonical URLs |
| UX-002 | P0 | Consolidate CTA hierarchy on homepage | Web + Content | Todo | One primary CTA per major section; reduced CTA duplication |
| UX-003 | P0 | Fix footer/icon accessibility naming | Web | Todo | All icon links have meaningful `aria-label`; keyboard focus visible |
| UX-004 | P1 | Clarify persona pathways (`Founders`, `Government`, `Industry`) | Product + Content | Todo | Distinct page sections or landing routes with role-specific copy and CTA |
| UX-005 | P1 | Tighten `/access` form state UX | Web | Todo | Conditional success/error states, inline validation, response-time expectation copy |
| UX-006 | P2 | Reduce homepage copy density | Content | Todo | 20-30% copy reduction with no loss of core meaning |

### B) Truth, Claims, and Hallucination Cleanup

| ID | Priority | Item | Owner | Status | Done Criteria |
|---|---|---|---|---|---|
| TRUTH-001 | P0 | Build site claim inventory | Content Ops | In Progress | Initial inventory generated for `/`, `/access`, `/programs/the-combine`; expand to remaining priority pages |
| TRUTH-002 | P0 | Add claim classification tags | Content Ops | In Progress | Auto-classification generated for initial 53 claims; human overrides pending |
| TRUTH-003 | P0 | Source-of-truth mapping | Content Ops + Leadership | Todo | Every `factual` claim mapped to internal source, public source, or owner attestation |
| TRUTH-004 | P0 | Remove or rewrite unverifiable claims | Content | Todo | Zero `factual` claims without source/attestation |
| TRUTH-005 | P1 | Add freshness metadata policy | Content Ops | Todo | Claims with time sensitivity include `last reviewed` date and review interval |
| TRUTH-006 | P1 | Standardize confidence language | Content | Todo | Terms like `proven`, `guaranteed`, `best` replaced unless evidence threshold met |
| TRUTH-007 | P1 | Publish editorial quality bar | Ops | Todo | One-page rubric for acceptable claim evidence |
| TRUTH-008 | P2 | Add pre-publish claim linting | Automation | Todo | CI check flags unsourced high-risk phrases before deploy |

### C) Automation and Workflow Readiness (Ralph + Agents)

| ID | Priority | Item | Owner | Status | Done Criteria |
|---|---|---|---|---|---|
| AUTO-001 | P0 | Define machine-readable claim schema | Automation | Done | `docs/content/claims/claims.schema.json` created and in use |
| AUTO-002 | P0 | Add content extraction script | Automation | Done | `scripts/extract-claims.mjs` created; JSON and CSV outputs generated |
| AUTO-003 | P1 | Add verifier workflow | Automation + Content Ops | Todo | Daily/PR job checks claims against approved sources and outputs diff report |
| AUTO-004 | P1 | Add review queue for Ralph | Ops | Todo | Queue format and SLA defined for `needs-human-review` claims |
| AUTO-005 | P2 | Add regression dashboard | Automation | Todo | Dashboard tracks claim count, unsourced claims, stale claims, and page risk score |

## Execution Cadence

- Weekly 30-minute Truth Review: close or downgrade top-risk claims.
- Weekly 30-minute UX Review: resolve top conversion/accessibility blockers.
- Friday release gate: no new P0 truth issues introduced.

## Tracking Model Options

### Option 1: Independent (fastest)
- Track IDs above in `docs/plans` + GitHub issues.
- Use a simple `claims-inventory.csv` maintained by Content Ops.
- Best for immediate cleanup while automations spin up.

### Option 2: RTMX-integrated (more formal)
- Mirror backlog IDs as RTMX requirements/tasks.
- Link each claim policy to requirement artifacts and traceability.
- Best for auditability and long-term governance.

## Recommended Path

Start with **Option 1 now** for speed, while shaping artifacts so they can be imported to RTMX later:
- Stable IDs (`UX-*`, `TRUTH-*`, `AUTO-*`)
- Structured fields (owner, status, evidence, review date)
- Deterministic outputs from scripts

## Immediate Sprint (Next 7 Days)

1. Finish `TRUTH-001` and `TRUTH-003` on homepage + `/access` + `/programs/the-combine`.
2. Ship `UX-002` and `UX-003`.
3. Stand up `AUTO-001` and `AUTO-002` with sample output committed.
4. Create first Ralph queue payload from unresolved claims.

## Definition of Done (Program Level)

- No unsourced high-impact factual claims on top 5 traffic pages.
- No critical accessibility issues in nav/footer/form entry points.
- Backlog IDs mapped to active owner and review date.
- Automation outputs available in CI artifacts for every production PR.
