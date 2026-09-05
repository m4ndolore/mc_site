/**
 * Anymouse drag + tail: pointer drag, position clamping/persistence
 * (localStorage anymouse-position / anymouse-minimized), and the S-curl tail.
 */

import { tailPath, TAIL_REST_PATH } from './icon.js';

export const STORAGE_KEYS = {
  POSITION: 'anymouse-position',
  MINIMIZED: 'anymouse-minimized'
};

const DRAG_THRESHOLD = 6;

// matchMedia evaluated once (matches the original module-load behavior).
export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function getTail() { return document.getElementById('anymouse-tail'); }

// Curve the tail so it trails OPPOSITE the drag direction, in the SVG's
// 128x128 user space.
export function updateTail(dx, dy) {
  const tail = getTail();
  if (!tail || PREFERS_REDUCED_MOTION) return;
  tail.setAttribute('d', tailPath(dx, dy));
}

export function resetTail() {
  const tail = getTail();
  if (tail) tail.setAttribute('d', TAIL_REST_PATH);
}

/**
 * Create drag controller.
 *
 * @param {object} ctx
 * @param {Function} ctx.getRoot    () => root element
 * @param {Function} ctx.getButton  () => button element
 * @param {object}   ctx.state      shared widget state (sets state.skipNextClick, state.isDragging)
 * @param {Function} ctx.onPositionChange optional callback after a position update (e.g. reposition panel)
 * @returns controller with attach()/detach() and position helpers
 */
export function createDrag(ctx) {
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
    container.style.bottom = 'auto';
    container.style.right = 'auto';

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
    } catch { /* storage may be unavailable */ }
  }

  function resetPosition() {
    const container = getRoot();
    if (!container) return;
    // Clear all inline placement so the stylesheet default (upper-right via
    // top/right + --anymouse-top) takes over again.
    container.style.left = '';
    container.style.top = '';
    container.style.bottom = '';
    container.style.right = '';
    try { localStorage.removeItem(STORAGE_KEYS.POSITION); } catch { /* noop */ }
  }

  function ensureInViewport() {
    const container = getRoot();
    if (!container || !container.style.left || !container.style.top) return;
    updatePosition(parseFloat(container.style.left), parseFloat(container.style.top), true);
  }

  function applyStoredPosition() {
    let stored;
    try { stored = localStorage.getItem(STORAGE_KEYS.POSITION); } catch { stored = null; }
    if (stored) {
      try {
        const { left, top } = JSON.parse(stored);
        updatePosition(parseFloat(left), parseFloat(top), true);
      } catch (err) {
        console.warn('[Anymouse] Invalid stored position', err);
      }
    }
    ensureInViewport();
  }

  function startPointerDrag(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

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
    if (!dragState.isPointerDown || e.pointerId !== dragState.pointerId) return;

    const deltaX = Math.abs(e.clientX - dragState.startX);
    const deltaY = Math.abs(e.clientY - dragState.startY);

    if (!dragState.isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      dragState.isDragging = true;
      state.isDragging = true;
      getButton()?.classList.add('is-dragging');
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
    if (!dragState.isPointerDown || e.pointerId !== dragState.pointerId) return;

    const button = getButton();
    if (button) button.releasePointerCapture(e.pointerId);

    if (dragState.isDragging) {
      savePosition();
      state.skipNextClick = true;
      getButton()?.classList.remove('is-dragging');
      resetTail();
    }

    dragState.pointerId = null;
    dragState.isPointerDown = false;
    dragState.isDragging = false;
    state.isDragging = false;

    // Allow clicks again shortly after dragging.
    setTimeout(() => { state.skipNextClick = false; }, 150);
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
