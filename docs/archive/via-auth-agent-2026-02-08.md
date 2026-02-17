# VIA Auth Stabilization Agent Prompt

**Date:** 2026-02-08
**Objective:** Resolve VIA authentication blockers to unblock user onboarding flows

---

## Context

VIA (Verified Identity Access) is the Authentik-based SSO system for MergeCombinator. Authentication flows are partially broken, blocking onboarding UX.

### Current Blockers

1. **Error detection in shadow DOM fails** — Authentik uses web components with shadow DOM. The error recovery popup (via-auth-helper.js) detects passkey cancellation but NOT "Failed to authenticate" errors for unknown emails.

2. **MFA stage fixes not persisted** — Manual API fixes to `via-passkey` and `via-totp` stages (`not_configured_action: configure`) are lost on DB reset. Need to persist in Authentik blueprints.

3. **Branding CSS blocked by shadow DOM** — "Powered by authentik" footer and locale selector appearing despite CSS rules to hide them.

---

## Key Files

| File | Purpose |
|------|---------|
| `/Users/paulgarcia/Dev/via/authentik/custom-templates/if/flow.html` | Custom base template with error detection script |
| `/Users/paulgarcia/Dev/via/cloudflare/workers/via-auth-helper.js` | Error popup injection worker |
| `/Users/paulgarcia/Dev/mc_site/cloudflare/auth.js` | MC OAuth PKCE flow |
| `/Users/paulgarcia/Dev/mc_site/cloudflare/merge-router.js` | Routes /auth/* to auth handler |

---

## Environment

- **Authentik:** localhost:9000 (via docker stack at `/Users/paulgarcia/Dev/via/authentik`)
- **mc-site worker:** localhost:8787
- **VIA URLs:** via.mergecombinator.com (prod), localhost:9000 (dev)

---

## Tasks

### Task 1: Debug Shadow DOM Error Detection

**Problem:** "Failed to authenticate" text isn't detected by `getAllText()` function.

**Approaches to try:**
1. Check if Authentik uses closed shadow DOM (`mode: 'closed'`)
2. Intercept fetch responses instead of DOM text — the flow executor fetches JSON; hook XMLHttpRequest/fetch
3. Use MutationObserver on `ak-flow-executor` shadow root
4. Check if Authentik exposes CSS `::part()` selectors via `exportparts`

**File to modify:** `/via/authentik/custom-templates/if/flow.html`

### Task 2: Persist MFA Stage Configuration

**Problem:** Stage fixes via Authentik API are lost on DB reset.

**Solution:** Create Authentik blueprint YAML files to persist:
- `via-passkey` stage: `not_configured_action: configure` (point to `via-setup-passkey`)
- `via-totp` stage: `not_configured_action: configure`

**Location:** `/Users/paulgarcia/Dev/via/authentik/blueprints/`

### Task 3: Fix Branding CSS

**Problem:** Shadow DOM blocks CSS rules for hiding Authentik branding.

**Approaches:**
1. Use `::part()` selectors if Authentik exports parts
2. Inject CSS into shadow roots via JS
3. Check Authentik docs for official branding customization

---

## Reference Sitreps

- `/Users/paulgarcia/Dev/mc_site/docs/sitrep-2026-02-04-via-auth-popup.md`
- `/Users/paulgarcia/Dev/mc_site/docs/sitrep-2026-02-03-via-auth-blocked.md`

---

## RTM Requirements

- **REQ-AUTH-005:** VIA local dev integration (BLOCKED)
- **REQ-BUG-001:** Passkey error UX (PARTIAL)
- **REQ-AUTH-004:** Passkey setup prompt (blocked on this)

---

## Deliverables

1. Working error detection for "Failed to authenticate" scenarios
2. Blueprint YAML files for MFA stage configuration
3. Hidden Authentik branding (footer, locale selector)
4. Updated sitrep documenting what was tried and what worked

---

## Notes

- The `/via/` directory is a separate repo from mc_site
- Test on localhost:9000 with Docker stack running
- Worker deployment is separate (via.mergecombinator.com)
- Check for VIA skill in superpowers: `via-configuration`
