# Roles: Live Production State and Forward Plan (2026-03-13)

## Purpose
This document is the current reference for role behavior in production and the approved direction to reduce role sprawl without losing necessary granularity.

## Live in Production Today

### 1) API authorization source (token roles)
- Worker reads roles from OIDC claim path `groups`.
- File: `cloudflare/api-worker/wrangler.toml`
- Enforcement path: `cloudflare/api-worker/src/middleware/verify-oidc.ts` + `cloudflare/api-worker/src/lib/roles.ts`

Current API role hierarchy in code:
- `admin = 4`
- `trusted = 3`
- `industry = 2.5`
- `member = 2`
- `restricted = 0.5`

Normalization currently allows legacy group naming to still map:
- `mc-admins` -> `admin`
- `mc-trusted` -> `trusted`

### 2) Access onboarding/provisioning source (assigned roles)
- Current onboarding auto-assigns only:
  - `trusted` for approved gov/mil patterns
  - `restricted` as default
- Files:
  - `cloudflare/api-worker/src/lib/authentik.ts`
  - `cloudflare/api-worker/src/routes/access.ts`

### 3) Control route authorization source (router groups)
- `/control` is authorized by group allowlist, not role hierarchy.
- Default allowlist: `via-admins`, `sigmablox-admins`
- File: `cloudflare/merge-router.js`

## Split Source of Truth (Current)
There is a real split today:
- API endpoints use token roles + computed `roleLevel`.
- Router `/control` uses explicit admin groups.

This is the inconsistency causing role confusion across surfaces.

## Approved Direction
Decision: **Option B**
- Keep canonical hierarchy: `admin`, `trusted`, `industry`, `member`, `restricted`.
- Keep provisioning simplified where practical (currently `trusted` and `restricted`).
- Preserve ability to use `industry` and `member` for future policy gates.

## Plan Forward (Pre-Ship)
1. Validate production role reality with persona tests:
- `/guild/me` returns expected `roles` and `role_level` for admin/trusted/member/restricted personas.

2. Unify `/control` authorization model:
- Choose one model and document precedence:
  - group-based as canonical, or
  - role-based as canonical, or
  - explicit dual-mode fallback with deterministic priority.

3. Update runbooks + RTMX:
- Ensure all docs reflect current `CONSOLE_ROLLOUT_MODE="on"` baseline.
- Keep archived plans for historical context only.

4. Add automated tests after policy choice:
- Token claim parsing + role-level mapping tests.
- `/control` authorization tests for chosen canonical model.

## Archived Planning Docs
Historical implementation planning moved to:
- `docs/archive/plans/2026-02-26-phase1-api-spine-design.md`
- `docs/archive/plans/2026-02-26-phase1-api-spine-implementation.md`
- `docs/archive/plans/2026-02-27-phase1-last-mile-design.md`
- `docs/archive/plans/2026-02-27-phase1-last-mile-implementation.md`
