# REQ-AUTH-003: Account Management and Logout UI

## Description
Add user account management and logout functionality to the site header UI, allowing authenticated users to see their logged-in state and sign out.

## Target
**Metric**: User can see account info and sign out from header

## Reference
- SigmaBlox header auth UI pattern
- `js/builders/auth.js` for auth state APIs

## Acceptance Criteria
- [ ] Header shows user indicator when logged in (name or email)
- [ ] Sign Out button visible and functional
- [ ] Consider account settings link (future)
- [ ] Graceful handling when auth state unknown/loading

## Implementation Considerations

### UI Components
- User avatar or initials badge
- Dropdown menu with:
  - User name/email display
  - Sign Out action
  - (Future) Account settings link

### Integration Points
- `js/builders/auth.js` - `getUser()`, `getLogoutUrl()`
- Header partial or component

## Implementation
- **Status**: PENDING
- **Phase**: 2
- **Priority**: LOW

## Validation
- **Method**: Visual Test
- Header shows correct state for logged in/out users
- Sign out redirects appropriately

## Dependencies
- REQ-AUTH-002 (auth service APIs)

## Related
- REQ-CONTENT-002 (auth UI in header - higher priority login button)
