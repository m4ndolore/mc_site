# REQ-BUG-001: VIA Passkey Flow Shows Poor Error UX on Unconfigured Domains

## Description
When attempting passkey authentication on mergecombinator.com (which is not configured for passkeys), the user is allowed to attempt the flow but then lands on an access denied page with insufficient recovery options.

## Problem
1. User selects passkey authentication method
2. Flow proceeds even though domain isn't configured for passkeys
3. User lands on "Access Denied" page
4. Only option is "Not you?" button - which is:
   - Not accurate (it IS them, just wrong auth method)
   - Doesn't clearly indicate how to try another method

## Target
**Metric**: Passkey option hidden for unconfigured domains OR error page provides clear "Try another method" recovery path

## Acceptance Criteria
- [ ] Either: Hide passkey option for domains without passkey configured
- [ ] Or: Access denied page includes clear "Try another authentication method" button
- [ ] "Not you?" text updated to be more accurate/helpful
- [ ] User can easily recover and authenticate via alternative method

## Implementation Options

### Option A: Hide Passkey (Preferred)
- Configure VIA to not show passkey option for `defense-builders` application
- Requires Authentik admin configuration

### Option B: Better Error UX
- Modify access denied page/flow to include recovery options
- Add "Try a different sign-in method" button
- Link back to auth method selection

## Implementation
- **Status**: PARTIAL
- **Phase**: 1
- **Priority**: MEDIUM

## Validation
- **Method**: Manual Test
- Attempt passkey auth on mergecombinator.com
- Verify either passkey not offered OR clear recovery path exists

## Dependencies
- None

## Related
- REQ-AUTH-001 (VIA OAuth configuration)
- VIA/Authentik admin settings
- REQ-BUG-002 (investigate hiding passkey option)

---

## Sitrep - 2026-01-26 (Session 1)

**Session**: claude-2026-01-26-via-passkey-ux
**Status**: PARTIAL

### Completed This Session

**Option B Implementation - Custom Recovery Page:**

1. Created custom recovery page: `authentik/media/via-auth-denied.html`
   - Matches VIA design aesthetic (dark theme, accent colors)
   - Split-panel layout like other VIA pages
   - Warning icon with amber/orange accent
   - Clear explanation of common failure reasons
   - Three recovery options:
     - **Try Again** - Returns to `/if/flow/via-auth/` (primary action)
     - **Reset Authentication** - Links to `/if/flow/via-recovery/`
     - **Contact Support** - Email to support@sigmablox.com

2. Created Authentik resources via API:
   - Flow: `via-auth-denied` (pk: 391ad413-b3ff-4a91-8bbc-e9a9571e5333)
   - Redirect Stage: `via-auth-denied-redirect` (pk: d9d8cea2-0078-44be-b95f-3394c346de6b)
   - Stage bound to flow

3. Recovery page accessible at: `http://localhost:9000/media/via-auth-denied.html`

### Remaining Work

To complete the integration:

1. **Connect redirect to passkey failure:**
   - Add `via-auth-denied-redirect` stage to via-auth flow
   - Configure policy to trigger when passkey validation fails
   - OR update via-passkey stage's `invalid_response_action`

2. **Alternative: CSS enhancement:**
   - Add CSS to Authentik's denied message to include recovery link
   - Style the "Not you?" button area with our recovery page link

3. **Test end-to-end:**
   - Attempt passkey on mergecombinator.com
   - Verify redirect to recovery page
   - Verify "Try Again" returns to auth flow

### Files Created
- `/Users/paulgarcia/Dev/sigmablox/authentik/media/via-auth-denied.html`
- `/Users/paulgarcia/Dev/sigmablox/authentik/custom-templates/flows/via-auth-denied.html` (Django template version)

### Authentik Resources Created
- Flow: `via-auth-denied`
- Stage: `via-auth-denied-redirect`
- Stage Binding: connecting stage to flow
