# Console Production Deploy + Verify Runbook

This runbook covers deploy, verification, and rollback for console route rollout.

## 1) Pre-Deploy
1. Validate local API worker:
   - `cd cloudflare/api-worker`
   - `npm run typecheck`
   - `npm run test`
2. Confirm rollout env values in `wrangler.toml`:
   - Current prod baseline: `CONSOLE_ROLLOUT_MODE="on"`
   - `CONSOLE_MIN_ROLE_LEVEL` applies only when mode is `internal`

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
2. In current mode (`on`), role gate is bypassed:
   - `GET /guild/me` => `200` for authenticated users regardless of role level
3. Builders endpoints follow same policy in `on`:
   - `GET /builders/companies` => `200` for authenticated users
4. Internal canary mode test (optional):
   - set `CONSOLE_ROLLOUT_MODE="internal"` and deploy
   - verify low role-level users return `403` with `required_role_level` and `role_level`
5. Hidden mode test (if temporarily set to off):
   - `GET /guild/me` => `404`

## 4) Rollout Progression
1. Current general availability baseline: `on`
2. Optional canary/restriction window:
   - set `CONSOLE_ROLLOUT_MODE="internal"`
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
