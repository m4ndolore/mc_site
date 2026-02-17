# REQ-UX-008: Unified Modular Navbar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the navbar into a single JS module (`js/navbar.js`) that all 28 HTML pages consume, eliminating copy-paste duplication and enabling consistent nav changes from one file.

**Architecture:** A vanilla JS module that renders the navbar HTML into a `<div id="mc-navbar">` mount point, initializes all interactive behaviors (scroll blur, mobile menu, dropdown, auth state), and auto-detects the active page from `window.location.pathname`. All existing nav CSS in `styles.css` remains untouched — the generated HTML uses the same class names. The separate React navbar in `opportunities/` is out of scope for this task (it's a separate Vite app on a different subdomain).

**Tech Stack:** Vanilla JS (ES module), existing Tailwind/custom CSS in styles.css

---

## Inventory: Pages to Convert

28 source HTML pages in the Vite build (from `vite.config.js`):

**Root pages (20):** index.html, blog.html, portfolio.html, builders.html, dashboard.html, status.html, merch.html, opportunities.html, knowledge.html, privacy.html, terms.html, security.html, archive.html, access.html, contribute.html, wingman.html, guild.html, briefs.html, about.html, 404.html

**Subdirectory pages (8):** programs/index.html, programs/the-combine.html, knowledge/go-to-market.html, knowledge/acquisition.html, knowledge/sbir.html, knowledge/compliance.html, blog/counter-drone-jiatf-401.html, blog/ndaa-speed-act.html, blog/uss-eisenhower-lessons.html

**Out of scope:** opportunities/ React SPA (separate Vite app, has its own Layout.tsx with navbar copy), Outline Wiki docs header.

## Key Design Decisions

1. **Shared JS Module (Option B)** — not Web Component. The module injects the same BEM-class HTML that already has CSS in styles.css. No Shadow DOM, no style duplication.

2. **about.html gets standardized** — its legacy nav (About, Services, Portfolio, Blog, Careers) is replaced with the standard nav. It's the only page with different links and should match.

3. **Active page auto-detection** — navbar.js reads `window.location.pathname` and applies `nav__link--active` to the matching link. No manual `active` attributes needed per page.

4. **Auth integration built-in** — the auth-nav.js logic merges into navbar.js. The navbar renders `#auth-nav` container and checks `/auth/me` on mount. No separate script needed.

5. **Dropdown items include Opportunities** — the React Layout.tsx already has it. Main site nav should match: Status, Opportunities, Briefs, Knowledge, Docs.

6. **script.js nav functions become no-ops** — `initNavigation()`, `initMobileMenu()`, `initDropdownMenu()` in script.js currently operate on the static HTML nav. After migration, navbar.js owns all nav behavior. The script.js functions will detect navbar.js already initialized and skip.

---

## Task 1: Create js/navbar.js Module

**Files:**
- Create: `js/navbar.js`

**Step 1: Write the navbar module**

Create `js/navbar.js` that exports a default `initNavbar()` function:

```javascript
// js/navbar.js — Single source of truth for MC navbar
// Renders into <div id="mc-navbar"></div> on any page

const NAV_LINKS = [
  { href: '/builders', label: 'Defense Builders' },
  { href: '/wingman', label: 'Wingman' },
  { href: '/guild', label: 'Guild' },
  { href: '/programs/the-combine', label: 'The Combine' },
];

const PLATFORM_LINKS = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/status', label: 'Status' },
  { href: '/briefs', label: 'Briefs' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: 'https://docs.mergecombinator.com', label: 'Docs' },
];

function getActivePath() {
  const path = window.location.pathname;
  // Normalize: strip trailing slash, treat /index.html as /
  return path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

function isActive(href, activePath) {
  const normalized = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (normalized === '/') return activePath === '/' || activePath === '';
  return activePath === normalized || activePath.startsWith(normalized + '/');
}

function isPlatformActive(activePath) {
  return PLATFORM_LINKS.some(link => isActive(link.href, activePath));
}

function renderNavHTML(activePath) {
  const navLinksHTML = NAV_LINKS.map(link =>
    `<a href="${link.href}" class="nav__link${isActive(link.href, activePath) ? ' nav__link--active' : ''}">${link.label}</a>`
  ).join('\n          ');

  const platformLinksHTML = PLATFORM_LINKS.map(link =>
    `<a href="${link.href}" class="nav__dropdown-item${isActive(link.href, activePath) ? ' nav__link--active' : ''}">${link.label}</a>`
  ).join('\n              ');

  const platformActive = isPlatformActive(activePath);

  return `<header class="nav" id="nav">
    <div class="nav__container">
      <a href="/" class="nav__logo">
        <span class="nav__logo-text">
          <span class="nav__logo-merge">Merge</span>
          <span class="nav__logo-combinator">Combinator</span>
        </span>
        <img src="/assets/arrows-2.png" alt="Merge arrows" class="nav__logo-icon">
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
          <a href="/auth/login" class="nav__btn nav__btn--secondary">Sign in</a>
          <a href="/access" class="nav__btn nav__btn--access">Join</a>
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
export default function initNavbar() {
  const mount = document.getElementById('mc-navbar');
  if (!mount) return;

  // Guard: don't double-init
  if (mount.dataset.initialized) return;
  mount.dataset.initialized = 'true';

  const activePath = getActivePath();
  mount.innerHTML = renderNavHTML(activePath);

  initScrollBehavior();
  initMobileMenu();
  initDropdown();
  initAuth();
}

// Auto-init when loaded as a script tag (not just imported)
if (document.getElementById('mc-navbar')) {
  initNavbar();
}
```

**Step 2: Verify the module loads standalone**

Run: `npm run build` — should succeed (new file, no consumers yet)

**Step 3: Commit**

```bash
git add js/navbar.js
git commit -m "feat(REQ-UX-008): create unified navbar module js/navbar.js"
```

---

## Task 2: Guard script.js Nav Functions

**Files:**
- Modify: `script.js` (lines ~118, ~683, ~741)

**Step 1: Add guard checks to existing nav functions**

The existing `initNavigation()`, `initMobileMenu()`, and `initDropdownMenu()` in script.js must not double-initialize if navbar.js already runs. Add a guard at the top of each:

```javascript
// In initNavigation():
function initNavigation() {
  const nav = document.getElementById('nav');
  if (!nav || document.getElementById('mc-navbar')?.dataset?.initialized) return;
  // ... rest unchanged
}

// In initMobileMenu():
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  if (!toggle || document.getElementById('mc-navbar')?.dataset?.initialized) return;
  // ... rest unchanged
}

