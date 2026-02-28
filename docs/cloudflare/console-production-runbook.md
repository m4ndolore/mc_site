# Console Production Deploy + Verify Runbook

This runbook covers deploy, verification, and rollback for console route rollout.

## 1) Pre-Deploy
1. Validate local API worker:
   - `cd cloudflare/api-worker`
   - `npm run typecheck`
   - `npm run test`
2. Confirm rollout env values in `wrangler.toml`:
   - Initial prod state: `CONSOLE_ROLLOUT_MODE="internal"`, `CONSOLE_MIN_ROLE_LEVEL="3"`

## 2) Deploy
1. Deploy staging first:
   - `cd cloudflare/api-worker`
   - `npx wrangler deploy --env staging`
2. Validate staging behavior (see section 3).
3. Deploy production:
   - `cd cloudflare/api-worker`
   - `npx wrangler deploy`

## 3) Verification
Run with real OIDC sessions where possible.

1. Endpoint health (authenticated internal user):
   - `GET /guild/me` => `200`
2. Authorization gate (authenticated non-internal user):
   - `GET /guild/me` => `403`
   - Response includes `required_role_level` and `role_level`
3. Builders endpoints follow same policy:
   - `GET /builders/companies` => `200` (internal) / `403` (non-internal)
4. Hidden mode test (if temporarily set to off):
   - `GET /guild/me` => `404`

## 4) Rollout Progression
1. Canary (default): `internal`
2. General availability:
   - set `CONSOLE_ROLLOUT_MODE="on"`
   - deploy worker
3. Emergency hide:
   - set `CONSOLE_ROLLOUT_MODE="off"`
   - deploy worker

## 5) Rollback
If any production issue appears:
1. Fastest containment: set `CONSOLE_ROLLOUT_MODE="off"`, deploy.
2. If needed, redeploy prior known-good worker build.
3. Re-run verification checks after rollback.

## 6) Post-Deploy Tracking
- Record deploy timestamp and operator.
- Record rollout mode transitions (`internal` -> `on`).
- Log observed `403`/`404` rates during first 24 hours.
