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
- **Status**: PENDING
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