// In initDropdownMenu():
function initDropdownMenu() {
  if (document.getElementById('mc-navbar')?.dataset?.initialized) return;
  // ... rest unchanged
}
```

**Step 2: Build check**

Run: `npm run build`

**Step 3: Commit**

```bash
git add script.js
git commit -m "feat(REQ-UX-008): guard script.js nav functions against navbar.js double-init"
```

---

## Task 3: Convert Pages — Batch 1 (High-Traffic Root Pages)

**Files to modify:** index.html, builders.html, wingman.html, guild.html, dashboard.html, opportunities.html, knowledge.html, status.html, briefs.html

**Step 1: For each page, replace the static `<header class="nav" id="nav">...</header>` block with:**

```html
  <div id="mc-navbar"></div>
```

And ensure the script loading at the bottom includes:

```html
  <script type="module" src="js/navbar.js"></script>
```

And REMOVE the `<script type="module" src="js/auth-nav.js"></script>` line (auth is now built into navbar.js).

**The replacement is mechanical:**
1. Delete everything from `<header class="nav"` through `</header>` (the nav block, ~44 lines)
2. Insert `<div id="mc-navbar"></div>` in its place
3. Add `<script type="module" src="js/navbar.js"></script>` before the closing `</body>` (if not already there)
4. Remove `<script type="module" src="js/auth-nav.js"></script>` (if present)

**Step 2: Build check**

Run: `npm run build`

**Step 3: Visual verification**

Start dev server and check index.html, builders.html, wingman.html in browser. Verify:
- Navbar renders identically
- Active page highlighting works (builders should be highlighted on /builders)
- Mobile menu opens/closes
- Platform dropdown works
- No console errors

**Step 4: Commit**

```bash
git add index.html builders.html wingman.html guild.html dashboard.html opportunities.html knowledge.html status.html briefs.html js/navbar.js
git commit -m "feat(REQ-UX-008): convert 9 high-traffic pages to unified navbar"
```

---

## Task 4: Convert Pages — Batch 2 (Content & Legal Pages)

**Files to modify:** blog.html, portfolio.html, archive.html, merch.html, access.html, contribute.html, privacy.html, terms.html, security.html, 404.html, combine.html (if it exists)

**Step 1: Same mechanical replacement as Task 3**

For each page:
1. Replace static nav HTML with `<div id="mc-navbar"></div>`
2. Ensure `<script type="module" src="js/navbar.js"></script>` in scripts
3. Remove `<script type="module" src="js/auth-nav.js"></script>`

**Step 2: Build check**

Run: `npm run build`

**Step 3: Commit**

```bash
git add blog.html portfolio.html archive.html merch.html access.html contribute.html privacy.html terms.html security.html 404.html combine.html
git commit -m "feat(REQ-UX-008): convert content and legal pages to unified navbar"
```

---

## Task 5: Convert Pages — Batch 3 (Subdirectory Pages)

**Files to modify:** programs/index.html, programs/the-combine.html, knowledge/go-to-market.html, knowledge/acquisition.html, knowledge/sbir.html, knowledge/compliance.html, blog/counter-drone-jiatf-401.html, blog/ndaa-speed-act.html, blog/uss-eisenhower-lessons.html

**Step 1: Same mechanical replacement**

**Important for subdirectory pages:** The script src must use absolute paths since these pages are in subdirectories:

```html
<script type="module" src="/js/navbar.js"></script>
```

The logo image path in navbar.js already uses `/assets/arrows-2.png` (absolute), so no issue there.

**Step 2: Build check**

Run: `npm run build`

**Step 3: Commit**

```bash
git add programs/ knowledge/ blog/
git commit -m "feat(REQ-UX-008): convert subdirectory pages to unified navbar"
```

---

## Task 6: Standardize about.html

**Files to modify:** about.html

**Step 1: Replace about.html's unique nav**

about.html currently has a completely different nav structure (About, Services, Portfolio, Blog, Careers links with different buttons). Replace the entire `<header>...</header>` block with the standard mount point:

```html
<div id="mc-navbar"></div>
```

And add the script:

```html
<script type="module" src="js/navbar.js"></script>
```

**Step 2: Build check**

Run: `npm run build`

**Step 3: Commit**

```bash
git add about.html
git commit -m "feat(REQ-UX-008): standardize about.html navbar to match site"
```

---

## Task 7: Remove js/auth-nav.js

**Files:**
- Delete: `js/auth-nav.js`

**Step 1: Verify no pages still reference auth-nav.js**

Search for any remaining `auth-nav.js` references in HTML files. There should be none after Tasks 3-6.

**Step 2: Delete the file**

```bash
rm js/auth-nav.js
```

**Step 3: Build check**

Run: `npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(REQ-UX-008): remove auth-nav.js — auth integrated into navbar.js"
```

---

## Task 8: Full Visual Verification & Tag

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Check these pages visually (Playwright MCP or manual):**

- `http://localhost:3000/` — navbar renders, no active link, scroll blur works
- `http://localhost:3000/builders` — "Defense Builders" highlighted
- `http://localhost:3000/wingman` — "Wingman" highlighted
- `http://localhost:3000/programs/the-combine` — "The Combine" highlighted
- `http://localhost:3000/knowledge` — Platform dropdown "Knowledge" highlighted
- `http://localhost:3000/opportunities` — Platform dropdown "Opportunities" highlighted
- `http://localhost:3000/status` — Platform dropdown "Status" highlighted
- `http://localhost:3000/about` — standard nav, no legacy links
- `http://localhost:3000/404` — navbar renders correctly
- Mobile: resize to 375px, verify hamburger menu, dropdown, staggered animations

