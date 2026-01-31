# REQ-AUTH-004: Prompt passkey setup after fallback login methods

## Summary
After a user logs in via a fallback method (Google SSO, magic link), prompt them to set up a passkey for future logins.

## Inspiration
Adobe's UX: "Say goodbye to passwords. Setup Passkey." - shown after user logged in via Google because they couldn't find their password.

## User Story
As a user who just logged in via Google/magic link because I forgot my password,
I want to be prompted to set up a passkey,
So that I can log in faster next time without remembering credentials.

## Acceptance Criteria
- [ ] After Google login, user sees passkey setup prompt
- [ ] After magic link login, user sees passkey setup prompt
- [ ] Prompt includes clear value prop ("Say goodbye to passwords")
- [ ] User can skip/dismiss ("Remind me later" or "Not now")
- [ ] If user completes passkey setup, passkey is registered to their account
- [ ] Prompt does not appear if user already has a passkey configured

## Technical Notes
- Requires detecting "fallback" login path in Authentik flow
- Post-authentication redirect stage to passkey enrollment
- WebAuthn authenticator stage for passkey registration
- Session/cookie to track "reminded later" state
- Consider: only prompt after N fallback logins?

## Implementation Approach
1. Create post-login policy that checks:
   - Did user just use Google/magic-link (not passkey/password)?
   - Does user have a passkey configured?
2. If fallback + no passkey → redirect to enrollment prompt
3. Enrollment prompt page with:
   - Clear copy: "Say goodbye to passwords"
   - "Setup Passkey" CTA
   - "Not now" skip option
4. Skip stores preference (cookie or user attribute)

## Dependencies
- REQ-AUTH-001 (VIA authentication provider)

## Effort
~1.5 weeks
