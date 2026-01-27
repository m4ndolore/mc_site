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
- [ ] Search Authentik flows for passkey-related policies
- [ ] Check `via-auth` flow for conditional stage bindings
- [ ] Review expression policies for WebAuthn device checks
- [ ] Document findings
- [ ] Decide: reuse existing, create new, or skip

## Search Hints
- Check `via-method-select` stage policies
- Look for policies with `WebAuthnDevice` imports
- Review `authentik/custom-templates/blueprints/` for passkey policies
- Check sitreps in `docs/SITREP-*.md` for passkey configuration history

## Implementation
- **Status**: PENDING
- **Phase**: 1
- **Priority**: LOW

## Validation
- **Method**: Manual Test
- Document search findings
- Recommendation on whether to implement

## Dependencies
- REQ-BUG-001 (Option B implemented first as quick fix)

## Related
- REQ-BUG-001 (parent issue)
- VIA configuration skill
