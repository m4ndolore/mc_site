# REQ-AUTH-005: VIA Local Dev Integration

## Requirement

VIA OAuth login flow shall work on localhost with error recovery banner for all failure scenarios.

## Status: PARTIAL

**Working**: Passkey/WebAuthn errors trigger popup
**Not Working**: Identification errors ("Failed to authenticate") don't trigger popup

## Acceptance Criteria

- [x] Login flow initiates from localhost:8787
- [x] Passkey cancel shows recovery popup
- [ ] Unknown email shows recovery popup
- [ ] Enrollment with existing email shows recovery popup
- [ ] Locale selector hidden
- [ ] "Powered by authentik" footer hidden

## Implementation

### Custom Flow Template
**Location**: `/via/authentik/custom-templates/if/flow.html`
**Mounted**: `/templates/if/flow.html` in Authentik container

The template injects:
1. CSS to hide locale selector and footer
2. JS error detection script that watches for error patterns
3. Recovery banner with Create Account / Email Login / Support links

### Error Detection Approach
```javascript
const ERROR_PATTERNS = ['Failed to authenticate', 'Authentication failed', ...];

function getAllText(root) {
  // Recursively extract text from DOM and shadow DOMs
}

// MutationObserver watches for DOM changes
// Console intercept catches WebAuthn errors
```

### Why Identification Errors Don't Trigger

**Hypothesis**: Authentik components use shadow DOM that our JS can't penetrate:
- `<ak-flow-executor>` contains the flow
- `<ak-stage-identification>` renders the error
- Error text may be in closed shadow root

**Evidence**: WebAuthn errors work because they're caught via `console.error` intercept, not DOM text scanning.

## Blocked By

- Shadow DOM architecture of Authentik components
- Need to find alternative detection method (fetch intercept, events, etc.)

## Next Steps

1. Check if Authentik shadow roots are open or closed
2. Try intercepting fetch responses instead of DOM text
3. Look for Authentik events or callbacks
4. Test if production worker deployment works better

## Dependencies

- REQ-AUTH-001: VIA OAuth provider configuration
- REQ-BUG-001: Passkey error UX

## References

- Sitrep: `docs/sitrep-2026-02-04-via-auth-popup.md`
- Template: `/via/authentik/custom-templates/if/flow.html`
- Previous sitrep: `docs/sitrep-2026-02-03-via-auth-blocked.md`
