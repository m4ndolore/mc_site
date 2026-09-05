/**
 * Anymouse icon + tail geometry. The icon part classes (.anymouse-icon/-body/
 * -ear/-shell/-wheel/-notify-dot/-tail) are animated via CSS; do not rename them.
 */

// Inline Anymouse icon — source of truth for the rendered widget (parts are
// animated via CSS).
export function getAnymouseSvg() {
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

// Resting two-wave curl path (matches the brand-board art: exits, swings right,
// back left, ends curling right).
export const TAIL_REST_PATH = 'M64 112 C82 124 80 140 62 148 C44 156 46 172 66 178';

// Overall tail length used by tailPath (drop from anchor to tip).
export const TAIL_LEN = 66;

// Anchor point at the body bottom, in the SVG's 128x128 user space.
export const TAIL_ANCHOR_X = 64;
export const TAIL_ANCHOR_Y = 112;

/**
 * Compute the wavy tail `d` so it trails OPPOSITE the drag direction with TWO
 * alternating waves (matching the brand-board art) instead of a single S.
 * Built from two cubic segments: wave 1 sways to +sx and returns near centre at
 * the midpoint; wave 2 sways to -sx and ends curling back toward +sx. The sway
 * leans with horizontal drag; the drop grows when dragging upward. Constants are
 * hand-tuned for visual feel, not physical accuracy. Returns the path `d` string.
 */
export function tailPath(dx, dy) {
  const ax = TAIL_ANCHOR_X, ay = TAIL_ANCHOR_Y;
  const sx = Math.max(-20, Math.min(20, -dx * 1.4));              // lateral sway, trails opposite
  const drop = TAIL_LEN + Math.max(-14, Math.min(20, -dy * 0.5)); // longer when dragging up
  const half = drop * 0.5;
  const midX = ax - sx * 0.2;                 // midpoint between the two waves, near centre
  const midY = ay + half;
  // Wave 1: anchor → midpoint, bowing toward +sx.
  const c1x = ax + sx,       c1y = ay + half * 0.45;
  const c2x = ax + sx * 0.9, c2y = ay + half * 0.85;
  // Wave 2: midpoint → tip, bowing toward -sx then curling back to +sx.
  const c3x = midX - sx,        c3y = midY + half * 0.4;
  const c4x = midX - sx * 0.9,  c4y = midY + half * 0.85;
  const endX = ax + sx * 0.4,   endY = ay + drop;
  return `M${ax} ${ay} C${c1x} ${c1y} ${c2x} ${c2y} ${midX} ${midY} C${c3x} ${c3y} ${c4x} ${c4y} ${endX} ${endY}`;
}
