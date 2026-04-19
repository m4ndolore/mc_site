// js/navbar.js — Single source of truth for MC navbar
// Renders into <div id="mc-navbar"></div> on any page
import './sentry.js';
import { toggleTheme } from './theme.js';

const DEFAULT_NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/builders', label: 'Defense Builders' },
  { href: '/wingman', label: 'Wingman' },
  { href: '/guild', label: 'Guild' },
  { href: '/programs/the-combine', label: 'The Combine' },
];

const DEFAULT_PLATFORM_LINKS = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/status', label: 'Status' },
  { href: '/briefs', label: 'Briefs' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/learn', label: 'Learn' },
  { href: 'https://docs.mergecombinator.com', label: 'Docs' },
];

const NAV_CONFIG_CACHE_KEY = 'mc.nav.config.v1';

function getActivePath() {
  const path = window.location.pathname;
  return path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

function isActive(href, activePath) {
  const normalized = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (normalized === '/') return activePath === '/' || activePath === '';
  return activePath === normalized || activePath.startsWith(normalized + '/');
}

function isPlatformActive(activePath, platformLinks) {
  return platformLinks.some(link => isActive(link.href, activePath));
}

function buildSignInHref() {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function renderNavHTML(activePath, navLinks, platformLinks) {
  const navLinksHTML = navLinks.map(link =>
    `<a href="${link.href}" class="nav__link${isActive(link.href, activePath) ? ' nav__link--active' : ''}">${link.label}</a>`
  ).join('\n          ');

  const platformLinksHTML = platformLinks.map(link =>
    `<a href="${link.href}" class="nav__dropdown-item${isActive(link.href, activePath) ? ' nav__link--active' : ''}">${link.label}</a>`
  ).join('\n              ');

  const platformActive = isPlatformActive(activePath, platformLinks);
  const signInHref = buildSignInHref();

  return `<header class="nav" id="nav">
    <div class="nav__container">
      <a href="/" class="nav__logo">
        <img src="/assets/logowhite.png" alt="Merge Combinator" class="nav__logo-img">
      </a>

      <nav class="nav__menu" aria-label="Primary navigation">
        <div class="nav__menu-links">
          ${navLinksHTML}
          <div class="nav__dropdown">
            <button class="nav__link nav__dropdown-trigger${platformActive ? ' nav__link--active' : ''}" aria-expanded="false" aria-haspopup="true">
              Platform
              <svg class="nav__dropdown-icon" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="nav__dropdown-menu">
              ${platformLinksHTML}
            </div>
          </div>
        </div>
        <div class="nav__menu-actions" id="auth-nav">
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" title="Toggle light/dark theme">
            <svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <a href="${signInHref}" class="nav__btn nav__btn--secondary">Sign in</a>
          <a href="/access" class="nav__btn nav__btn--access">Get Started</a>
        </div>
      </nav>

      <button class="nav__mobile-toggle" id="mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>`;
}

async function loadNavConfig() {
  const cached = readCachedNavConfig();
  if (cached) {
    void refreshNavConfigInBackground();
    return cached;
  }

  return refreshNavConfigInBackground();
}

function readCachedNavConfig() {
  try {
    const raw = window.sessionStorage.getItem(NAV_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.navLinks) || !Array.isArray(data?.platformLinks)) {
      return null;
    }
    return data;
  } catch (error) {
    console.warn('[Navbar] Failed to read cached nav config:', error);
    return null;
  }
}

function writeCachedNavConfig(data) {
  try {
    window.sessionStorage.setItem(NAV_CONFIG_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[Navbar] Failed to cache nav config:', error);
  }
}

async function refreshNavConfigInBackground() {
  try {
    const response = await fetch('/data/navigation.json', { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const navLinks = Array.isArray(data?.navLinks) ? data.navLinks : DEFAULT_NAV_LINKS;
    const platformLinks = Array.isArray(data?.platformLinks) ? data.platformLinks : DEFAULT_PLATFORM_LINKS;
    const resolved = { navLinks, platformLinks };
    writeCachedNavConfig(resolved);
    return resolved;
  } catch (error) {
    console.warn('[Navbar] Failed to load shared nav config, using defaults:', error);
    return { navLinks: DEFAULT_NAV_LINKS, platformLinks: DEFAULT_PLATFORM_LINKS };
  }
}

// ── Scroll behavior ──
function initScrollBehavior() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const threshold = 50;
  const handleScroll = () => {
    if (window.pageYOffset > threshold) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ── Mobile menu ──
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.querySelector('.nav__menu');
  if (!toggle || !menu) return;

  const closeDropdowns = () => {
    document.querySelectorAll('.nav__dropdown.active').forEach(d => {
      d.classList.remove('active');
      const t = d.querySelector('.nav__dropdown-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };

  const setMenuState = (isOpen) => {
    toggle.classList.toggle('active', isOpen);
    menu.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) closeDropdowns();
  };

  const isOpen = () => toggle.classList.contains('active');

  toggle.addEventListener('click', () => setMenuState(!isOpen()));

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenuState(false);
  });

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    setMenuState(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setMenuState(false);
  });

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 1024 && isOpen()) setMenuState(false);
  }, 150));
}

// ── Dropdown ──
function initDropdown() {
  document.querySelectorAll('.nav__dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav__dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        dropdown.classList.toggle('active');
        trigger.setAttribute('aria-expanded', String(dropdown.classList.contains('active')));
      }
    });
  });
}

// ── Auth state ──
async function initAuth() {
  const container = document.getElementById('auth-nav');
  if (!container) return;

  try {
    const response = await fetch('/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return; // Keep default sign-in/join buttons

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return; // Non-JSON (e.g. HTML fallback)

    const data = await response.json();
    if (data.authenticated && data.user) {
      const displayName = data.user.name || data.user.email?.split('@')[0] || 'Operator';
      const initial = displayName.charAt(0).toUpperCase();

      container.classList.add('nav__dropdown', 'nav__dropdown--user');
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
  } catch (err) {
    console.error('[Navbar] Auth check failed:', err);
  }
}

// ── Main entry ──
export default async function initNavbar() {
  const mount = document.getElementById('mc-navbar');
  if (!mount) return;

  // Guard: don't double-init
  if (mount.dataset.initialized) return;
  mount.dataset.initialized = 'true';

  const activePath = getActivePath();
  const fallbackConfig = { navLinks: DEFAULT_NAV_LINKS, platformLinks: DEFAULT_PLATFORM_LINKS };
  const cachedConfig = readCachedNavConfig();
  let renderedConfig = cachedConfig || fallbackConfig;

  mount.innerHTML = renderNavHTML(activePath, renderedConfig.navLinks, renderedConfig.platformLinks);

  const initRenderedNavbar = () => {
    initScrollBehavior();
    initMobileMenu();
    initDropdown();
    initThemeToggle();
    initAuth();
  };

  initRenderedNavbar();

  const resolvedConfig = await loadNavConfig();
  const renderedSignature = JSON.stringify(renderedConfig);
  const resolvedSignature = JSON.stringify(resolvedConfig);
  if (resolvedSignature !== renderedSignature) {
    renderedConfig = resolvedConfig;
    mount.innerHTML = renderNavHTML(activePath, renderedConfig.navLinks, renderedConfig.platformLinks);
    initRenderedNavbar();
  }
}

// ── Theme toggle ──
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', toggleTheme);
}

// Auto-init when loaded as a script tag (not just imported)
if (document.getElementById('mc-navbar')) {
  initNavbar();
}