**Step 3: Check responsive breakpoints**

At 1920px, 1024px, 768px, 375px — no layout regressions.

**Step 4: Verify no console errors on any page**

**Step 5: Update RTMX**

Update `.rtmx/database.csv`: REQ-UX-008 status=COMPLETE, completed_date=2026-02-14
Update `.rtmx/requirements/UX/REQ-UX-008.md` with sitrep.
Update `.rtmx/STATUS.md`.

**Step 6: Tag and commit**

```bash
git tag -a v0.X.0 -m "REQ-UX-008: unified navbar component"
git add -A
git commit -m "feat(REQ-UX-008): unified modular navbar — single source of truth across 28 pages"
git push && git push --tags
```

---

## Risk Notes

- **Style-guide.html and programs/the-combine-old.html** are not in the Vite build inputs. They can be converted later or left as-is (they're dev/legacy files).
- **Opportunities React SPA** keeps its own Layout.tsx navbar. Future work could consume navbar.js via a thin React wrapper, but that's separate scope.
- **Body scroll lock** (`document.body.style.overflow = 'hidden'`) is added for mobile menu — the current script.js doesn't do this. This is an improvement.
- **Dropdown items add Opportunities** — current main site nav doesn't list it under Platform. The React Layout.tsx does. This plan adds it for consistency.
