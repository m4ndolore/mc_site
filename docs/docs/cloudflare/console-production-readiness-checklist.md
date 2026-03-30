# Console Production Readiness Checklist

Use this checklist before exposing console routes to broader users.

## Scope
- API worker routes under `/guild/*` and `/builders/*`
- Rollout controls: `CONSOLE_ROLLOUT_MODE`, `CONSOLE_MIN_ROLE_LEVEL`

## Configuration
- `wrangler.toml` has correct prod values:
  - `MC_PUBLIC_URL = "https://mergecombinator.com"`
  - `CONSOLE_ROLLOUT_MODE = "on"` (current baseline)
  - `CONSOLE_MIN_ROLE_LEVEL = "3"` (used only when mode is `internal`)
  - `CORS_ALLOWED_ORIGINS` includes apex and required subdomains
- Staging values mirror prod rollout mode for realistic validation.
- Dev values remain permissive (`on`, `0`) for local testing.

## Security Gates
- `consoleSwitch` returns `404` when rollout is `off`.
- `consoleRoleGate` returns `403` for users below minimum role level in `internal` mode.
- OIDC verification remains required for all console endpoints.

## Validation
- `cd cloudflare/api-worker && npm run typecheck` exits 0.
- `cd cloudflare/api-worker && npm run test` exits 0.
- Manual checks against staging:
  - Authenticated user gets `200` on `/guild/me` in `on` mode.
  - Authenticated user below threshold gets `403` only in `internal` mode.
  - Unauthenticated requests remain blocked by OIDC middleware.
  - With rollout mode `off`, console endpoints return `404`.

## Observability
- Verify request IDs appear in error payload metadata.
- Confirm `required_role_level` and `role_level` in `403` responses for debugging.
- Confirm Cloudflare logs show expected deny/allow behavior during canary.

## Rollout Decision
- If all checks pass, keep baseline `on`.
- Use `internal` only for temporary restricted rollout or incident containment.
