/**
 * hero-waveform.js — Animated signal waveform background for the homepage hero.
 *
 * Renders layered, undulating waveform lines that evoke signal processing
 * and intelligence analysis. Uses the C2UX color palette.
 */

export function initHeroWaveform() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let time = 0;
  let scrollY = 0;

  // ── Palette (C2UX tokens) ──────────────────────
  const COLORS = [
    { r: 42, g: 127, b: 219 },   // blue (primary)
    { r: 56, g: 189, b: 248 },   // cyan
    { r: 93, g: 160, b: 111 },   // green
    { r: 42, g: 127, b: 219 },   // blue again for weight
  ];

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

  // ── Wave configuration ─────────────────────────
  // Each wave is a composite of several sine components for organic feel
  function createWaves() {
    const waves = [];
    const count = 7;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1); // 0..1
      const color = COLORS[i % COLORS.length];

      waves.push({
        // Vertical position (spread across the canvas)
        yBase: 0.25 + t * 0.5, // 25%–75% of height

        // Composite sine parameters [frequency, amplitude, phase speed]
        components: [
          { freq: 0.003 + t * 0.001,  amp: 30 + i * 8,  speed: 0.008 + t * 0.003 },
          { freq: 0.007 - t * 0.002,  amp: 15 + i * 4,  speed: 0.012 - t * 0.002 },
          { freq: 0.013 + t * 0.003,  amp: 8,            speed: 0.02  + t * 0.005 },
        ],

        // Visual
        color,
        opacity: 0.08 + (1 - Math.abs(t - 0.5) * 2) * 0.18, // brighter near center
        lineWidth: 1 + (1 - Math.abs(t - 0.5) * 2) * 1.2,   // thicker near center

        // Glow for the center wave
        glow: i === Math.floor(count / 2),
      });
    }
    return waves;
  }

  const waves = createWaves();

  // ── Compute Y for a wave at x ──────────────────
  function waveY(wave, x, t) {
    let y = wave.yBase * H;
    const scrollOffset = scrollY * 0.08;

    for (const c of wave.components) {
      y += Math.sin(x * c.freq + t * c.speed + scrollOffset * 0.01) * c.amp;
    }
    return y;
  }

  // ── Draw a single wave ─────────────────────────
  function drawWave(wave) {
    const { r, g, b } = wave.color;
    const step = 3; // px per segment (smooth enough, fast enough)

    // Main line
    ctx.beginPath();
    ctx.moveTo(0, waveY(wave, 0, time));

    for (let x = step; x <= W; x += step) {
      ctx.lineTo(x, waveY(wave, x, time));
    }

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${wave.opacity})`;
    ctx.lineWidth = wave.lineWidth;
    ctx.stroke();

    // Glow pass for center wave
    if (wave.glow) {
      ctx.beginPath();
      ctx.moveTo(0, waveY(wave, 0, time));
      for (let x = step; x <= W; x += step) {
        ctx.lineTo(x, waveY(wave, x, time));
      }
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${wave.opacity * 0.4})`;
      ctx.lineWidth = wave.lineWidth + 4;
      ctx.stroke();

      // Extra-wide faint glow
      ctx.beginPath();
      ctx.moveTo(0, waveY(wave, 0, time));
      for (let x = step; x <= W; x += step) {
        ctx.lineTo(x, waveY(wave, x, time));
      }
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${wave.opacity * 0.12})`;
      ctx.lineWidth = wave.lineWidth + 14;
      ctx.stroke();
    }
  }

  // ── Pulse marker on the center wave ────────────
  function drawPulse() {
    const center = waves[Math.floor(waves.length / 2)];
    const { r, g, b } = center.color;

    // Pulse travels left to right, looping
    const period = 6000; // ms per traversal at 60fps ≈ 360 frames
    const px = (time * 1.2) % (W + 100) - 50;
    const py = waveY(center, px, time);

    // Bright dot
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 18);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
    grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.3)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
    ctx.fill();
  }

  // ── Draw frame ─────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw waves back to front
    for (const wave of waves) {
      drawWave(wave);
    }

    drawPulse();

    // Subtle center glow
    const gx = W * 0.5;
    const gy = H * 0.5;
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.4);
    grad.addColorStop(0, 'rgba(42, 127, 219, 0.03)');
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

  // ── Scroll tracking ────────────────────────────
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
