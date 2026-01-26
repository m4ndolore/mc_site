// js/auth-nav.js
// Auth navigation UI - updates dropdown based on auth state

(async function initAuthNav() {
  const authContainer = document.getElementById('auth-nav');
  if (!authContainer) return;

  // Check auth status
  try {
    const response = await fetch('/auth/me', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      showLoggedOutDropdown(authContainer);
      return;
    }

    const data = await response.json();

    if (data.authenticated && data.user) {
      showLoggedInDropdown(authContainer, data.user);
    } else {
      showLoggedOutDropdown(authContainer);
    }
  } catch (error) {
    console.error('[Auth] Failed to check auth status:', error);
    showLoggedOutDropdown(authContainer);
  }
})();

function showLoggedOutDropdown(container) {
  // C2UX: Use operational language - "Authenticate" not marketing-speak like "Access" or "Sign In"
  container.innerHTML = `
    <a href="/auth/login" class="nav__btn nav__btn--primary">Authenticate</a>
  `;
}

function showLoggedInDropdown(container, user) {
  const displayName = user.name || user.email?.split('@')[0] || 'Operator';
  const initial = displayName.charAt(0).toUpperCase();

  // Add dropdown classes for positioning
  container.classList.add('nav__dropdown');
  container.classList.add('nav__dropdown--user');
  container.innerHTML = `
    <button class="nav__btn nav__dropdown-trigger">
      <span class="nav__user-avatar">${initial}</span>
      ${displayName}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="nav__dropdown-menu">
      <a href="/dashboard" class="nav__dropdown-item">Operations Console</a>
      <div class="nav__dropdown-divider"></div>
      <a href="/auth/logout" class="nav__dropdown-item">Terminate Session</a>
    </div>
  `;
}
