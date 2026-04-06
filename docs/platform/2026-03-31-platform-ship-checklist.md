# Platform Ship Checklist (2026-03-31)

This is the active release gate for the authenticated MC platform work.

It collapses the remaining critical-path work across:
- `REQ-PLATFORM-001`
- `REQ-BUG-014`
- `REQ-BUG-017`
- Guild `/admin` authorization source-of-truth alignment (legacy `/control` alias cleanup)

## Rule

Do not start phase 10 growth work until every item in this checklist is either complete or explicitly waived.

## A. External / Human-Gated Actions

- [ ] Register VIA redirect URIs for:
  - `https://guild.mergecombinator.com/login/callback`
  - `https://mergecombinator.com/access`
- [ ] Configure VIA token claims so canonical roles are present in the `groups` claim for persona testing.
- [ ] Deploy the latest Guild SPA build to the live Cloudflare Pages project.

## B. Persona Verification

- [ ] Admin persona:
  - `GET /guild/me` returns `roles` including `admin`
  - `role_level` matches the API role hierarchy
- [ ] Trusted persona:
  - `GET /guild/me` returns `trusted`
  - `/builders/companies` returns `200`
- [ ] Restricted persona:
  - `GET /guild/me` returns `restricted`
  - restricted surfaces degrade correctly
- [ ] Builder listings:
  - `/builders/companies` returns live data
  - company logos resolve via `cfImageId` fallback path
- [ ] Coach listings:
  - `/builders/coaches` returns live data

## C. Admin Authorization Unification

- [ ] Choose one canonical authorization model for Guild `/admin` and internal docs access:
  - token-derived canonical `admin` role preferred
  - explicit group allowlist only if there is a concrete exception
- [ ] Treat `/control` as a legacy redirect alias to Guild `/admin`, not a separate console product
- [ ] Add tests for the selected model
- [ ] Remove the documented split-source ambiguity from production docs

## D. Ship Criteria

Ship readiness requires all of the following:

- [ ] Guild login callback works end-to-end
- [ ] API calls send Bearer tokens successfully
- [ ] `/guild/me`, `/builders/companies`, and `/builders/coaches` pass live persona tests
- [ ] `REQ-BUG-017` image path fix is verified in production
- [ ] Admin authorization rule is singular and documented across Guild `/admin` and internal docs

## Deferred Until After Ship

The following remain explicitly deferred until the authenticated platform is verified live:

- `REQ-INFRA-007`
- `REQ-UX-012`
- `REQ-UX-013`
- `REQ-UX-014`
- `REQ-UX-015`
- `REQ-AUTH-006`
