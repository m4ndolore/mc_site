/**
 * hero-topo.js — Topographic contour map background for the homepage hero.
 *
 * Renders animated elevation contour lines using 2D Perlin-style noise,
 * with slow drift and subtle scroll-parallax. Uses the C2UX color palette.
 */

export function initHeroTopo() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let time = 0;
  let scrollY = 0;

  // ── Palette (C2UX tokens) ──────────────────────
  const BLUE   = { r: 42, g: 127, b: 219 };
  const GREEN  = { r: 93, g: 160, b: 111 };
  const CYAN   = { r: 56, g: 189, b: 248 };

  // ── Simplex-ish 2D noise (fast, good enough) ───
  // Permutation table
  const perm = new Uint8Array(512);
  const grad = [
    [1,1],[-1,1],[1,-1],[-1,-1],
    [1,0],[-1,0],[0,1],[0,-1],
  ];
  (function seedPerm() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function noise2d(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];

    const x1 = lerp(dot(grad[aa & 7], xf, yf),     dot(grad[ba & 7], xf - 1, yf),     u);
    const x2 = lerp(dot(grad[ab & 7], xf, yf - 1), dot(grad[bb & 7], xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function dot(g, x, y) { return g[0] * x + g[1] * y; }

  // Fractal noise — sum octaves
  function fbm(x, y, octaves) {
    let value = 0;
    let amp = 1;
    let freq = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      value += noise2d(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return value / max; // normalise to roughly [-1, 1]
  }

  // ── Canvas sizing ──────────────────────────────
  let W, H, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Contour rendering ─────────────────────────
  // We sample a grid of noise values, then use marching squares
  // to extract iso-lines at fixed elevation intervals.

  const CELL = 12;          // grid cell size in CSS px
  const CONTOUR_LEVELS = 10; // number of iso-lines
  const NOISE_SCALE = 0.0028;
  const DRIFT_SPEED = 0.00012;

  function sampleField() {
    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;
    const field = new Float32Array(cols * rows);

    const drift = time * DRIFT_SPEED;
    const scrollOffset = scrollY * 0.0003;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = c * CELL * NOISE_SCALE + drift;
        const ny = r * CELL * NOISE_SCALE + drift * 0.6 + scrollOffset;
        field[r * cols + c] = fbm(nx, ny, 4);
      }
    }
    return { field, cols, rows };
  }

  // Marching squares — extract line segments for a given threshold
  function marchContour(field, cols, rows, threshold) {
    const segments = [];

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const tl = field[r * cols + c];
        const tr = field[r * cols + c + 1];
        const br = field[(r + 1) * cols + c + 1];
        const bl = field[(r + 1) * cols + c];

        // Binary index
        let idx = 0;
        if (tl >= threshold) idx |= 8;
        if (tr >= threshold) idx |= 4;
        if (br >= threshold) idx |= 2;
        if (bl >= threshold) idx |= 1;

        if (idx === 0 || idx === 15) continue;

        const x0 = c * CELL;
        const y0 = r * CELL;

        // Interpolation helpers
        const interpX = (a, b) => {
          const t = (threshold - a) / (b - a);
          return x0 + t * CELL;
        };
        const interpY = (a, b) => {
          const t = (threshold - a) / (b - a);
          return y0 + t * CELL;
        };

        // Edge midpoints (interpolated)
        const top    = () => [interpX(tl, tr), y0];
        const right  = () => [x0 + CELL, interpY(tr, br)];
        const bottom = () => [interpX(bl, br), y0 + CELL];
        const left   = () => [x0, interpY(tl, bl)];

        // Lookup table for the 16 cases
        switch (idx) {
          case 1:  segments.push([left(), bottom()]); break;
          case 2:  segments.push([bottom(), right()]); break;
          case 3:  segments.push([left(), right()]); break;
          case 4:  segments.push([top(), right()]); break;
          case 5:  // saddle
            segments.push([left(), top()]);
            segments.push([bottom(), right()]);
            break;
          case 6:  segments.push([top(), bottom()]); break;
          case 7:  segments.push([left(), top()]); break;
          case 8:  segments.push([top(), left()]); break;
          case 9:  segments.push([top(), bottom()]); break;
          case 10: // saddle
            segments.push([top(), right()]);
            segments.push([left(), bottom()]);
            break;
          case 11: segments.push([top(), right()]); break;
          case 12: segments.push([left(), right()]); break;
          case 13: segments.push([bottom(), right()]); break;
          case 14: segments.push([left(), bottom()]); break;
        }
      }
    }
    return segments;
  }

  // ── Color per contour level ────────────────────
  function contourColor(levelIndex, totalLevels) {
    const t = levelIndex / totalLevels;

    // Blend from blue at low elevations, through cyan mid, to green at peaks
    let r, g, b;
    if (t < 0.5) {
      const s = t * 2;
      r = BLUE.r + (CYAN.r - BLUE.r) * s;
      g = BLUE.g + (CYAN.g - BLUE.g) * s;
      b = BLUE.b + (CYAN.b - BLUE.b) * s;
    } else {
      const s = (t - 0.5) * 2;
      r = CYAN.r + (GREEN.r - CYAN.r) * s;
      g = CYAN.g + (GREEN.g - CYAN.g) * s;
      b = CYAN.b + (GREEN.b - CYAN.b) * s;
    }

    // Higher contours are slightly brighter
    const opacity = 0.12 + t * 0.18;
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity})`;
  }

  // ── Draw frame ─────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const { field, cols, rows } = sampleField();

    // Determine value range for even contour spacing
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < field.length; i++) {
      if (field[i] < min) min = field[i];
      if (field[i] > max) max = field[i];
    }
    const range = max - min || 1;

    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let lev = 0; lev < CONTOUR_LEVELS; lev++) {
      const threshold = min + (range * (lev + 1)) / (CONTOUR_LEVELS + 1);
      const segments = marchContour(field, cols, rows, threshold);

      if (segments.length === 0) continue;

      ctx.strokeStyle = contourColor(lev, CONTOUR_LEVELS);
      ctx.beginPath();
      for (let i = 0; i < segments.length; i++) {
        const [[x1, y1], [x2, y2]] = segments[i];
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }

    // Subtle glow spot at center to add depth
    const gx = W * 0.35;
    const gy = H * 0.45;
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.45);
    grad.addColorStop(0, 'rgba(42, 127, 219, 0.04)');
    grad.addColorStop(1, 'rgba(42, 127, 219, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Animation loop ─────────────────────────────
  function animate() {
    time++;
    draw();
    animationId = requestAnimationFrame(animate);
  }

  // ── Scroll tracking (passive, no layout thrash)
  function onScroll() {
    scrollY = window.scrollY;
  }

  // ── Init ───────────────────────────────────────
  resize();
  animate();

  window.addEventListener('scroll', onScroll, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}
