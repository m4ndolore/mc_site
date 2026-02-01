# REQ-BUG-002: Investigate Existing Passkey-Hide Policy

## Description
There was previously a stage or flow that conditionally hid the passkey authentication option based on user configuration. Find this existing implementation and evaluate whether it can be reused for the defense-builders application.

## Target
**Metric**: Locate existing policy/stage, document findings, decide on implementation

## Background
During BUG-001 investigation, we identified two solutions:
- **Option A**: Policy to hide passkey if user has no WebAuthn devices configured
- **Option B**: Better error page with "Try another method" (implemented first)

Option A may already exist in the codebase from previous VIA configuration work.

## Acceptance Criteria
- [x] Search Authentik flows for passkey-related policies
- [x] Check `via-auth` flow for conditional stage bindings
- [x] Review expression policies for WebAuthn device checks
- [x] Document findings
- [x] Decide: reuse existing, create new, or skip

## Research Findings - 2026-01-26

### Existing Pattern Found
Located in `via-oauth-flow.yaml:114-131`:

```python
# via-oauth-skip-if-configured policy
from authentik.stages.authenticator_webauthn.models import WebAuthnDevice
from authentik.stages.authenticator_totp.models import TOTPDevice

user = request.user
has_passkey = WebAuthnDevice.objects.filter(user=user, confirmed=True).exists()
has_totp = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
```

This pattern is used to skip the setup prompt if user already has authenticators.

### How to Hide Passkey Option
To dynamically hide "Passkey" from method selection, modify `via-method-select-field` placeholder:

```python
from authentik.stages.authenticator_webauthn.models import WebAuthnDevice

user = request.context.get('pending_user') or request.user
options = ["Magic Link"]

if user and not user.is_anonymous:
    if WebAuthnDevice.objects.filter(user=user, confirmed=True).exists():
        options.append("Passkey")

options.extend(["Authenticator", "Password"])
return options
```

### Recommendation: SKIP

**Do not implement Option A.** Reasoning:

1. **BUG-001 already solved the UX problem** - Users who select Passkey without having one now get a helpful recovery page instead of a confusing error.

2. **Hiding options adds complexity** - Dynamic radio button options based on user device state adds maintenance burden.

3. **Discoverability concern** - Users who COULD set up a passkey won't see the option during login, missing a chance to upgrade their security.

4. **Consistency** - All users see the same options, reducing confusion about "why do I see different options?"

The redirect-to-recovery approach (BUG-001) is the better UX pattern because it:
- Educates users that passkeys exist
- Provides clear guidance when they can't use one
- Links to setup flow for users who want to configure a passkey

## Implementation
- **Status**: COMPLETE (research only, no implementation needed)
- **Phase**: 1
- **Priority**: LOW

## Validation
- **Method**: Manual Test
- Document search findings ✓
- Recommendation on whether to implement ✓

## Dependencies
- REQ-BUG-001 (Option B implemented first as quick fix)

## Related
- REQ-BUG-001 (parent issue)
- VIA configuration skill
- `via-oauth-flow.yaml` - contains WebAuthnDevice check pattern
