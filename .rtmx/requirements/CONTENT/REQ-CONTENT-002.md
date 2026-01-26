# REQ-CONTENT-002: Auth UI Components in Site Header

## Description
Add authentication state indicator and login/logout buttons to the site header. UI must follow C2UX operational language guidelines.

## Target
**Metric**: Login/logout buttons visible and functional in header

## Reference
- SigmaBlox Ghost theme header auth UI
- C2UX doctrine: `docs/theme/ux.md`
- `~/.claude/skills/command-center-ui-enforcer/SKILL.md`

## Acceptance Criteria
- [x] Header shows auth state indicator
- [x] Logged out: "Authenticate" button visible
- [x] Logged in: User indicator + "Terminate Session" button
- [x] Clicking Authenticate initiates OAuth flow (links to /auth/login)
- [x] Clicking Terminate Session clears session (links to /auth/logout)
- [x] Mobile responsive (hamburger menu includes auth via nav__menu-actions)
- [x] C2UX compliant language throughout

## Implementation

### Header Component Update
```html
<!-- Current header -->
<header class="header">
  <nav class="nav">
    <a href="/" class="nav__logo">MC</a>
    <div class="nav__links">
      <a href="/builders">Builders</a>
      <a href="/portfolio">Portfolio</a>
    </div>
  </nav>
</header>

<!-- Updated with auth -->
<header class="header">
  <nav class="nav">
    <a href="/" class="nav__logo">MC</a>
    <div class="nav__links">
      <a href="/builders">Builders</a>
      <a href="/portfolio">Portfolio</a>
    </div>
    <div class="nav__auth" id="auth-container">
      <!-- Populated by JS -->
    </div>
  </nav>
</header>
```

### Auth UI JavaScript
```javascript
// js/auth/ui.js
import { isAuthenticated, getUser, login, logout } from './via-service.js';

export async function renderAuthUI() {
  const container = document.getElementById('auth-container');
  if (!container) return;

  const authenticated = await isAuthenticated();

  if (authenticated) {
    const user = await getUser();
    container.innerHTML = `
      <span class="auth__user">${user?.email || 'User'}</span>
      <button class="auth__button" onclick="handleLogout()">Sign Out</button>
    `;
  } else {
    container.innerHTML = `
      <button class="auth__button auth__button--primary" onclick="handleLogin()">
        Authenticate
      </button>
    `;
  }
}

window.handleLogin = () => login();
window.handleLogout = () => logout();
```

### CSS Styling (C2UX Compliant)
```css
.auth__button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  cursor: pointer;
}

.auth__button--primary {
  background: var(--color-signal-blue);
  border-color: var(--color-signal-blue);
  color: white;
}

.auth__user {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-right: 0.5rem;
}
```

## Implementation
- **Status**: COMPLETE
- **Phase**: 2
- **Priority**: HIGH

## Validation
- **Method**: Visual Test
- Screenshot header logged out
- Screenshot header logged in
- Test on mobile viewport

## Dependencies
- REQ-AUTH-002 (auth service needed)

---

## Sitrep - 2026-01-26 (Session 1)

**Session**: claude-2026-01-26-auth-ui-header
**Status**: COMPLETE

### Completed This Session
- Updated `js/auth-nav.js` with C2UX compliant language:
  - Logged out: "Authenticate" button (not "Access" or "Sign In")
  - Logged in: User dropdown with "Operations Console" and "Terminate Session" (not "Dashboard" and "Sign Out")
  - Default fallback display name is "Operator" (not "User")
- Updated 11 HTML files to use "Authenticate" as fallback text in static HTML:
  - index.html, builders.html, knowledge.html, security.html, opportunities.html
  - merch.html, archive.html, terms.html, 404.html, privacy.html, portfolio.html
- Changed auth link from `/access` to `/auth/login` for proper OAuth flow
- Added `nav__dropdown` class to container for correct dropdown positioning

### Files Modified This Session
- `js/auth-nav.js` - C2UX language updates
- `index.html` - Auth button text and link
- `builders.html` - Auth button text and link
- `knowledge.html` - Auth button text and link
- `security.html` - Auth button text and link
- `opportunities.html` - Auth button text and link
- `merch.html` - Auth button text and link
- `archive.html` - Auth button text and link
- `terms.html` - Auth button text and link
- `404.html` - Auth button text and link
- `privacy.html` - Auth button text and link
- `portfolio.html` - Auth button text and link

### C2UX Language Applied
Per `docs/theme/ux.md` doctrine:
- "Authenticate" instead of "Access", "Sign In", "Login"
- "Operations Console" instead of "Dashboard"
- "Terminate Session" instead of "Sign Out", "Logout"
- "Operator" as default user display (not "User")

### Notes
- Existing CSS styles in `styles.css` already support the dropdown UI (nav__dropdown, nav__dropdown-trigger, nav__user-avatar, etc.)
- The auth service at `js/builders/auth.js` provides the API used by auth-nav.js
- Mobile responsive hamburger menu includes auth through the nav__menu-actions div
