# REQ-INFRA-001: Create api.mergecombinator.com for VIA webhook services

## Summary
Migrate VIA-specific webhook/API services from api.sigmablox.com to api.mergecombinator.com.

## Current State
- `api.sigmablox.com` exists (Cloud Run via ghs.googlehosted.com)
- `api.mergecombinator.com` does NOT exist (NXDOMAIN)
- VIA flow templates reference api.sigmablox.com as default
- Templates are config-driven via `{{ api_base|default:"..." }}`

## Scope
**Migrate to api.mergecombinator.com:**
- VIA 2FA completion redirect (`/auth/post-2fa`)
- VIA email verification (`/api/verify-email`)
- VIA-specific webhooks

**Keep on api.sigmablox.com:**
- Ghost user database sync
- SigmaBlox-specific content/webhooks

## Tasks
1. [ ] Create DNS record for api.mergecombinator.com
2. [ ] Deploy service (Cloudflare Worker or Cloud Run)
3. [ ] Implement required endpoints:
   - `POST /auth/post-2fa` - Post-2FA redirect handler
   - `POST /api/verify-email` - Email verification
4. [ ] Update VIA config to set `api_base` to new URL
5. [ ] Update template defaults (currently hardcoded to sigmablox)
6. [ ] Test flows end-to-end

## Files Affected
- `via/authentik/custom-templates/flows/via-2fa-complete.html` - uses `{{ api_base }}`
- `via/authentik/custom-templates/flows/via-welcome.html` - uses `{{ api_base }}`
- `via/config/*.yaml` - needs `api_base` config key

## Dependencies
None - can proceed independently

## Effort
~2 weeks
