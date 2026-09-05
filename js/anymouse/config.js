/**
 * Anymouse configuration: DEFAULTS + mergeConfig(user).
 */

export const DEFAULTS = {
  // ---- LIVE keys (consumed by the module) ----

  // Persistence (overridable callbacks)
  apiBase: '',
  save: null,        // (note) => Promise — overrides the built-in HTTP default
  getUser: null,     // () => Promise<{email}|null> — null means "not logged in"

  // "View all" target. Navigate to viewAllUrl on click (default keeps SigmaBlox
  // parity). If onViewAll is a function it takes precedence (host handles it
  // in-app). If both are falsy the viewall button is hidden entirely.
  viewAllUrl: '/my-notes/',
  onViewAll: null,

  // Sign-in target for logged-out users. The widget mounts for everyone; on
  // Save, a logged-out user is prompted to sign in. Precedence: onSignIn
  // callback (host handles it) > signInUrl > built-in apiBase SSO default
  // (`${apiBase}/auth/sso/start?provider=authentik&returnTo=<current path>`).
  signInUrl: null,
  onSignIn: null,

  // Default placement anchor. The widget sits upper-right; `anchor.selector` (if
  // it resolves an element, e.g. a sticky navbar) sets the top offset to that
  // element's bottom + `anchor.gap`, recomputed on resize. If selector is null
  // or unresolved, the CSS fallback top (--anymouse-top default) is used.
  // Drag-persisted position overrides this entirely.
  anchor: { selector: null, gap: 50 },

  // Which corner the widget parks in: 'top-right' | 'top-left' |
  // 'bottom-right' | 'bottom-left'. A string applies everywhere. An object
  // gives a desktop corner (`default`) and a phone corner (`mobile`, null =
  // same as default), switched by a `(max-width: mobileMaxWidth px)` media
  // query — so a phone can park it bottom-right, clear of a full-width hero,
  // while desktop keeps it under the navbar. `anchor` only applies to top-*
  // corners. Drag-persisted position overrides this entirely.
  position: { default: 'top-right', mobile: null, mobileMaxWidth: 768 },

  // Classification
  categories: [
    { id: 'observation', label: 'Observation', accent: 'blue',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>' },
    { id: 'blocker', label: 'Blocker', accent: 'red',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
    { id: 'idea', label: 'Idea', accent: 'green',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>' },
    { id: 'note', label: 'Note', accent: 'purple',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' }
  ],
  defaultCategory: 'note',

  // Behavior
  hotkeys: { doubleShift: true, singleKey: 'a' },
  suppressOn: [],          // path patterns; if any matches location.pathname, don't mount

  // Context capture (attach {url,title,selection} to the note)
  captureContext: false,

  // Adoption / attention layer — config-gated mechanics that draw attention to
  // the widget to drive usage. Default posture is "dialed up". Deep-merged so a
  // host can override a single sub-key (e.g. adoption.idleNudge.idleMs) without
  // losing sibling defaults. See README "Adoption" + src/adoption.js.
  adoption: {
    enabled: true,
    coachmark: {
      enabled: true,
      text: 'Quick-capture anything — double-tap Shift or click me.',
      rePulseAfterVisits: 3
    },
    idleNudge: {
      enabled: true,
      idleMs: 90000,
      text: 'Got a thought? Jot it here.',
      oncePerSession: true
    },
    // Host-supplied: [{ match: '/combine/', text: '…' }]. Default [].
    contextualHints: [],
    postSave: { enabled: true, streak: true }
  },

  // ---- RESERVED / not yet implemented ----
  // These keys are accepted by mergeConfig (so they pass through without an
  // "unknown key" warning) but nothing reads them today. They are no-ops.
  // Documented here so the public API is honest about what is and isn't wired.
  fetchNotes: null,        // RESERVED: not yet wired — future notes-feed feature
  modes: ['capture'],      // RESERVED: not yet wired — future 'ask' chatbot mode
  theme: null,             // RESERVED: not yet wired — { accent, surface, text, radius }
  reducedMotion: 'auto'    // RESERVED: not yet wired — drag uses its own matchMedia
};

const KNOWN_KEYS = Object.keys(DEFAULTS);

export const POSITION_CORNERS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

function isCorner(v) {
  return typeof v === 'string' && POSITION_CORNERS.includes(v);
}

/**
 * Normalize `position` (string corner or {default, mobile, mobileMaxWidth})
 * to the object form with every field valid. Invalid values warn and fall back
 * to DEFAULTS.position (an invalid `mobile` falls back to `default`).
 */
export function normalizePosition(value) {
  const base = DEFAULTS.position;
  if (typeof value === 'string') {
    if (isCorner(value)) return { default: value, mobile: value, mobileMaxWidth: base.mobileMaxWidth };
    console.warn(`[Anymouse] Invalid position "${value}"; using "${base.default}"`);
    return { default: base.default, mobile: base.default, mobileMaxWidth: base.mobileMaxWidth };
  }
  if (!isPlainObject(value) && value !== undefined && value !== null) {
    console.warn('[Anymouse] position must be a corner string or an object; using default');
  }
  const v = isPlainObject(value) ? value : {};

  let def = v.default === undefined ? base.default : v.default;
  if (!isCorner(def)) {
    console.warn(`[Anymouse] Invalid position.default "${def}"; using "${base.default}"`);
    def = base.default;
  }

  let mobile = (v.mobile === undefined || v.mobile === null) ? def : v.mobile;
  if (!isCorner(mobile)) {
    console.warn(`[Anymouse] Invalid position.mobile "${mobile}"; using "${def}"`);
    mobile = def;
  }

  let maxW = v.mobileMaxWidth === undefined ? base.mobileMaxWidth : v.mobileMaxWidth;
  if (typeof maxW !== 'number' || !Number.isFinite(maxW) || maxW < 0) {
    console.warn(`[Anymouse] Invalid position.mobileMaxWidth "${maxW}"; using ${base.mobileMaxWidth}`);
    maxW = base.mobileMaxWidth;
  }

  return { default: def, mobile, mobileMaxWidth: maxW };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Recursively merge `u` over `d` for plain-object values. Arrays and scalars
 * from `u` replace `d` wholesale (no array concat). Used for nested config
 * blocks (e.g. `adoption`) so a host can override one leaf without dropping
 * sibling defaults.
 */
function deepMerge(d, u) {
  if (!isPlainObject(d) || !isPlainObject(u)) return u === undefined ? d : u;
  const out = { ...d };
  for (const key of Object.keys(u)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    const dv = d[key];
    const uv = u[key];
    out[key] = (isPlainObject(dv) && isPlainObject(uv)) ? deepMerge(dv, uv) : uv;
  }
  return out;
}

/**
 * A category is valid if it has a non-empty string id and label.
 */
function validateCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  const ok = categories.every(c =>
    isPlainObject(c) &&
    typeof c.id === 'string' && c.id.length > 0 &&
    typeof c.label === 'string' && c.label.length > 0
  );
  return ok ? categories : null;
}

/**
 * Deep-merge user config over DEFAULTS. Warns (does not throw) on unknown
 * top-level keys. Falls back to default categories if the user's are malformed.
 */
export function mergeConfig(user) {
  const u = isPlainObject(user) ? user : {};

  for (const key of Object.keys(u)) {
    if (!KNOWN_KEYS.includes(key)) {
      console.warn(`[Anymouse] Unknown config key ignored: "${key}"`);
    }
  }

  const cfg = {};
  for (const key of KNOWN_KEYS) {
    const dv = DEFAULTS[key];
    const uv = u[key];
    if (uv === undefined) {
      cfg[key] = dv;
    } else if (key === 'adoption' && isPlainObject(dv) && isPlainObject(uv)) {
      // The adoption block is nested; deep-merge so a host can override a single
      // leaf (e.g. adoption.idleNudge.idleMs) without dropping sibling defaults.
      cfg[key] = deepMerge(dv, uv);
    } else if (isPlainObject(dv) && isPlainObject(uv)) {
      cfg[key] = { ...dv, ...uv };
    } else {
      cfg[key] = uv;
    }
  }

  // Validate adoption.contextualHints is an array (fallback []).
  if (cfg.adoption && !Array.isArray(cfg.adoption.contextualHints)) {
    if (cfg.adoption.contextualHints !== undefined) {
      console.warn('[Anymouse] adoption.contextualHints must be an array; using []');
    }
    cfg.adoption.contextualHints = [];
  }

  // Normalize apiBase: strip a trailing slash so `${apiBase}/api/...` is clean.
  if (typeof cfg.apiBase === 'string') {
    cfg.apiBase = cfg.apiBase.replace(/\/$/, '');
  }

  // Validate categories — fall back to defaults if malformed.
  const validCategories = validateCategories(cfg.categories);
  if (!validCategories) {
    if (cfg.categories !== DEFAULTS.categories) {
      console.warn('[Anymouse] Invalid categories config; using defaults');
    }
    cfg.categories = DEFAULTS.categories;
  } else {
    cfg.categories = validCategories;
  }

  // Ensure defaultCategory points at a real category.
  if (!cfg.categories.some(c => c.id === cfg.defaultCategory)) {
    cfg.defaultCategory = cfg.categories[0].id;
  }

  // Corner placement — always the object form after this point. (A string
  // from the host replaced the default object wholesale above.)
  cfg.position = normalizePosition(cfg.position);

  return cfg;
}
