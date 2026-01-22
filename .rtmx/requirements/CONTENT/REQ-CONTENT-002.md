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
- [ ] Header shows auth state indicator
- [ ] Logged out: "Authenticate" button visible
- [ ] Logged in: User indicator + "Sign Out" button
- [ ] Clicking Authenticate initiates OAuth flow
- [ ] Clicking Sign Out clears session
- [ ] Mobile responsive (hamburger menu includes auth)
- [ ] C2UX compliant language throughout

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
- **Status**: PENDING
- **Phase**: 2
- **Priority**: HIGH

## Validation
- **Method**: Visual Test
- Screenshot header logged out
- Screenshot header logged in
- Test on mobile viewport

## Dependencies
- REQ-AUTH-002 (auth service needed)
