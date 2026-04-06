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

### 3) Admin route authorization source (legacy `/control` alias)
- Historical docs referred to `/control` as a separate admin surface.
- Current runtime behavior redirects `/control` to Guild `/admin`.
- File: `cloudflare/merge-router.js`

## Split Source of Truth (Current)
There is still policy ambiguity today:
- API endpoints use token roles + computed `roleLevel`.
- Legacy docs still talk about `/control` as if it were a separate admin console.
- Current runtime redirects `/control` to Guild `/admin`, so the remaining task is to make Guild admin and internal docs use one canonical admin rule.

This is the inconsistency causing role confusion across surfaces and documentation.

## Approved Direction
Decision: **Option B**
- Keep canonical hierarchy: `admin`, `trusted`, `industry`, `member`, `restricted`.
- Keep provisioning simplified where practical (currently `trusted` and `restricted`).
- Preserve ability to use `industry` and `member` for future policy gates.

## Plan Forward (Pre-Ship)
1. Validate production role reality with persona tests:
- `/guild/me` returns expected `roles` and `role_level` for admin/trusted/member/restricted personas.

2. Unify admin authorization model:
- Treat `/control` as a legacy alias, not a separate console product.
- Choose one model and document precedence for Guild `/admin` and any internal docs gating:
  - role-based as canonical (preferred), or
  - explicit group-based policy if needed for narrow exceptions.

3. Update runbooks + RTMX:
- Ensure all docs reflect current `CONSOLE_ROLLOUT_MODE="on"` baseline.
- Keep archived plans for historical context only.

4. Add automated tests after policy choice:
- Token claim parsing + role-level mapping tests.
- Guild `/admin` authorization tests for the chosen canonical model.

## Archived Planning Docs
Historical implementation planning moved to:
- `docs/archive/plans/2026-02-26-phase1-api-spine-design.md`
- `docs/archive/plans/2026-02-26-phase1-api-spine-implementation.md`
- `docs/archive/plans/2026-02-27-phase1-last-mile-design.md`
- `docs/archive/plans/2026-02-27-phase1-last-mile-implementation.md`
