# Sitrep: VIA Auth Error Popup Implementation

**Date**: 2026-02-04
**Status**: PARTIAL - Passkey errors work, identification errors don't

## Summary

Implemented error detection and recovery popup for VIA authentication flows. The popup successfully appears for WebAuthn/passkey failures but fails to detect identification stage errors ("Failed to authenticate" for unknown users).

## What Works

### Passkey Cancel → Popup Appears
- User selects passkey authentication
- User cancels the WebAuthn prompt
- Console intercept catches `NotAllowedError`
- Recovery banner appears with options:
  - Need Help? (links to help page)
  - Create Account (enrollment flow)
  - Email Login Link (recovery flow)
  - Contact Support (mailto)

### Implementation Location
- **Template**: `/via/authentik/custom-templates/if/flow.html`
- **Mounted at**: `/templates/if/flow.html` in container
- **Approach**: Custom base template with injected script

## What Doesn't Work

### Unknown Email → "Failed to authenticate" → No Popup
- User enters email not in database
- Authentik shows "Failed to authenticate"
- Popup does NOT appear despite pattern being in detection list

**Hypothesis**: The error text is rendered inside shadow DOM and our `getAllText()` function isn't reaching it, OR the text is ephemeral/replaced quickly.

### Enrollment with Existing Email → No Popup
- User goes to enrollment flow
- Enters email that already exists
- Hits dead end with no recovery options
- Popup doesn't appear

### Locale Selector Appearing
- `<select id="locale-selector">` showing in UI
- CSS rules added to hide it but may not be effective
- JS hiding added but shadow DOM may block access

### "Powered by authentik" Footer
- Still appearing on some pages
- CSS rules exist in brand config but shadow DOM blocks them
- JS injection to shadow root attempted

## Technical Details

### Error Detection Approach
```javascript
const ERROR_PATTERNS = [
  'Authentication failed',
  'Failed to authenticate',  // <- This should match but doesn't
  'already exists',
  'try again',
  // ... more patterns
];

function getAllText(root) {
  // Recursively get text from element and shadow DOMs
  // This may not be reaching deep enough into Authentik's components
}
```

### Shadow DOM Challenge
Authentik uses web components with shadow DOM extensively:
- `<ak-flow-executor>` - main flow container
- `<ak-stage-identification>` - identification form
- `<ak-stage-*>` - various stage components

Our CSS/JS can't penetrate closed shadow roots. The `getAllText()` function tries to access `shadowRoot` but Authentik components may use closed mode.

### Network Request Pattern
The failing request shows the flow URL with OAuth params:
```
http://localhost:9000/if/flow/via-auth/?client_id=mc-web-prod&...
```

The error happens at the Authentik level, returned via the flow executor's internal state, not as visible DOM text.

## Files Modified

| File | Change |
|------|--------|
| `/via/authentik/custom-templates/if/flow.html` | Custom base template with error detection script |
| `/via/cloudflare/wrangler.toml` | Added local proxy mode documentation |
| `/via/cloudflare/workers/via-auth-helper-local.js` | Local dev proxy (created but not used) |

## Approaches Tried

1. **Cloudflare Worker Proxy** - Created but adds complexity, didn't pursue
2. **Custom Flow Template** - Current approach, partial success
3. **Brand Custom CSS** - Rules exist but shadow DOM blocks them
4. **JS Shadow DOM Traversal** - Implemented but not reaching all content

## Approaches To Try

1. **MutationObserver on specific components** - Watch `ak-flow-executor` shadow root directly
2. **Authentik event listeners** - Hook into Authentik's internal event system
3. **CSS ::part() selectors** - Authentik exposes some parts via `exportparts`
4. **Redirect stage injection** - Add a redirect stage that loads custom JS
5. **Check response JSON** - The flow executor fetches JSON; intercept those responses

## Related Requirements

- **REQ-AUTH-005**: VIA local dev integration (BLOCKED)
- **REQ-BUG-001**: Passkey error UX (PARTIAL - popup works for passkey only)

## Next Steps

1. Debug why "Failed to authenticate" text isn't detected
2. Check if Authentik uses closed shadow DOM (prevents JS access)
3. Consider alternative detection: intercept fetch responses instead of DOM text
4. Test on production domain where via-auth-helper worker is deployed

## Environment

- Authentik: localhost:9000 (via docker stack)
- mc-site worker: localhost:8787
- Custom templates mounted to container
- Brand CSS has 28k chars but shadow DOM blocks it
