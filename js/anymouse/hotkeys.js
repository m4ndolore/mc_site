/**
 * Anymouse keyboard launchers: double-tap Shift (primary) + a single
 * configurable key (when not typing in a field). NOTE: Cmd/Ctrl-K is
 * intentionally NOT used — Ghost's built-in Sodo Search owns that globally.
 */

export const DOUBLE_TAP_MS = 400;

/**
 * Wire keydown launchers. Returns the keydown handler so the caller can register
 * it (and later remove it for destroy()).
 *
 * @param {object} ctx
 * @param {object} ctx.cfg            merged config (reads cfg.hotkeys)
 * @param {Function} ctx.launch       open/refocus the widget
 * @param {Function} ctx.close        close the panel
 * @param {Function} ctx.isPanelOpen  () => boolean
 * @param {Function} ctx.getRoot      () => root element (for inside-widget check)
 * @param {Function} ctx.isEditableTarget (target) => boolean
 */
export function createKeydownHandler(ctx) {
  const { cfg, launch, close, isPanelOpen, getRoot, isEditableTarget } = ctx;
  const hotkeys = cfg.hotkeys || {};
  let lastShiftTime = 0;

  return function onKeydown(e) {
    // Escape closes the popover.
    if (e.key === 'Escape') {
      if (isPanelOpen()) close();
      return;
    }

    // Double-tap Shift → launch.
    if (hotkeys.doubleShift && e.key === 'Shift' && !e.repeat) {
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
    // Any other key resets the double-tap window.
    if (e.key !== 'Shift') lastShiftTime = 0;

    // Single configurable key → launch, but only when not typing in an editable
    // field, not already focused inside the widget, and without modifiers (so
    // Cmd/Ctrl-A select-all and Alt combos are untouched).
    const single = hotkeys.singleKey;
    if (single) {
      const insideWidget = getRoot()?.contains(e.target);
      const matches = e.key === single || e.key === single.toUpperCase();
      if (matches && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditableTarget(e.target) && !insideWidget) {
        e.preventDefault();
        launch();
      }
    }
  };
}
