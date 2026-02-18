# REQ-INFRA-001: Create api.mergecombinator.com for VIA webhook services

## Status: COMPLETE

Superseded by REQ-INFRA-004 which deployed the mc-api Cloudflare Worker. All core functionality delivered.

## Summary
Migrate VIA-specific webhook/API services from api.sigmablox.com to api.mergecombinator.com.

## Completed (via REQ-INFRA-004)
1. [x] DNS record — api.mergecombinator.com resolves to Cloudflare (proxied A record)
2. [x] Service deployed — mc-api Cloudflare Worker with route `api.mergecombinator.com/*`
3. [x] Endpoints implemented:
   - `GET /auth/post-2fa` — Post-2FA redirect handler (GET for browser redirect, not POST)
   - `POST /api/verify-email` — Email verification
   - `GET /health` — Health check endpoint
4. [x] Template defaults updated — `via-2fa-complete.html` and `via-welcome.html` now default to `https://api.mergecombinator.com`
5. [x] Health endpoint verified live

## Scope Completed
**Migrated to api.mergecombinator.com:**
- VIA 2FA completion redirect (`/auth/post-2fa`)
- VIA email verification (`/api/verify-email`)

**Kept on api.sigmablox.com:**
- Ghost user database sync
- SigmaBlox-specific content/webhooks

## Note on VIA Config
Templates use `{{ api_base|default:"https://api.mergecombinator.com" }}` — the default is now the MC endpoint. A dedicated `api_base` config variable in VIA YAML was not added since the template defaults are sufficient for production. If per-environment overrides are needed in the future, add `api_base` to `via/config/schema.js` and `via/config/prod.yaml`.

## Dependencies
None
