/**
 * Anymouse — embeddable quick-capture widget. Config-driven; mounts a single
 * floating capture HUD via Anymouse.init(config). See README for the config API.
 */

// `?raw` makes Vite hand us the stylesheet as a string (injected at runtime
// below), the same way esbuild's text loader did in the original package.
import styles from './styles.css?raw';
import { getAnymouseSvg } from './icon.js';
import { mergeConfig } from './config.js';
import { createKeydownHandler } from './hotkeys.js';
import { createDrag, STORAGE_KEYS, PREFERS_REDUCED_MOTION } from './drag.js';
import { createAdoption } from './adoption.js';

(function () {
  'use strict';

  const STYLE_ID = 'anymouse-styles';
  const ROOT_ID = 'anymouse-root';

  // ---- Module state (per page; single instance) ----
  let cfg = null;
  let root = null;
  let mounted = false;
  let captureCloseTimer = null;
  let drag = null;            // drag controller (created on mount)
  let adoption = null;        // adoption / attention controller (created on mount)
  let scrollTimeoutId = null;
  let positionQuery = null;   // MediaQueryList for cfg.position.mobileMaxWidth
  let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const docListeners = [];   // {target, type, handler} for destroy()

  const SCROLL_HIDE_THRESHOLD = 200;
  const SCROLL_RESET_DELAY = 2000;

  const state = {
    user: null,
    activeCategory: 'note',
    skipNextClick: false,
    isDragging: false
  };

  // ---- Small helpers ----
  function getButton() { return document.getElementById('anymouse-button'); }
  function getPanel() { return document.getElementById('anymouse-panel'); }
  function getInput() { return document.getElementById('anymouse-capture-input'); }
  function getStatus() { return document.getElementById('anymouse-capture-status'); }
  function isPanelOpen() { return getPanel()?.classList.contains('open') || false; }

  function userEmail() {
    return state.user && state.user.email ? state.user.email : null;
  }

  // Human-readable title per category, e.g. "New Observation" / "Quick Note".
  function categoryTitle(id) {
    if (id === 'note') return 'Quick Note';
    const c = cfg.categories.find(x => x.id === id);
    const label = c ? c.label : id;
    return `New ${label}`;
  }

  // True when the event target is a text-editable element, so single-key
  // shortcuts (e.g. 'a') don't hijack normal typing.
  function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true;
  }

  // Path-pattern suppression: substring match on location.pathname, plus an
  // exact-match for '/' so the homepage can be suppressed without matching
  // every path.
  function isSuppressed() {
    const path = (typeof location !== 'undefined' && location.pathname) || '';
    return (cfg.suppressOn || []).some(pattern => {
      if (pattern === '/') return path === '/' || path === '';
      return path.includes(pattern);
    });
  }

  // Track document/window listeners so destroy() can remove them.
  function addDocListener(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    docListeners.push({ target, type, handler });
  }

  // ---- Style injection ----
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = styles;
    document.head.appendChild(el);
  }

  // ---- DOM construction ----
  function createUI() {
    const container = document.createElement('div');
    container.className = 'anymouse-root';
    container.id = ROOT_ID;

    // TRUSTED HTML: category.icon is raw SVG from config (trusted integrator input), injected as-is.
    const tiles = cfg.categories.map(c => `
                        <button class="anymouse-tile" data-category="${c.id}" data-accent="${c.accent || ''}" type="button" aria-pressed="false">
                            <span class="anymouse-tile-icon">${c.icon || ''}</span>
                            <span class="anymouse-tile-label">${c.label}</span>
                        </button>`).join('');

    container.innerHTML = `
            <button class="anymouse-button" id="anymouse-button" title="Anymouse — quick capture (double-tap Shift)" aria-label="Anymouse — quick capture" aria-haspopup="true" aria-expanded="false" aria-controls="anymouse-panel">
                ${getAnymouseSvg()}
            </button>

            <div class="anymouse-panel" id="anymouse-panel" role="group" aria-label="Quick capture">
                <div class="anymouse-grid">
                    ${tiles}
                </div>

                <div class="anymouse-capture" id="anymouse-capture">
                    <textarea class="anymouse-capture-input" id="anymouse-capture-input" placeholder="Jot a note…" maxlength="10000" rows="2"></textarea>
                    <button class="anymouse-capture-save" id="anymouse-capture-save" type="button">Save</button>
                </div>
                <div class="anymouse-capture-status" id="anymouse-capture-status" role="status" aria-live="polite"></div>

                ${hasViewAll() ? '<button class="anymouse-viewall" id="anymouse-viewall" type="button">View all notes →</button>' : ''}
            </div>
        `;

    document.body.appendChild(container);
    root = container;
  }

  // ---- Icon state ----
  // Toggles the 'is-engaged' icon state (popover open). Any other value returns
  // to rest. 'is-dragging' is managed directly by the drag handlers.
  function setIconState(stateName) {
    root?.classList.toggle('is-engaged', stateName === 'is-engaged');
  }

  function setNotification(on) {
    getButton()?.classList.toggle('has-notification', !!on);
  }

  // ---- Minimize ----
  function isMinimized() {
    return root?.classList.contains('anymouse-minimized') || false;
  }

  function setMinimized(minimized) {
    const button = getButton();
    if (!root || !button) return;
    root.classList.toggle('anymouse-minimized', minimized);
    button.setAttribute('title', minimized
      ? 'Expand Anymouse (double-tap Shift)'
      : 'Anymouse — quick capture (double-tap Shift)');
    try { localStorage.setItem(STORAGE_KEYS.MINIMIZED, minimized ? 'true' : 'false'); } catch { /* noop */ }
  }

  // ---- Scroll hide ----
  function handleScroll() {
    const button = getButton();
    if (!button || state.isDragging) return;

    // Re-anchor: a sticky navbar can change height on scroll (e.g. a .scrolled
    // class). applyAnchor no-ops unless the measured offset actually changed.
    applyAnchor();

    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > SCROLL_HIDE_THRESHOLD) {
      button.classList.add('hidden-scroll');
    } else {
      button.classList.remove('hidden-scroll');
    }

    lastScrollY = currentScrollY;
    clearTimeout(scrollTimeoutId);
    scrollTimeoutId = setTimeout(() => {
      button.classList.remove('hidden-scroll');
    }, SCROLL_RESET_DELAY);
  }

  // ---- Stored prefs (minimize + position) ----
  function applyStoredPreferences() {
    let storedMinimized;
    try { storedMinimized = localStorage.getItem(STORAGE_KEYS.MINIMIZED); } catch { storedMinimized = null; }
    if (storedMinimized === 'true') setMinimized(true);
    drag?.applyStoredPosition();
  }

  // True when the user has dragged + saved a position (which overrides the
  // default anchor — we must not fight it).
  function hasStoredPosition() {
    try { return !!localStorage.getItem(STORAGE_KEYS.POSITION); } catch { return false; }
  }

  // Position the widget below a configured anchor element (e.g. the navbar):
  // sets --anymouse-top = anchor.bottom + gap so the default upper-right CSS
  // resolves correctly across breakpoints. No-op if the user has a dragged
  // position, or the selector doesn't resolve (CSS fallback top applies).
  let lastAnchorTop = null;
  function applyAnchor() {
    if (!root || hasStoredPosition()) return;
    // Bottom corners are pinned to the bottom edge; the anchor is meaningless.
    if (isBottomCorner()) return;
    const sel = cfg.anchor && cfg.anchor.selector;
    if (!sel) return;
    const el = document.querySelector(sel);
    if (!el) return;
    const gap = (cfg.anchor && typeof cfg.anchor.gap === 'number') ? cfg.anchor.gap : 50;
    const top = Math.max(0, Math.round(el.getBoundingClientRect().bottom + gap));
    // Only write when it actually changed — cheap enough to call from scroll
    // (the navbar shrinks ~8px once it gains the .scrolled class).
    if (top === lastAnchorTop) return;
    lastAnchorTop = top;
    root.style.setProperty('--anymouse-top', top + 'px');
  }

  // ---- Corner placement (cfg.position) ----
  // The active corner is `position.mobile` while the viewport is at most
  // `position.mobileMaxWidth` wide, else `position.default`.
  function activeCorner() {
    const p = cfg.position;
    return positionQuery && positionQuery.matches ? p.mobile : p.default;
  }

  function isBottomCorner() {
    return activeCorner().startsWith('bottom');
  }

  // Tag the root with data-anymouse-v ("top"/"bottom") and data-anymouse-h
  // ("left"/"right"); styles.css keys the placement, the coachmark side and the
  // scroll-duck off these. Re-run when the mobile media query flips. A
  // drag-persisted position writes inline top/left and still wins.
  function applyPosition() {
    if (!root) return;
    const [v, h] = activeCorner().split('-');
    root.dataset.anymouseV = v;
    root.dataset.anymouseH = h;
    // The anchor only applies to top corners — force a re-measure.
    lastAnchorTop = null;
    applyAnchor();
    if (isPanelOpen()) requestAnimationFrame(positionPanel);
  }

  // ---- Panel open/close ----
  function openPanel() {
    clearTimeout(captureCloseTimer);
    const el = getPanel();
    if (!el) return;
    el.classList.add('open');
    setActiveCategory(cfg.defaultCategory);   // tiles let the user re-classify
    const status = getStatus();
    if (status) status.textContent = '';
    setIconState('is-engaged');
    setNotification(false);
    // First interaction: mark seen, stop the pulse, dismiss any active bubble.
    adoption?.onPanelOpen();
    requestAnimationFrame(positionPanel);
    getButton()?.setAttribute('aria-expanded', 'true');
    // "Just start typing" — focus the prompt bar immediately on open.
    requestAnimationFrame(() => { getInput()?.focus(); });
  }

  // Closing the popover returns the icon to its resting (breathing) state.
  function closePanel() {
    clearTimeout(captureCloseTimer);
    const el = getPanel();
    const wasOpen = el?.classList.contains('open');
    el?.classList.remove('open');
    setIconState('is-resting');
    const btn = getButton();
    btn?.setAttribute('aria-expanded', 'false');
    if (wasOpen) btn?.focus();
  }

  function togglePanel() {
    if (isPanelOpen()) closePanel(); else openPanel();
  }

  function positionPanel() {
    const menu = getPanel();
    if (!menu || !root) return;
    menu.classList.remove('anymouse-panel-below', 'anymouse-panel-right');
    const r = root.getBoundingClientRect();
    if (r.top < menu.offsetHeight + 24 && (window.innerHeight - r.bottom) > r.top) {
      menu.classList.add('anymouse-panel-below');
    }
    if ((window.innerWidth - r.left) < menu.offsetWidth + 24 && r.right > menu.offsetWidth) {
      menu.classList.add('anymouse-panel-right');
    }
  }

  /**
   * Set the active capture category. Highlights the matching tile and updates
   * the prompt-bar placeholder. Keeps focus in the prompt bar so the user can
   * just keep typing.
   */
  function setActiveCategory(category) {
    state.activeCategory = category;
    document.querySelectorAll('.anymouse-tile').forEach(tile => {
      const isActive = tile.dataset.category === category;
      tile.classList.toggle('is-active', isActive);
      tile.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    const input = getInput();
    if (input) {
      input.placeholder = category === 'note' ? 'Jot a note…' : `Capture ${category}…`;
    }
  }

  // ---- Persistence ----
  // Built-in HTTP default. Preserves the exact SigmaBlox payload shape.
  async function defaultSave(note) {
    // Only send x-member-email when a real email exists — never coerce a null
    // email into the literal string "null".
    const headers = { 'Content-Type': 'application/json' };
    const email = userEmail();
    if (email) headers['x-member-email'] = email;

    const response = await fetch(`${cfg.apiBase}/api/member/notes`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        action: 'add',
        targetType: 'company',
        targetId: 'quick-note',
        content: note.content,
        title: categoryTitle(note.category),
        tags: note.tags,
        pinned: false
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save note');
    }
    return data;
  }

  /**
   * Save the inline-capture note. Builds the config-shaped note payload, then
   * persists via cfg.save (if provided) or the built-in defaultSave.
   */
  // Authenticated = a resolved user with an email (the unit save needs).
  function isAuthed() {
    return !!(state.user && state.user.email);
  }

  // Build the sign-in URL. Precedence: cfg.signInUrl > apiBase SSO default.
  // returnTo brings the user back to the current page after auth.
  function signInUrl() {
    if (cfg.signInUrl) return cfg.signInUrl;
    if (!cfg.apiBase) return null;
    const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
    return `${cfg.apiBase}/auth/sso/start?provider=authentik&returnTo=${returnTo}`;
  }

  // Logged-out Save: prompt to sign in instead of persisting (no data lost
  // silently). Renders an inline message + a sign-in action in the status line.
  function promptSignIn() {
    const status = getStatus();
    if (!status) return;
    if (typeof cfg.onSignIn === 'function') {
      status.textContent = 'Sign in to save your notes.';
      cfg.onSignIn();
      return;
    }
    const url = signInUrl();
    // Build the whole subtree off-DOM and swap it in with a single replaceChildren
    // so the aria-live region announces one coherent message (not two mutations).
    const frag = document.createDocumentFragment();
    const msg = document.createElement('span');
    msg.textContent = 'Sign in to save your notes. ';
    frag.appendChild(msg);
    if (url) {
      const link = document.createElement('a');
      link.className = 'anymouse-signin-link';
      link.href = url;
      link.textContent = 'Sign in →';
      frag.appendChild(link);
    }
    status.replaceChildren(frag);
  }

  async function saveCapture() {
    const saveBtn = document.getElementById('anymouse-capture-save');
    if (saveBtn?.disabled) return;

    const input = getInput();
    const status = getStatus();
    const content = (input?.value || '').trim();

    if (!content) {
      if (status) status.textContent = 'Please write something';
      return;
    }

    // Capability gate: logged-out users can type but not persist — prompt sign-in.
    if (!isAuthed()) {
      promptSignIn();
      return;
    }

    const category = state.activeCategory;
    const context = cfg.captureContext
      ? {
          url: location.href,
          title: document.title,
          selection: String((window.getSelection && window.getSelection()) || '')
        }
      : null;

    const note = {
      content,
      category,
      tags: [category],
      context,
      createdAt: new Date().toISOString()
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
    }

    try {
      if (typeof cfg.save === 'function') {
        await cfg.save(note);
      } else {
        await defaultSave(note);
      }

      if (status) status.textContent = 'Saved ✓';
      if (input) input.value = '';
      // Adoption: affirmation + weekly streak (may augment the status line) and
      // sets the "used" flag that feeds re-pulse logic. Non-blocking.
      // onSaved() intentionally replaces the 'Saved ✓' text with the streak affirmation when postSave is enabled.
      adoption?.onSaved();
      captureCloseTimer = setTimeout(() => closePanel(), 900);
    } catch (error) {
      console.error('[Anymouse] Error saving note:', error);
      if (status) status.textContent = "Couldn't save — try again";
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    }
  }

  // True when the viewall button has somewhere to go: an onViewAll callback or a
  // non-empty viewAllUrl. When false the button is hidden (no dead link).
  function hasViewAll() {
    return typeof cfg.onViewAll === 'function' || !!cfg.viewAllUrl;
  }

  // viewall: precedence is onViewAll callback > viewAllUrl navigation.
  function viewAllNotes() {
    if (typeof cfg.onViewAll === 'function') {
      cfg.onViewAll();
    } else if (cfg.viewAllUrl) {
      window.location.href = cfg.viewAllUrl;
    }
  }

  // Open the panel (or refocus its input if already open).
  function launchAnymouse() {
    if (isMinimized()) setMinimized(false);
    if (!isPanelOpen()) {
      openPanel();
    } else {
      getInput()?.focus();
    }
  }

  // ---- Event wiring ----
  function setupEventListeners() {
    const button = getButton();
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.skipNextClick) return;
      togglePanel();
    });

    // Drag handlers (pointer move/up live on document so dragging continues
    // outside the button; tracked for destroy()).
    button.addEventListener('pointerdown', drag.startPointerDrag);
    addDocListener(document, 'pointermove', drag.onPointerMove);
    addDocListener(document, 'pointerup', drag.stopPointerDrag);
    addDocListener(document, 'pointercancel', drag.stopPointerDrag);

    // Quick-classify tiles set the active category and keep focus in the prompt
    // bar so the user can keep typing.
    document.querySelectorAll('.anymouse-tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveCategory(tile.dataset.category);
        getInput()?.focus();
      });
    });

    document.getElementById('anymouse-viewall')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
      viewAllNotes();
    });

    // Prompt-bar controls
    document.getElementById('anymouse-capture-save')?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveCapture();
    });
    // Enter saves, Shift+Enter inserts a newline
    getInput()?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveCapture();
      }
    });

    // Close popover when clicking outside
    addDocListener(document, 'click', (e) => {
      if (root && !root.contains(e.target)) closePanel();
    });

    // Keyboard launchers (double-tap Shift + single key; Escape closes).
    const onKeydown = createKeydownHandler({
      cfg,
      launch: launchAnymouse,
      close: closePanel,
      isPanelOpen,
      getRoot: () => root,
      isEditableTarget
    });
    addDocListener(document, 'keydown', onKeydown);

    // Scroll-hide + keep-in-viewport on resize.
    addDocListener(window, 'scroll', handleScroll, { passive: true });
    addDocListener(window, 'resize', () => {
      applyAnchor();
      drag?.ensureInViewport();
      if (isPanelOpen()) requestAnimationFrame(positionPanel);
    });
  }

  // ---- Public init ----
  async function init(userConfig) {
    // Idempotent: the module is a singleton. A second init() while already
    // mounted would append a duplicate #anymouse-root and double-bind every
    // document listener (leak). Bail early — destroy() resets `mounted` so a
    // later init() can remount cleanly.
    if (mounted) return Anymouse;

    cfg = mergeConfig(userConfig);
    state.activeCategory = cfg.defaultCategory;

    // Suppression (e.g. homepage) — don't mount.
    if (isSuppressed()) return Anymouse;

    injectStyles();
    createUI();

    // Resolve the user for capability gating WITHOUT blocking the mount. Anymouse
    // mounts for EVERYONE immediately (auth gates *saving*, not *visibility*), so
    // a slow auth call must never delay the icon appearing. getUser resolves in
    // the background; saveCapture re-checks isAuthed() live at save time, so the
    // widget is fully usable the instant it renders — a save attempted before
    // auth lands simply shows the sign-in prompt.
    state.user = null;
    const getUser = typeof cfg.getUser === 'function' ? cfg.getUser : async () => null;
    Promise.resolve()
      .then(getUser)
      .then((u) => { state.user = u || null; })
      .catch((err) => { console.error('[Anymouse] getUser failed:', err); state.user = null; });

    drag = createDrag({
      getRoot: () => root,
      getButton,
      state,
      onPositionChange: () => { if (isPanelOpen()) requestAnimationFrame(positionPanel); }
    });

    setupEventListeners();
    applyStoredPreferences();

    // Corner placement, re-evaluated when the viewport crosses the mobile
    // breakpoint. Routed through addDocListener so destroy() unhooks it.
    positionQuery = window.matchMedia
      ? window.matchMedia(`(max-width: ${cfg.position.mobileMaxWidth}px)`)
      : null;
    if (positionQuery) addDocListener(positionQuery, 'change', applyPosition);
    applyPosition();

    // Adoption / attention layer. Document listeners (idle) are routed through
    // the SAME addDocListener so destroy() cleans them.
    adoption = createAdoption({
      cfg,
      getRoot: () => root,
      getButton,
      isPanelOpen,
      addDocListener,
      prefersReducedMotion: PREFERS_REDUCED_MOTION
    });
    adoption.init();

    mounted = true;

    return Anymouse;
  }

  // ---- Controller / public global ----
  function destroy() {
    docListeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    docListeners.length = 0;
    clearTimeout(captureCloseTimer);
    clearTimeout(scrollTimeoutId);
    adoption?.destroy();
    root?.remove();
    document.getElementById(STYLE_ID)?.remove();
    root = null;
    drag = null;
    adoption = null;
    positionQuery = null;
    mounted = false;
  }

  const Anymouse = {
    init,
    open: openPanel,
    close: closePanel,
    setCategory: setActiveCategory,
    setNotification,
    minimize: () => setMinimized(true),
    expand: () => setMinimized(false),
    // Manually trigger the coachmark + pulse (handy for hosts / testing).
    showCoachmark: () => adoption?.showCoachmark(),
    resetPosition: () => { drag?.resetPosition(); applyAnchor(); },
    // Programmatic capture: set text + category, then save.
    capture(text, category) {
      if (!mounted) return;
      if (category) setActiveCategory(category);
      const input = getInput();
      if (input) input.value = text == null ? '' : String(text);
      return saveCapture();
    },
    destroy,
    isMounted() { return mounted; }
  };

  if (typeof window !== 'undefined') window.Anymouse = Anymouse;
})();
