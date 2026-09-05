/**
 * Anymouse adoption / attention layer.
 *
 * Config-gated mechanics that draw attention to the widget to drive usage:
 *   1. First-visit coachmark + pulse (with a re-pulse if seen-but-never-used).
 *   2. Idle nudge (one bubble after a stretch of inactivity).
 *   3. Contextual hints (host-configured, per-URL-pattern, one-time).
 *   4. Post-save affirmation + weekly streak.
 *
 * All localStorage access is wrapped in try/catch (private-mode safe). Bubbles
 * reuse ONE small `.anymouse-coachmark` element and never steal focus. Document
 * listeners are routed through the host's addDocListener so destroy() cleans
 * them. Reduced motion disables the pulse animation (bubbles still show).
 */

// localStorage keys (documented in README).
const LS = {
  SEEN: 'anymouse-seen',     // '1' once the user has opened the panel
  VISITS: 'anymouse-visits', // integer, incremented once per init()
  USED: 'anymouse-used',     // '1' once a note has been saved
  STREAK: 'anymouse-streak', // JSON { weekKey, count }
  HINT: 'anymouse-hint-',    // prefix; per-match-pattern shown flag
  REPULSED: 'anymouse-repulsed' // '1' once the one-off re-pulse has fired
};

// sessionStorage key for the once-per-session idle nudge.
const SS_IDLE = 'anymouse-idle-shown';

const PULSE_CLASS = 'anymouse-attention';
// First-visit coachmark: NO auto-dismiss (stays until the user acts). The pulse
// runs for a bounded window so it doesn't pulse forever.
const COACHMARK_PULSE_MS = 6000;
// Idle / contextual bubbles: longer auto-dismiss so they're readable.
const IDLE_BUBBLE_MS = 14000;
const HINT_BUBBLE_MS = 14000;

// ---- localStorage / sessionStorage helpers (private-mode safe) ----
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}
function ssGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function ssSet(key, val) {
  try { sessionStorage.setItem(key, val); } catch { /* noop */ }
}

// Approximate week index (days since Jan 1 / 7), not ISO week. Stable + DST-safe; only used to bucket the streak counter.
function currentWeekKey(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));
  return `${d.getFullYear()}-W${week}`;
}

/**
 * Create the adoption controller.
 *
 * @param {object} ctx
 * @param {object}   ctx.cfg                merged config (reads cfg.adoption)
 * @param {Function} ctx.getRoot           () => root element
 * @param {Function} ctx.getButton         () => button element
 * @param {Function} ctx.isPanelOpen       () => boolean
 * @param {Function} ctx.addDocListener    (target,type,handler,opts) — routed for destroy()
 * @param {boolean}  ctx.prefersReducedMotion
 */
