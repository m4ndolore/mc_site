(() => {
  // src/styles.css
  var styles_default = '/* Anymouse widget styles \u2014 all classes namespaced `.anymouse-*`. State classes\n * (hidden-scroll, is-dragging, is-engaged, is-active, has-notification) are\n * unprefixed by design. Injected at runtime as a <style id="anymouse-styles">. */\n\n.anymouse-root {\n  position: fixed;\n  /* Default anchor: upper-right, below the navbar. `--anymouse-top` is set by\n     the module from the configured anchor (navbar bottom + gap). The fallback\n     (used only if the anchor selector doesn\'t resolve) is intentionally\n     generous to clear a tall nav. Drag persists explicit top/left which\n     override these. */\n  top: var(--anymouse-top, 120px);\n  right: 24px;\n  z-index: 9999;\n  font-family: Arial, sans-serif;\n}\n\n.anymouse-button {\n  width: 80px;\n  height: 80px;\n  border-radius: 50%;\n  background: transparent;\n  border: none;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n  cursor: pointer;\n  transition: all 0.3s ease;\n  padding: 0;\n  overflow: visible;\n  position: relative;\n}\n\n.anymouse-button.hidden-scroll {\n  transform: scale(0.7) translateY(80px);\n  opacity: 0.25;\n  pointer-events: auto;\n}\n\n.anymouse-button.is-dragging {\n  cursor: grabbing;\n  opacity: 0.85;\n  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);\n}\n\n.anymouse-root.anymouse-minimized .anymouse-button {\n  width: 46px;\n  height: 46px;\n  opacity: 0.7;\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);\n}\n\n.anymouse-root.anymouse-minimized .anymouse-button:hover {\n  transform: scale(1) rotate(0);\n}\n\n.anymouse-button:hover {\n  transform: translateY(-3px);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);\n}\n.anymouse-button:hover .anymouse-icon {\n  animation: anymouse-wiggle 0.5s ease-in-out;\n}\n@keyframes anymouse-wiggle {\n  0%   { transform: rotate(0deg); }\n  25%  { transform: rotate(-4deg); }\n  60%  { transform: rotate(4deg); }\n  80%  { transform: rotate(-2deg); }\n  100% { transform: rotate(0deg); }\n}\n.anymouse-button:hover .anymouse-ear { transform: translateY(-2px); }\n.anymouse-ear { transition: transform 0.2s ease; }\n\n.anymouse-button:active {\n  transform: scale(0.95);\n}\n\n.anymouse-root {\n  --anymouse-red: #ef4444;\n  --anymouse-green: #22c55e;\n  --anymouse-purple: #6366f1;\n}\n\n/* Idle breathing \u2014 resting state only */\n.anymouse-body {\n  transform-box: fill-box;\n  transform-origin: center;\n  animation: anymouse-breathe 4s ease-in-out infinite;\n}\n@keyframes anymouse-breathe {\n  0%, 100% { transform: scale(1); }\n  50%      { transform: scale(1.025); }\n}\n\n/* Pause breathing whenever not at rest. NOTE: this group must stay AFTER the .anymouse-body animation declaration so it wins on source order. */\n.anymouse-button:hover .anymouse-body,\n.anymouse-button.is-dragging .anymouse-body,\n.anymouse-button.hidden-scroll .anymouse-body,\n.anymouse-root.is-engaged .anymouse-body,\n.anymouse-root.anymouse-minimized .anymouse-body {\n  animation-play-state: paused;\n}\n\n.anymouse-button .anymouse-icon {\n  width: 100%;\n  height: 100%;\n  display: block;\n  overflow: visible;\n  /* Soft drop shadow lifts the light icon off the dark page background */\n  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.55));\n}\n\n/* Icon colours \u2014 tuned for the dark theme: light outline + soft translucent\n   fill so the mouse reads crisply on #0a0a0a without being a flat white blob. */\n.anymouse-shell {\n  fill: rgba(229, 229, 229, 0.12);            /* faint light fill for body presence */\n  stroke: var(--mc-offwhite, #e5e5e5);         /* light outline */\n}\n.anymouse-ear {\n  fill: var(--mc-offwhite, #e5e5e5);           /* solid light ears \u2014 clearly visible */\n}\n.anymouse-wheel {\n  fill: var(--mc-blue, #3b82f6);               /* brand-blue scroll wheel accent */\n}\n\n/* Drag tail \u2014 hidden at rest, fades in while dragging. The `d` path is updated\n   in JS to trail behind the drag direction; transitioning `d` smooths it. */\n.anymouse-tail {\n  stroke: var(--mc-offwhite, #e5e5e5);\n  opacity: 0;\n  transition: opacity 0.18s ease, d 0.08s linear;\n}\n.anymouse-button.is-dragging .anymouse-tail { opacity: 0.85; }\n\n/* Anymouse notify dot \u2014 hidden until a notification is active */\n.anymouse-notify-dot { opacity: 0; fill: var(--mc-blue, #3b82f6); }\n\n.anymouse-notify-dot { transform-box: fill-box; transform-origin: center; }\n\n.anymouse-button.has-notification .anymouse-notify-dot {\n  opacity: 1;\n  animation: anymouse-notify-pulse 1.2s ease-in-out infinite;\n}\n.anymouse-button.has-notification .anymouse-ear--right { opacity: 0.25; }\n.anymouse-button.has-notification .anymouse-icon { animation: anymouse-notify-bounce 0.5s ease; }\n\n@keyframes anymouse-notify-pulse {\n  0%, 100% { transform: scale(1);    opacity: 1; }\n  50%      { transform: scale(1.25); opacity: 0.75; }\n}\n@keyframes anymouse-notify-bounce {\n  0%   { transform: translateY(0); }\n  40%  { transform: translateY(-4px); }\n  100% { transform: translateY(0); }\n}\n\n/* ===== Adoption / attention layer ===== */\n\n/* Attention pulse \u2014 a brand-blue glow + gentle scale on the button. Applied by\n   JS (.anymouse-attention) and removed by JS to stop. */\n.anymouse-button.anymouse-attention {\n  animation: anymouse-attention-pulse 1.6s ease-in-out infinite;\n}\n@keyframes anymouse-attention-pulse {\n  0%, 100% {\n    transform: scale(1);\n    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(59, 130, 246, 0);\n  }\n  50% {\n    transform: scale(1.06);\n    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2),\n                0 0 18px 4px var(--mc-blue, #3b82f6);\n  }\n}\n\n/* Coachmark / idle / contextual bubble \u2014 one shared element. Positioned BELOW\n   and slightly left of the button (the icon sits upper-right under the navbar),\n   with an arrow pointing up toward the icon. Dark surface, light text. Fades\n   in/out via .is-visible. */\n.anymouse-coachmark {\n  position: absolute;\n  top: calc(100% + 14px);\n  right: 0;\n  max-width: 600px;\n  width: max-content;\n  background: var(--mc-charcoal, #171717);\n  color: var(--mc-offwhite, #e5e5e5);\n  border: 1px solid var(--mc-slate, #262626);\n  border-radius: 10px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);\n  padding: 10px 30px 10px 12px;\n  font-family: Arial, sans-serif;\n  font-size: 0.85rem;\n  line-height: 1.4;\n  z-index: 10001;\n  opacity: 0;\n  transform: translateY(-6px);\n  transition: opacity 0.2s ease, transform 0.2s ease;\n  pointer-events: auto;\n}\n.anymouse-coachmark.is-visible {\n  opacity: 1;\n  transform: translateY(0);\n}\n/* Arrow pointing up at the icon */\n.anymouse-coachmark::after {\n  content: \'\';\n  position: absolute;\n  bottom: 100%;\n  right: 24px;\n  border: 7px solid transparent;\n  border-bottom-color: var(--mc-charcoal, #171717);\n}\n.anymouse-coachmark-text { display: block; }\n.anymouse-coachmark-dismiss {\n  position: absolute;\n  top: 4px;\n  right: 6px;\n  width: 20px;\n  height: 20px;\n  padding: 0;\n  background: transparent;\n  border: none;\n  color: var(--mc-ghost-gray, #525252);\n  font-size: 1rem;\n  line-height: 1;\n  cursor: pointer;\n  font-family: Arial, sans-serif;\n}\n.anymouse-coachmark-dismiss:hover { color: var(--mc-offwhite, #e5e5e5); }\n\n@media (max-width: 480px) {\n  .anymouse-coachmark { max-width: calc(100vw - 48px); }\n}\n\n/* Responsive */\n@media (max-width: 480px) {\n  .anymouse-root {\n    top: var(--anymouse-top, 90px);   /* smaller fallback: shorter mobile navbar */\n    right: 12px;\n  }\n\n  .anymouse-button {\n    width: 64px;\n    height: 64px;\n  }\n}\n\n/* ===== Quick Classify Popover ===== */\n/* The widget\'s DEFAULT theme is dark (matches SigmaBlox dark + MC\'s default\n   dark). Surface/text are driven by tokens so a host can re-skin via the\n   --anymouse-* vars; the fallbacks below are the dark palette. Light-mode\n   hosts override these (e.g. mc_site scopes overrides under .light-theme). */\n.anymouse-panel {\n  position: absolute;\n  bottom: 100%;\n  left: 0;\n  margin-bottom: 12px;\n  background: var(--anymouse-surface, var(--mc-charcoal, #171717));\n  border: 1px solid var(--anymouse-border, var(--mc-slate, #2a2a2a));\n  border-radius: 16px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);\n  color: var(--anymouse-text, var(--mc-offwhite, #e5e5e5));\n  width: 280px;\n  padding: 16px;\n  display: none;\n  z-index: 10000;\n}\n.anymouse-panel.open {\n  display: block;\n  animation: anymouse-popover-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.anymouse-panel.anymouse-panel-below { top: 100%; bottom: auto; margin-top: 12px; margin-bottom: 0; }\n.anymouse-panel.anymouse-panel-right { left: auto; right: 0; }\n\n@keyframes anymouse-popover-in {\n  from { opacity: 0; transform: translateY(8px) scale(0.96); }\n  to   { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n.anymouse-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n\n.anymouse-tile {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  padding: 18px 12px;\n  border: 1px solid var(--anymouse-border, var(--mc-slate, #2a2a2a));\n  border-radius: 12px;\n  background: var(--anymouse-tile-bg, rgba(255, 255, 255, 0.03));\n  cursor: pointer;\n  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;\n  font-family: Arial, sans-serif;\n}\n.anymouse-panel.open .anymouse-tile { animation: anymouse-tile-in 0.3s ease both; }\n.anymouse-panel.open .anymouse-tile:nth-child(1) { animation-delay: 0ms; }\n.anymouse-panel.open .anymouse-tile:nth-child(2) { animation-delay: 40ms; }\n.anymouse-panel.open .anymouse-tile:nth-child(3) { animation-delay: 80ms; }\n.anymouse-panel.open .anymouse-tile:nth-child(4) { animation-delay: 120ms; }\n@keyframes anymouse-tile-in {\n  from { opacity: 0; transform: translateY(6px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n\n.anymouse-tile-icon { width: 28px; height: 28px; }\n.anymouse-tile-icon svg { width: 100%; height: 100%; }\n.anymouse-tile-label { font-size: 0.9rem; font-weight: 600; }\n\n/* Per-category accent: icon/label colour + a faint diagonal gradient background\n   (matches the brand board\'s tinted tiles, tuned brighter for the dark theme). */\n.anymouse-tile[data-accent="blue"] {\n  color: var(--mc-blue, #3b82f6);\n  background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04));\n}\n.anymouse-tile[data-accent="red"] {\n  color: var(--anymouse-red, #ef4444);\n  background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.04));\n}\n.anymouse-tile[data-accent="green"] {\n  color: var(--anymouse-green, #22c55e);\n  background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.04));\n}\n.anymouse-tile[data-accent="purple"] {\n  color: var(--anymouse-purple, #6366f1);\n  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04));\n}\n\n.anymouse-tile:hover { transform: translateY(-2px); }\n.anymouse-tile[data-accent="blue"]:hover   { background: linear-gradient(135deg, rgba(59,130,246,0.30),  rgba(59,130,246,0.08));  border-color: var(--mc-blue, #3b82f6); }\n.anymouse-tile[data-accent="red"]:hover    { background: linear-gradient(135deg, rgba(239,68,68,0.30),   rgba(239,68,68,0.08));   border-color: var(--anymouse-red, #ef4444); }\n.anymouse-tile[data-accent="green"]:hover  { background: linear-gradient(135deg, rgba(34,197,94,0.30),   rgba(34,197,94,0.08));   border-color: var(--anymouse-green, #22c55e); }\n.anymouse-tile[data-accent="purple"]:hover { background: linear-gradient(135deg, rgba(99,102,241,0.30),  rgba(99,102,241,0.08));  border-color: var(--anymouse-purple, #6366f1); }\n.anymouse-tile:active { transform: scale(0.97); }\n\n.anymouse-viewall {\n  width: 100%;\n  margin-top: 12px;\n  padding: 8px;\n  background: transparent;\n  border: none;\n  color: var(--anymouse-muted, var(--mc-ghost-gray, #8a8a8a));\n  font-size: 0.85rem;\n  font-weight: 600;\n  cursor: pointer;\n  font-family: Arial, sans-serif;\n}\n.anymouse-viewall:hover { color: var(--anymouse-text, var(--mc-offwhite, #e5e5e5)); }\n\n/* Persistent prompt bar (fast entry capture) \u2014 always visible under the tiles */\n.anymouse-capture {\n  display: flex;\n  align-items: stretch;\n  gap: 8px;\n  margin-top: 12px;\n}\n.anymouse-capture-input {\n  flex: 1;\n  min-height: 44px;\n  max-height: 140px;\n  padding: 10px 12px;\n  border: 1px solid var(--anymouse-border, var(--mc-slate, #2a2a2a));\n  border-radius: 10px;\n  font-size: 0.95rem;\n  font-family: Arial, sans-serif;\n  line-height: 1.4;\n  resize: none;\n  box-sizing: border-box;\n  background: var(--anymouse-input-bg, var(--mc-black, #0a0a0a));\n  color: var(--anymouse-text, var(--mc-offwhite, #e5e5e5));\n}\n.anymouse-capture-input::placeholder { color: var(--anymouse-muted, var(--mc-ghost-gray, #6b6b6b)); }\n.anymouse-capture-input:focus { outline: none; border-color: var(--mc-blue, #3b82f6); }\n.anymouse-capture-save {\n  flex: 0 0 auto;\n  align-self: stretch;\n  padding: 0 16px;\n  background: var(--mc-blue, #3b82f6);\n  color: #fff;\n  border: none;\n  border-radius: 10px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  font-family: Arial, sans-serif;\n  transition: opacity 0.15s ease;\n}\n.anymouse-capture-save:hover { opacity: 0.9; }\n.anymouse-capture-save:disabled { opacity: 0.5; cursor: not-allowed; }\n.anymouse-capture-status { margin-top: 8px; font-size: 0.8rem; color: var(--anymouse-muted, var(--mc-ghost-gray, #8a8a8a)); min-height: 1em; text-align: center; }\n.anymouse-signin-link { color: var(--mc-blue, #3b82f6); font-weight: 600; text-decoration: none; }\n.anymouse-signin-link:hover { text-decoration: underline; }\n\n/* Active (selected) category tile */\n.anymouse-tile.is-active { border-width: 2px; padding: 17px 11px; }\n.anymouse-tile[data-accent="blue"].is-active   { border-color: var(--mc-blue, #3b82f6);        background: linear-gradient(135deg, rgba(59,130,246,0.30),  rgba(59,130,246,0.08)); }\n.anymouse-tile[data-accent="red"].is-active    { border-color: var(--anymouse-red, #ef4444);   background: linear-gradient(135deg, rgba(239,68,68,0.30),   rgba(239,68,68,0.08)); }\n.anymouse-tile[data-accent="green"].is-active  { border-color: var(--anymouse-green, #22c55e); background: linear-gradient(135deg, rgba(34,197,94,0.30),   rgba(34,197,94,0.08)); }\n.anymouse-tile[data-accent="purple"].is-active { border-color: var(--anymouse-purple, #6366f1);background: linear-gradient(135deg, rgba(99,102,241,0.30),  rgba(99,102,241,0.08)); }\n\n@media (max-width: 480px) {\n  .anymouse-panel { width: calc(100vw - 32px); max-width: 280px; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .anymouse-body,\n  .anymouse-button:hover .anymouse-icon { animation: none; }\n  .anymouse-button:hover .anymouse-ear { transform: none; }\n  .anymouse-button { transition: none; }\n  .anymouse-ear { transition: none; }\n  .anymouse-button:hover { transform: none; }\n  .anymouse-button.has-notification .anymouse-notify-dot { animation: none; }\n  .anymouse-button.has-notification .anymouse-icon { animation: none; }\n  .anymouse-panel.open,\n  .anymouse-panel.open .anymouse-tile { animation: none; }\n  .anymouse-tile:hover { transform: none; }\n  /* No drag tail under reduced motion (JS also skips updating its path) */\n  .anymouse-button.is-dragging .anymouse-tail { opacity: 0; }\n  /* Adoption: no pulse, no bubble fade (bubble still shows, just static). */\n  .anymouse-button.anymouse-attention { animation: none; }\n  .anymouse-coachmark { transition: none; transform: none; }\n}\n';

  // src/icon.js
  function getAnymouseSvg() {
    return `
        <svg class="anymouse-icon" viewBox="0 0 128 128" fill="none"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <!-- Tail: hidden at rest, shown + curved during drag (path d set by JS) -->
            <path class="anymouse-tail" id="anymouse-tail" d="M64 112 C82 124 80 140 62 148 C44 156 46 172 66 178" fill="none" stroke-width="5" stroke-linecap="round"/>
            <g class="anymouse-body">
                <circle class="anymouse-ear anymouse-ear--left"  cx="45" cy="29" r="10"/>
                <circle class="anymouse-ear anymouse-ear--right" cx="83" cy="29" r="10"/>
                <rect class="anymouse-shell" x="34" y="24" width="60" height="90" rx="30" stroke-width="6"/>
                <rect class="anymouse-wheel" x="60" y="40" width="8" height="24" rx="4"/>
            </g>
            <circle class="anymouse-notify-dot" cx="83" cy="29" r="11"/>
        </svg>
    `;
  }
  var TAIL_REST_PATH = "M64 112 C82 124 80 140 62 148 C44 156 46 172 66 178";
  var TAIL_LEN = 66;
  var TAIL_ANCHOR_X = 64;
  var TAIL_ANCHOR_Y = 112;
  function tailPath(dx, dy) {
    const ax = TAIL_ANCHOR_X, ay = TAIL_ANCHOR_Y;
    const sx = Math.max(-20, Math.min(20, -dx * 1.4));
    const drop = TAIL_LEN + Math.max(-14, Math.min(20, -dy * 0.5));
    const half = drop * 0.5;
    const midX = ax - sx * 0.2;
    const midY = ay + half;
    const c1x = ax + sx, c1y = ay + half * 0.45;
    const c2x = ax + sx * 0.9, c2y = ay + half * 0.85;
    const c3x = midX - sx, c3y = midY + half * 0.4;
    const c4x = midX - sx * 0.9, c4y = midY + half * 0.85;
    const endX = ax + sx * 0.4, endY = ay + drop;
    return `M${ax} ${ay} C${c1x} ${c1y} ${c2x} ${c2y} ${midX} ${midY} C${c3x} ${c3y} ${c4x} ${c4y} ${endX} ${endY}`;
  }

  // src/config.js
  var DEFAULTS = {
    // ---- LIVE keys (consumed by the module) ----
    // Persistence (overridable callbacks)
    apiBase: "",
    save: null,
    // (note) => Promise — overrides the built-in HTTP default
    getUser: null,
    // () => Promise<{email}|null> — null means "not logged in"
    // "View all" target. Navigate to viewAllUrl on click (default keeps SigmaBlox
    // parity). If onViewAll is a function it takes precedence (host handles it
    // in-app). If both are falsy the viewall button is hidden entirely.
    viewAllUrl: "/my-notes/",
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
    // Classification
    categories: [
      {
        id: "observation",
        label: "Observation",
        accent: "blue",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
      },
      {
        id: "blocker",
        label: "Blocker",
        accent: "red",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      },
      {
        id: "idea",
        label: "Idea",
        accent: "green",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>'
      },
      {
        id: "note",
        label: "Note",
        accent: "purple",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      }
    ],
    defaultCategory: "note",
    // Behavior
    hotkeys: { doubleShift: true, singleKey: "a" },
    suppressOn: [],
    // path patterns; if any matches location.pathname, don't mount
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
        text: "Quick-capture anything \u2014 double-tap Shift or click me.",
        rePulseAfterVisits: 3
      },
      idleNudge: {
        enabled: true,
        idleMs: 9e4,
        text: "Got a thought? Jot it here.",
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
    fetchNotes: null,
    // RESERVED: not yet wired — future notes-feed feature
    position: "bottom-left",
    // RESERVED: not yet wired — placement is CSS-only today
    modes: ["capture"],
    // RESERVED: not yet wired — future 'ask' chatbot mode
    theme: null,
    // RESERVED: not yet wired — { accent, surface, text, radius }
    reducedMotion: "auto"
    // RESERVED: not yet wired — drag uses its own matchMedia
  };
  var KNOWN_KEYS = Object.keys(DEFAULTS);
  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function deepMerge(d, u) {
    if (!isPlainObject(d) || !isPlainObject(u)) return u === void 0 ? d : u;
    const out = { ...d };
    for (const key of Object.keys(u)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      const dv = d[key];
      const uv = u[key];
      out[key] = isPlainObject(dv) && isPlainObject(uv) ? deepMerge(dv, uv) : uv;
    }
    return out;
  }
  function validateCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return null;
    const ok = categories.every(
      (c) => isPlainObject(c) && typeof c.id === "string" && c.id.length > 0 && typeof c.label === "string" && c.label.length > 0
    );
    return ok ? categories : null;
  }
  function mergeConfig(user) {
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
      if (uv === void 0) {
        cfg[key] = dv;
      } else if (key === "adoption" && isPlainObject(dv) && isPlainObject(uv)) {
        cfg[key] = deepMerge(dv, uv);
      } else if (isPlainObject(dv) && isPlainObject(uv)) {
        cfg[key] = { ...dv, ...uv };
      } else {
        cfg[key] = uv;
      }
    }
    if (cfg.adoption && !Array.isArray(cfg.adoption.contextualHints)) {
      if (cfg.adoption.contextualHints !== void 0) {
        console.warn("[Anymouse] adoption.contextualHints must be an array; using []");
      }
      cfg.adoption.contextualHints = [];
    }
    if (typeof cfg.apiBase === "string") {
      cfg.apiBase = cfg.apiBase.replace(/\/$/, "");
    }
    const validCategories = validateCategories(cfg.categories);
    if (!validCategories) {
      if (cfg.categories !== DEFAULTS.categories) {
        console.warn("[Anymouse] Invalid categories config; using defaults");
      }
      cfg.categories = DEFAULTS.categories;
    } else {
      cfg.categories = validCategories;
    }
    if (!cfg.categories.some((c) => c.id === cfg.defaultCategory)) {
      cfg.defaultCategory = cfg.categories[0].id;
    }
    return cfg;
  }

  // src/hotkeys.js
  var DOUBLE_TAP_MS = 400;
  function createKeydownHandler(ctx) {
    const { cfg, launch, close, isPanelOpen, getRoot, isEditableTarget } = ctx;
    const hotkeys = cfg.hotkeys || {};
    let lastShiftTime = 0;
    return function onKeydown(e) {
      var _a;
      if (e.key === "Escape") {
        if (isPanelOpen()) close();
        return;
      }
      if (hotkeys.doubleShift && e.key === "Shift" && !e.repeat) {
        const now = e.timeStamp || performance.now();
        if (now - lastShiftTime < DOUBLE_TAP_MS) {
          lastShiftTime = 0;
          e.preventDefault();
          launch();
        } else {
          lastShiftTime = now;
        }
        return;
      }
      if (e.key !== "Shift") lastShiftTime = 0;
      const single = hotkeys.singleKey;
      if (single) {
        const insideWidget = (_a = getRoot()) == null ? void 0 : _a.contains(e.target);
        const matches = e.key === single || e.key === single.toUpperCase();
        if (matches && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditableTarget(e.target) && !insideWidget) {
          e.preventDefault();
          launch();
        }
      }
    };
  }

  // src/drag.js
  var STORAGE_KEYS = {
    POSITION: "anymouse-position",
    MINIMIZED: "anymouse-minimized"
  };
  var DRAG_THRESHOLD = 6;
  var PREFERS_REDUCED_MOTION = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  function getTail() {
    return document.getElementById("anymouse-tail");
  }
  function updateTail(dx, dy) {
    const tail = getTail();
    if (!tail || PREFERS_REDUCED_MOTION) return;
    tail.setAttribute("d", tailPath(dx, dy));
  }
  function resetTail() {
    const tail = getTail();
    if (tail) tail.setAttribute("d", TAIL_REST_PATH);
  }
  function createDrag(ctx) {
    const { getRoot, getButton, state, onPositionChange } = ctx;
    const dragState = {
      pointerId: null,
      isPointerDown: false,
      isDragging: false,
      offsetX: 0,
      offsetY: 0,
      startX: 0,
      startY: 0
    };
    let lastTailX = 0;
    let lastTailY = 0;
    function updatePosition(left, top, skipSave = false) {
      const container = getRoot();
      if (!container) return;
      const safeLeft = Number.isFinite(left) ? left : 0;
      const safeTop = Number.isFinite(top) ? top : 0;
      const width = container.offsetWidth || 0;
      const height = container.offsetHeight || 0;
      const maxLeft = Math.max(0, window.innerWidth - width);
      const maxTop = Math.max(0, window.innerHeight - height);
      const clampedLeft = Math.min(Math.max(0, safeLeft), maxLeft);
      const clampedTop = Math.min(Math.max(0, safeTop), maxTop);
      container.style.left = `${clampedLeft}px`;
      container.style.top = `${clampedTop}px`;
      container.style.bottom = "auto";
      container.style.right = "auto";
      if (!skipSave) savePosition();
      if (onPositionChange) onPositionChange();
    }
    function savePosition() {
      const container = getRoot();
      if (!container) return;
      const left = parseFloat(container.style.left || 0);
      const top = parseFloat(container.style.top || 0);
      try {
        localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify({ left, top }));
      } catch (_) {
      }
    }
    function resetPosition() {
      const container = getRoot();
      if (!container) return;
      container.style.left = "";
      container.style.top = "";
      container.style.bottom = "";
      container.style.right = "";
      try {
        localStorage.removeItem(STORAGE_KEYS.POSITION);
      } catch (_) {
      }
    }
    function ensureInViewport() {
      const container = getRoot();
      if (!container || !container.style.left || !container.style.top) return;
      updatePosition(parseFloat(container.style.left), parseFloat(container.style.top), true);
    }
    function applyStoredPosition() {
      let stored;
      try {
        stored = localStorage.getItem(STORAGE_KEYS.POSITION);
      } catch (_) {
        stored = null;
      }
      if (stored) {
        try {
          const { left, top } = JSON.parse(stored);
          updatePosition(parseFloat(left), parseFloat(top), true);
        } catch (err) {
          console.warn("[Anymouse] Invalid stored position", err);
        }
      }
      ensureInViewport();
    }
    function startPointerDrag(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragState.pointerId = e.pointerId;
      dragState.isPointerDown = true;
      dragState.isDragging = false;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      const container = getRoot();
      const button = getButton();
      if (!container || !button) return;
      const rect = container.getBoundingClientRect();
      dragState.offsetX = e.clientX - rect.left;
      dragState.offsetY = e.clientY - rect.top;
      button.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e) {
      var _a;
      if (!dragState.isPointerDown || e.pointerId !== dragState.pointerId) return;
      const deltaX = Math.abs(e.clientX - dragState.startX);
      const deltaY = Math.abs(e.clientY - dragState.startY);
      if (!dragState.isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
        dragState.isDragging = true;
        state.isDragging = true;
        (_a = getButton()) == null ? void 0 : _a.classList.add("is-dragging");
        lastTailX = e.clientX;
        lastTailY = e.clientY;
      }
      if (!dragState.isDragging) return;
      e.preventDefault();
      updateTail(e.clientX - lastTailX, e.clientY - lastTailY);
      lastTailX = e.clientX;
      lastTailY = e.clientY;
      updatePosition(e.clientX - dragState.offsetX, e.clientY - dragState.offsetY);
    }
    function stopPointerDrag(e) {
      var _a;
      if (!dragState.isPointerDown || e.pointerId !== dragState.pointerId) return;
      const button = getButton();
      if (button) button.releasePointerCapture(e.pointerId);
      if (dragState.isDragging) {
        savePosition();
        state.skipNextClick = true;
        (_a = getButton()) == null ? void 0 : _a.classList.remove("is-dragging");
        resetTail();
      }
      dragState.pointerId = null;
      dragState.isPointerDown = false;
      dragState.isDragging = false;
      state.isDragging = false;
      setTimeout(() => {
        state.skipNextClick = false;
      }, 150);
    }
    return {
      startPointerDrag,
      onPointerMove,
      stopPointerDrag,
      updatePosition,
      resetPosition,
      ensureInViewport,
      applyStoredPosition
    };
  }

  // src/adoption.js
  var LS = {
    SEEN: "anymouse-seen",
    // '1' once the user has opened the panel
    VISITS: "anymouse-visits",
    // integer, incremented once per init()
    USED: "anymouse-used",
    // '1' once a note has been saved
    STREAK: "anymouse-streak",
    // JSON { weekKey, count }
    HINT: "anymouse-hint-",
    // prefix; per-match-pattern shown flag
    REPULSED: "anymouse-repulsed"
    // '1' once the one-off re-pulse has fired
  };
  var SS_IDLE = "anymouse-idle-shown";
  var PULSE_CLASS = "anymouse-attention";
  var COACHMARK_PULSE_MS = 6e3;
  var IDLE_BUBBLE_MS = 14e3;
  var HINT_BUBBLE_MS = 14e3;
  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }
  function lsSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (_) {
    }
  }
  function ssGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }
  function ssSet(key, val) {
    try {
      sessionStorage.setItem(key, val);
    } catch (_) {
    }
  }
  function currentWeekKey(now = /* @__PURE__ */ new Date()) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d - start) / (7 * 24 * 60 * 60 * 1e3));
    return `${d.getFullYear()}-W${week}`;
  }
  function createAdoption(ctx) {
    const { cfg, getRoot, getButton, openPanel, isPanelOpen, addDocListener, prefersReducedMotion } = ctx;
    const adoption = cfg && cfg.adoption || {};
    let bubbleEl = null;
    let bubbleTimer = null;
    let idleTimer = null;
    let pulseTimer = null;
    let destroyed = false;
    function startPulse(durationMs) {
      var _a;
      clearTimeout(pulseTimer);
      pulseTimer = null;
      if (prefersReducedMotion) return;
      (_a = getButton()) == null ? void 0 : _a.classList.add(PULSE_CLASS);
      if (durationMs > 0) {
        pulseTimer = setTimeout(stopPulse, durationMs);
      }
    }
    function stopPulse() {
      var _a;
      clearTimeout(pulseTimer);
      pulseTimer = null;
      (_a = getButton()) == null ? void 0 : _a.classList.remove(PULSE_CLASS);
    }
    function dismissBubble() {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
      stopPulse();
      if (bubbleEl) {
        bubbleEl.classList.remove("is-visible");
        const el = bubbleEl;
        bubbleEl = null;
        setTimeout(() => {
          el.remove();
        }, prefersReducedMotion ? 0 : 220);
      }
    }
    function showBubble(text, autoDismissMs) {
      const root = getRoot();
      if (!root || destroyed) return;
      dismissBubble();
      const el = document.createElement("div");
      el.className = "anymouse-coachmark";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      const span = document.createElement("span");
      span.className = "anymouse-coachmark-text";
      span.textContent = text;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "anymouse-coachmark-dismiss";
      close.setAttribute("aria-label", "Dismiss");
      close.textContent = "\xD7";
      close.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissBubble();
      });
      el.appendChild(span);
      el.appendChild(close);
      root.appendChild(el);
      bubbleEl = el;
      requestAnimationFrame(() => {
        el.classList.add("is-visible");
      });
      if (autoDismissMs > 0) {
        bubbleTimer = setTimeout(dismissBubble, autoDismissMs);
      }
    }
    function maybeCoachmark() {
      const cm = adoption.coachmark || {};
      const visits = (parseInt(lsGet(LS.VISITS), 10) || 0) + 1;
      lsSet(LS.VISITS, String(visits));
      const seen = lsGet(LS.SEEN) === "1";
      if (!seen && cm.enabled) {
        showBubble(cm.text, 0);
        startPulse(COACHMARK_PULSE_MS);
        return;
      }
      const used = lsGet(LS.USED) === "1";
      const rePulseAfter = cm.rePulseAfterVisits;
      const alreadyRePulsed = lsGet(LS.REPULSED) === "1";
      if (cm.enabled && seen && !used && !alreadyRePulsed && typeof rePulseAfter === "number" && rePulseAfter > 0 && visits >= rePulseAfter) {
        lsSet(LS.REPULSED, "1");
        startPulse(COACHMARK_PULSE_MS);
      }
    }
    function setupIdleNudge() {
      const nudge = adoption.idleNudge || {};
      if (!nudge.enabled) return;
      const idleMs = typeof nudge.idleMs === "number" && nudge.idleMs > 0 ? nudge.idleMs : 9e4;
      let idleDone = false;
      function fire() {
        if (destroyed) return;
        if (isPanelOpen()) return;
        if (nudge.oncePerSession && ssGet(SS_IDLE) === "1") return;
        ssSet(SS_IDLE, "1");
        if (nudge.oncePerSession) idleDone = true;
        showBubble(nudge.text, IDLE_BUBBLE_MS);
        startPulse(COACHMARK_PULSE_MS);
      }
      function reset() {
        if (idleDone) return;
        clearTimeout(idleTimer);
        if (nudge.oncePerSession && ssGet(SS_IDLE) === "1") {
          idleDone = true;
          return;
        }
        idleTimer = setTimeout(fire, idleMs);
      }
      ["mousemove", "keydown", "scroll", "click"].forEach((type) => {
        addDocListener(document, type, reset, { passive: true });
      });
      reset();
    }
    function maybeContextualHint() {
      const hints = Array.isArray(adoption.contextualHints) ? adoption.contextualHints : [];
      if (hints.length === 0) return;
      const path = typeof location !== "undefined" && location.pathname || "";
      const hit = hints.find(
        (h) => h && typeof h.match === "string" && h.match.length > 0 && typeof h.text === "string" && h.text.length > 0 && path.includes(h.match) && lsGet(LS.HINT + h.match) !== "1"
      );
      if (!hit) return;
      lsSet(LS.HINT + hit.match, "1");
      showBubble(hit.text, HINT_BUBBLE_MS);
      startPulse(COACHMARK_PULSE_MS);
    }
    function bumpStreak() {
      const weekKey = currentWeekKey();
      let count = 1;
      const raw = lsGet(LS.STREAK);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.weekKey === weekKey && typeof parsed.count === "number") {
            count = parsed.count + 1;
          }
        } catch (_) {
        }
      }
      lsSet(LS.STREAK, JSON.stringify({ weekKey, count }));
      return count;
    }
    function onSaved() {
      lsSet(LS.USED, "1");
      const ps = adoption.postSave || {};
      if (!ps.enabled) return;
      const status = document.getElementById("anymouse-capture-status");
      if (!status) return;
      if (ps.streak) {
        const n = bumpStreak();
        status.textContent = `Saved \xB7 ${n} this week`;
      } else {
        status.textContent = "Saved \u2713";
      }
    }
    function onPanelOpen() {
      lsSet(LS.SEEN, "1");
      stopPulse();
      dismissBubble();
    }
    function showCoachmark() {
      const cm = adoption.coachmark || {};
      const text = cm.text || "Quick-capture anything \u2014 double-tap Shift or click me.";
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
      stopPulse();
      if (bubbleEl) {
        bubbleEl.remove();
        bubbleEl = null;
      }
    }
    return { init, onSaved, onPanelOpen, showCoachmark, destroy };
  }

  // src/anymouse.js
  (function() {
    "use strict";
    const STYLE_ID = "anymouse-styles";
    const ROOT_ID = "anymouse-root";
    let cfg = null;
    let root = null;
    let mounted = false;
    let captureCloseTimer = null;
    let drag = null;
    let adoption = null;
    let scrollTimeoutId = null;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const docListeners = [];
    const SCROLL_HIDE_THRESHOLD = 200;
    const SCROLL_RESET_DELAY = 2e3;
    const state = {
      user: null,
      activeCategory: "note",
      skipNextClick: false,
      isDragging: false
    };
    function getButton() {
      return document.getElementById("anymouse-button");
    }
    function getPanel() {
      return document.getElementById("anymouse-panel");
    }
    function getInput() {
      return document.getElementById("anymouse-capture-input");
    }
    function getStatus() {
      return document.getElementById("anymouse-capture-status");
    }
    function isPanelOpen() {
      var _a;
      return ((_a = getPanel()) == null ? void 0 : _a.classList.contains("open")) || false;
    }
    function userEmail() {
      return state.user && state.user.email ? state.user.email : null;
    }
    function categoryTitle(id) {
      if (id === "note") return "Quick Note";
      const c = cfg.categories.find((x) => x.id === id);
      const label = c ? c.label : id;
      return `New ${label}`;
    }
    function isEditableTarget(target) {
      if (!target) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable === true;
    }
    function isSuppressed() {
      const path = typeof location !== "undefined" && location.pathname || "";
      return (cfg.suppressOn || []).some((pattern) => {
        if (pattern === "/") return path === "/" || path === "";
        return path.includes(pattern);
      });
    }
    function addDocListener(target, type, handler, opts) {
      target.addEventListener(type, handler, opts);
      docListeners.push({ target, type, handler });
    }
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = styles_default;
      document.head.appendChild(el);
    }
    function createUI() {
      const container = document.createElement("div");
      container.className = "anymouse-root";
      container.id = ROOT_ID;
      const tiles = cfg.categories.map((c) => `
                        <button class="anymouse-tile" data-category="${c.id}" data-accent="${c.accent || ""}" type="button" aria-pressed="false">
                            <span class="anymouse-tile-icon">${c.icon || ""}</span>
                            <span class="anymouse-tile-label">${c.label}</span>
                        </button>`).join("");
      container.innerHTML = `
            <button class="anymouse-button" id="anymouse-button" title="Anymouse \u2014 quick capture (double-tap Shift)" aria-label="Anymouse \u2014 quick capture" aria-haspopup="true" aria-expanded="false" aria-controls="anymouse-panel">
                ${getAnymouseSvg()}
            </button>

            <div class="anymouse-panel" id="anymouse-panel" role="group" aria-label="Quick capture">
                <div class="anymouse-grid">
                    ${tiles}
                </div>

                <div class="anymouse-capture" id="anymouse-capture">
                    <textarea class="anymouse-capture-input" id="anymouse-capture-input" placeholder="Jot a note\u2026" maxlength="10000" rows="2"></textarea>
                    <button class="anymouse-capture-save" id="anymouse-capture-save" type="button">Save</button>
                </div>
                <div class="anymouse-capture-status" id="anymouse-capture-status" role="status" aria-live="polite"></div>

                ${hasViewAll() ? '<button class="anymouse-viewall" id="anymouse-viewall" type="button">View all notes \u2192</button>' : ""}
            </div>
        `;
      document.body.appendChild(container);
      root = container;
    }
    function setIconState(stateName) {
      root == null ? void 0 : root.classList.toggle("is-engaged", stateName === "is-engaged");
    }
    function setNotification(on) {
      var _a;
      (_a = getButton()) == null ? void 0 : _a.classList.toggle("has-notification", !!on);
    }
    function isMinimized() {
      return (root == null ? void 0 : root.classList.contains("anymouse-minimized")) || false;
    }
    function setMinimized(minimized) {
      const button = getButton();
      if (!root || !button) return;
      root.classList.toggle("anymouse-minimized", minimized);
      button.setAttribute("title", minimized ? "Expand Anymouse (double-tap Shift)" : "Anymouse \u2014 quick capture (double-tap Shift)");
      try {
        localStorage.setItem(STORAGE_KEYS.MINIMIZED, minimized ? "true" : "false");
      } catch (_) {
      }
    }
    function handleScroll() {
      const button = getButton();
      if (!button || state.isDragging) return;
      applyAnchor();
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > SCROLL_HIDE_THRESHOLD) {
        button.classList.add("hidden-scroll");
      } else {
        button.classList.remove("hidden-scroll");
      }
      lastScrollY = currentScrollY;
      clearTimeout(scrollTimeoutId);
      scrollTimeoutId = setTimeout(() => {
        button.classList.remove("hidden-scroll");
      }, SCROLL_RESET_DELAY);
    }
    function applyStoredPreferences() {
      let storedMinimized;
      try {
        storedMinimized = localStorage.getItem(STORAGE_KEYS.MINIMIZED);
      } catch (_) {
        storedMinimized = null;
      }
      if (storedMinimized === "true") setMinimized(true);
      drag == null ? void 0 : drag.applyStoredPosition();
    }
    function hasStoredPosition() {
      try {
        return !!localStorage.getItem(STORAGE_KEYS.POSITION);
      } catch (_) {
        return false;
      }
    }
    let lastAnchorTop = null;
    function applyAnchor() {
      if (!root || hasStoredPosition()) return;
      const sel = cfg.anchor && cfg.anchor.selector;
      if (!sel) return;
      const el = document.querySelector(sel);
      if (!el) return;
      const gap = cfg.anchor && typeof cfg.anchor.gap === "number" ? cfg.anchor.gap : 50;
      const top = Math.max(0, Math.round(el.getBoundingClientRect().bottom + gap));
      if (top === lastAnchorTop) return;
      lastAnchorTop = top;
      root.style.setProperty("--anymouse-top", top + "px");
    }
    function openPanel() {
      var _a;
      clearTimeout(captureCloseTimer);
      const el = getPanel();
      if (!el) return;
      el.classList.add("open");
      setActiveCategory(cfg.defaultCategory);
      const status = getStatus();
      if (status) status.textContent = "";
      setIconState("is-engaged");
      setNotification(false);
      adoption == null ? void 0 : adoption.onPanelOpen();
      requestAnimationFrame(positionPanel);
      (_a = getButton()) == null ? void 0 : _a.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => {
        var _a2;
        (_a2 = getInput()) == null ? void 0 : _a2.focus();
      });
    }
    function closePanel() {
      clearTimeout(captureCloseTimer);
      const el = getPanel();
      const wasOpen = el == null ? void 0 : el.classList.contains("open");
      el == null ? void 0 : el.classList.remove("open");
      setIconState("is-resting");
      const btn = getButton();
      btn == null ? void 0 : btn.setAttribute("aria-expanded", "false");
      if (wasOpen) btn == null ? void 0 : btn.focus();
    }
    function togglePanel() {
      if (isPanelOpen()) closePanel();
      else openPanel();
    }
    function positionPanel() {
      const menu = getPanel();
      if (!menu || !root) return;
      menu.classList.remove("anymouse-panel-below", "anymouse-panel-right");
      const r = root.getBoundingClientRect();
      if (r.top < menu.offsetHeight + 24 && window.innerHeight - r.bottom > r.top) {
        menu.classList.add("anymouse-panel-below");
      }
      if (window.innerWidth - r.left < menu.offsetWidth + 24 && r.right > menu.offsetWidth) {
        menu.classList.add("anymouse-panel-right");
      }
    }
    function setActiveCategory(category) {
      state.activeCategory = category;
      document.querySelectorAll(".anymouse-tile").forEach((tile) => {
        const isActive = tile.dataset.category === category;
        tile.classList.toggle("is-active", isActive);
        tile.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      const input = getInput();
      if (input) {
        input.placeholder = category === "note" ? "Jot a note\u2026" : `Capture ${category}\u2026`;
      }
    }
    async function defaultSave(note) {
      const headers = { "Content-Type": "application/json" };
      const email = userEmail();
      if (email) headers["x-member-email"] = email;
      const response = await fetch(`${cfg.apiBase}/api/member/notes`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          action: "add",
          targetType: "company",
          targetId: "quick-note",
          content: note.content,
          title: categoryTitle(note.category),
          tags: note.tags,
          pinned: false
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to save note");
      }
      return data;
    }
    function isAuthed() {
      return !!(state.user && state.user.email);
    }
    function signInUrl() {
      if (cfg.signInUrl) return cfg.signInUrl;
      if (!cfg.apiBase) return null;
      const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
      return `${cfg.apiBase}/auth/sso/start?provider=authentik&returnTo=${returnTo}`;
    }
    function promptSignIn() {
      const status = getStatus();
      if (!status) return;
      if (typeof cfg.onSignIn === "function") {
        status.textContent = "Sign in to save your notes.";
        cfg.onSignIn();
        return;
      }
      const url = signInUrl();
      const frag = document.createDocumentFragment();
      const msg = document.createElement("span");
      msg.textContent = "Sign in to save your notes. ";
      frag.appendChild(msg);
      if (url) {
        const link = document.createElement("a");
        link.className = "anymouse-signin-link";
        link.href = url;
        link.textContent = "Sign in \u2192";
        frag.appendChild(link);
      }
      status.replaceChildren(frag);
    }
    async function saveCapture() {
      const saveBtn = document.getElementById("anymouse-capture-save");
      if (saveBtn == null ? void 0 : saveBtn.disabled) return;
      const input = getInput();
      const status = getStatus();
      const content = ((input == null ? void 0 : input.value) || "").trim();
      if (!content) {
        if (status) status.textContent = "Please write something";
        return;
      }
      if (!isAuthed()) {
        promptSignIn();
        return;
      }
      const category = state.activeCategory;
      const context = cfg.captureContext ? {
        url: location.href,
        title: document.title,
        selection: String(window.getSelection && window.getSelection() || "")
      } : null;
      const note = {
        content,
        category,
        tags: [category],
        context,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving\u2026";
      }
      try {
        if (typeof cfg.save === "function") {
          await cfg.save(note);
        } else {
          await defaultSave(note);
        }
        if (status) status.textContent = "Saved \u2713";
        if (input) input.value = "";
        adoption == null ? void 0 : adoption.onSaved();
        captureCloseTimer = setTimeout(() => closePanel(), 900);
      } catch (error) {
        console.error("[Anymouse] Error saving note:", error);
        if (status) status.textContent = "Couldn't save \u2014 try again";
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
        }
      }
    }
    function hasViewAll() {
      return typeof cfg.onViewAll === "function" || !!cfg.viewAllUrl;
    }
    function viewAllNotes() {
      if (typeof cfg.onViewAll === "function") {
        cfg.onViewAll();
      } else if (cfg.viewAllUrl) {
        window.location.href = cfg.viewAllUrl;
      }
    }
    function launchAnymouse() {
      var _a;
      if (isMinimized()) setMinimized(false);
      if (!isPanelOpen()) {
        openPanel();
      } else {
        (_a = getInput()) == null ? void 0 : _a.focus();
      }
    }
    function setupEventListeners() {
      var _a, _b, _c;
      const button = getButton();
      if (!button) return;
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.skipNextClick) return;
        togglePanel();
      });
      button.addEventListener("pointerdown", drag.startPointerDrag);
      addDocListener(document, "pointermove", drag.onPointerMove);
      addDocListener(document, "pointerup", drag.stopPointerDrag);
      addDocListener(document, "pointercancel", drag.stopPointerDrag);
      document.querySelectorAll(".anymouse-tile").forEach((tile) => {
        tile.addEventListener("click", (e) => {
          var _a2;
          e.stopPropagation();
          setActiveCategory(tile.dataset.category);
          (_a2 = getInput()) == null ? void 0 : _a2.focus();
        });
      });
      (_a = document.getElementById("anymouse-viewall")) == null ? void 0 : _a.addEventListener("click", (e) => {
        e.stopPropagation();
        closePanel();
        viewAllNotes();
      });
      (_b = document.getElementById("anymouse-capture-save")) == null ? void 0 : _b.addEventListener("click", (e) => {
        e.stopPropagation();
        saveCapture();
      });
      (_c = getInput()) == null ? void 0 : _c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          saveCapture();
        }
      });
      addDocListener(document, "click", (e) => {
        if (root && !root.contains(e.target)) closePanel();
      });
      const onKeydown = createKeydownHandler({
        cfg,
        launch: launchAnymouse,
        close: closePanel,
        isPanelOpen,
        getRoot: () => root,
        isEditableTarget
      });
      addDocListener(document, "keydown", onKeydown);
      addDocListener(window, "scroll", handleScroll, { passive: true });
      addDocListener(window, "resize", () => {
        applyAnchor();
        drag == null ? void 0 : drag.ensureInViewport();
        if (isPanelOpen()) requestAnimationFrame(positionPanel);
      });
    }
    async function init(userConfig) {
      if (mounted) return Anymouse;
      cfg = mergeConfig(userConfig);
      state.activeCategory = cfg.defaultCategory;
      if (isSuppressed()) return Anymouse;
      injectStyles();
      createUI();
      state.user = null;
      const getUser = typeof cfg.getUser === "function" ? cfg.getUser : async () => null;
      Promise.resolve().then(getUser).then((u) => {
        state.user = u || null;
      }).catch((err) => {
        console.error("[Anymouse] getUser failed:", err);
        state.user = null;
      });
      drag = createDrag({
        getRoot: () => root,
        getButton,
        state,
        onPositionChange: () => {
          if (isPanelOpen()) requestAnimationFrame(positionPanel);
        }
      });
      setupEventListeners();
      applyStoredPreferences();
      applyAnchor();
      adoption = createAdoption({
        cfg,
        getRoot: () => root,
        getButton,
        openPanel,
        isPanelOpen,
        addDocListener,
        prefersReducedMotion: PREFERS_REDUCED_MOTION
      });
      adoption.init();
      mounted = true;
      return Anymouse;
    }
    function destroy() {
      var _a;
      docListeners.forEach(({ target, type, handler }) => {
        target.removeEventListener(type, handler);
      });
      docListeners.length = 0;
      clearTimeout(captureCloseTimer);
      clearTimeout(scrollTimeoutId);
      adoption == null ? void 0 : adoption.destroy();
      root == null ? void 0 : root.remove();
      (_a = document.getElementById(STYLE_ID)) == null ? void 0 : _a.remove();
      root = null;
      drag = null;
      adoption = null;
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
      showCoachmark: () => adoption == null ? void 0 : adoption.showCoachmark(),
      resetPosition: () => {
        drag == null ? void 0 : drag.resetPosition();
        applyAnchor();
      },
      // Programmatic capture: set text + category, then save.
      capture(text, category) {
        if (!mounted) return;
        if (category) setActiveCategory(category);
        const input = getInput();
        if (input) input.value = text == null ? "" : String(text);
        return saveCapture();
      },
      destroy,
      isMounted() {
        return mounted;
      }
    };
    if (typeof window !== "undefined") window.Anymouse = Anymouse;
  })();
})();