export function createAdoption(ctx) {
  const { cfg, getRoot, getButton, isPanelOpen, addDocListener, prefersReducedMotion } = ctx;
  const adoption = (cfg && cfg.adoption) || {};

  let bubbleEl = null;
  let bubbleTimer = null;
  let idleTimer = null;
  let pulseTimer = null;
  let destroyed = false;

  // ---- Pulse (single owner) ----
  // Exactly one pulse timer ever exists. startPulse() cancels any prior pulse
  // before arming a new one, so the re-pulse branch, idle nudge, and coachmark
  // can never stack timers or leave a dangling stop. dismissBubble(),
  // onPanelOpen(), and destroy() all route through stopPulse().
  function startPulse(durationMs) {
    clearTimeout(pulseTimer);
    pulseTimer = null;
    if (prefersReducedMotion) return; // CSS also disables the animation
    getButton()?.classList.add(PULSE_CLASS);
    if (durationMs > 0) {
      pulseTimer = setTimeout(stopPulse, durationMs);
    }
  }
  function stopPulse() {
    clearTimeout(pulseTimer);
    pulseTimer = null;
    getButton()?.classList.remove(PULSE_CLASS);
  }

  // ---- Bubble (shared coachmark / idle / contextual UI) ----
  function dismissBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
    // Dismissing the bubble also tears down any active pulse — single owner.
    stopPulse();
    if (bubbleEl) {
      bubbleEl.classList.remove('is-visible');
      const el = bubbleEl;
      bubbleEl = null;
      // Allow the fade-out transition to play before removing.
      setTimeout(() => { el.remove(); }, prefersReducedMotion ? 0 : 220);
    }
  }

  /**
   * Show the shared bubble near the button. Does not steal focus.
   * @param {string} text
   * @param {number} autoDismissMs auto-dismiss timeout (0 = no auto-dismiss)
   */
  function showBubble(text, autoDismissMs) {
    const root = getRoot();
    if (!root || destroyed) return;
    dismissBubble();

    const el = document.createElement('div');
    el.className = 'anymouse-coachmark';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    const span = document.createElement('span');
    span.className = 'anymouse-coachmark-text';
    span.textContent = text;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'anymouse-coachmark-dismiss';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissBubble();
    });

    el.appendChild(span);
    el.appendChild(close);
    root.appendChild(el);
    bubbleEl = el;

    // Fade in on next frame so the transition runs.
    requestAnimationFrame(() => { el.classList.add('is-visible'); });

    if (autoDismissMs > 0) {
      bubbleTimer = setTimeout(dismissBubble, autoDismissMs);
    }
  }

  // ---- 1. Coachmark + pulse (first visit) + re-pulse ----
  function maybeCoachmark() {
    const cm = adoption.coachmark || {};

    // Increment the visit counter once per init().
    const visits = (parseInt(lsGet(LS.VISITS), 10) || 0) + 1;
    lsSet(LS.VISITS, String(visits));

    const seen = lsGet(LS.SEEN) === '1';

    if (!seen && cm.enabled) {
      // First visit: pulse + teach. The teaching coachmark does NOT auto-dismiss
      // (autoDismiss 0) — a new user needs time to read it; it stays until they
      // dismiss it (×), click the icon, or open the panel (onPanelOpen). The
      // pulse self-stops after a bounded window. showBubble() first (its reset
      // calls dismissBubble→stopPulse), THEN startPulse arms the pulse.
      showBubble(cm.text, 0);
      startPulse(COACHMARK_PULSE_MS);
      return;
    }

    // Re-pulse: seen but never USED, enough visits, and not already re-pulsed.
    const used = lsGet(LS.USED) === '1';
    const rePulseAfter = cm.rePulseAfterVisits;
    const alreadyRePulsed = lsGet(LS.REPULSED) === '1';
    if (
      cm.enabled &&
      seen && !used && !alreadyRePulsed &&
      typeof rePulseAfter === 'number' && rePulseAfter > 0 &&
      visits >= rePulseAfter
    ) {
      lsSet(LS.REPULSED, '1'); // at most once
      // No coachmark text — just a one-off pulse that stops itself.
      startPulse(COACHMARK_PULSE_MS);
    }
  }

  // ---- 2. Idle nudge ----
  function setupIdleNudge() {
    const nudge = adoption.idleNudge || {};
    if (!nudge.enabled) return;
    const idleMs = typeof nudge.idleMs === 'number' && nudge.idleMs > 0 ? nudge.idleMs : 90000;

    // M3 (approach b): once a once-per-session nudge has fired, idleDone makes
    // reset() a true no-op for the rest of the session. Lowest-risk option —
    // listeners stay attached (still owned by host addDocListener → destroy()),
    // but the activity handler returns immediately instead of re-arming.
    let idleDone = false;

    function fire() {
      if (destroyed) return;
      if (isPanelOpen()) return;
      if (nudge.oncePerSession && ssGet(SS_IDLE) === '1') return;
      ssSet(SS_IDLE, '1');
      if (nudge.oncePerSession) idleDone = true;
      // showBubble first (its reset stops any prior pulse), then arm the pulse.
      // The bubble lingers (IDLE_BUBBLE_MS) but the pulse is a brief attention
      // grab, so it stops sooner.
      showBubble(nudge.text, IDLE_BUBBLE_MS);
      startPulse(COACHMARK_PULSE_MS);
    }

    function reset() {
      if (idleDone) return;
      clearTimeout(idleTimer);
      // No point arming if it's a once-per-session nudge already shown.
      if (nudge.oncePerSession && ssGet(SS_IDLE) === '1') { idleDone = true; return; }
      idleTimer = setTimeout(fire, idleMs);
    }

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(type => {
      addDocListener(document, type, reset, { passive: true });
    });
    reset();
  }

  // ---- 3. Contextual hints ----
  function maybeContextualHint() {
    const hints = Array.isArray(adoption.contextualHints) ? adoption.contextualHints : [];
    if (hints.length === 0) return;
    const path = (typeof location !== 'undefined' && location.pathname) || '';

    const hit = hints.find(h =>
      h && typeof h.match === 'string' && h.match.length > 0 &&
      typeof h.text === 'string' && h.text.length > 0 &&
      path.includes(h.match) &&
      lsGet(LS.HINT + h.match) !== '1'
    );
    if (!hit) return;
    lsSet(LS.HINT + hit.match, '1');
    showBubble(hit.text, HINT_BUBBLE_MS);
    startPulse(COACHMARK_PULSE_MS);
  }

  // ---- 4. Post-save affirmation + streak ----
  function bumpStreak() {
    const weekKey = currentWeekKey();
    let count = 1;
    const raw = lsGet(LS.STREAK);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.weekKey === weekKey && typeof parsed.count === 'number') {
          count = parsed.count + 1;
        }
      } catch { /* corrupt — reset to 1 */ }
    }
    lsSet(LS.STREAK, JSON.stringify({ weekKey, count }));
    return count;
  }

  /**
   * Called by the host after a successful save. Sets the "used" flag (feeds
   * re-pulse logic), bumps the weekly streak, and shows a brief affirmation in
   * the status line. Non-blocking and best-effort.
   */
  function onSaved() {
    lsSet(LS.USED, '1');
    const ps = adoption.postSave || {};
    if (!ps.enabled) return;

    const status = document.getElementById('anymouse-capture-status');
    if (!status) return;
    if (ps.streak) {
      const n = bumpStreak();
      status.textContent = `Saved · ${n} this week`;
    } else {
      status.textContent = 'Saved ✓';
    }
  }

  // ---- Lifecycle hooks ----
  // Called by the host when the panel opens: first interaction marks seen,
  // stops the pulse, and dismisses any active bubble.
  function onPanelOpen() {
    lsSet(LS.SEEN, '1');
    stopPulse();
    dismissBubble();
  }

  // Manual trigger (Anymouse.showCoachmark()) — forces the coachmark + pulse.
  function showCoachmark() {
    const cm = adoption.coachmark || {};
    const text = cm.text || 'Quick-capture anything — double-tap Shift or click me.';
    // Manual coachmark mirrors the first-visit one: no auto-dismiss, bounded pulse.
    showBubble(text, 0);
    startPulse(COACHMARK_PULSE_MS);
  }

  function init() {
    if (!adoption.enabled) return;
    maybeCoachmark();
    maybeContextualHint();
    setupIdleNudge();
  }

  function destroy() {
    destroyed = true;
    clearTimeout(bubbleTimer);
    clearTimeout(idleTimer);
    stopPulse(); // clears pulseTimer + removes the class (single owner)
    if (bubbleEl) { bubbleEl.remove(); bubbleEl = null; }
    // Document listeners (idle) are owned by the host's addDocListener and torn
    // down in the host's destroy().
  }

  return { init, onSaved, onPanelOpen, showCoachmark, destroy };
}
