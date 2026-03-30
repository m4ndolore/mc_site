// js/quote-carousel.js
// Single-slide quote carousel with auto-advance and prev/next navigation

export function initQuoteCarousel(rootId = 'quote-carousel') {
  const root = document.getElementById(rootId);
  if (!root) return;

  const track = root.querySelector('.quote-carousel__track');
  const slides = Array.from(track.querySelectorAll('.quote-carousel__slide'));
  const prevBtn = root.querySelector('#quote-prev');
  const nextBtn = root.querySelector('#quote-next');
  const dotsContainer = root.querySelector('#quote-dots');
  const counter = root.querySelector('#quote-counter');

  if (slides.length === 0) return;

  let current = 0;
  let autoTimer = null;
  const AUTO_INTERVAL = 8000;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'quote-carousel__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Quote ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    current = index;

    // Animate track
    track.classList.add('is-animating');
    track.style.transform = `translateX(-${current * 100}%)`;

    // Update active slide
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));

    // Update dots
    const dots = dotsContainer.querySelectorAll('.quote-carousel__dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));

    // Update counter
    if (counter) {
      counter.textContent = `${current + 1} / ${slides.length}`;
    }

    resetAuto();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function resetAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(next, AUTO_INTERVAL);
  }

  // Event listeners
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Pause on hover
  root.addEventListener('mouseenter', () => { if (autoTimer) clearInterval(autoTimer); });
  root.addEventListener('mouseleave', resetAuto);

  // Keyboard support
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Clean up animation class after transition
  track.addEventListener('transitionend', () => {
    track.classList.remove('is-animating');
  });

  // Initialize
  goTo(0);
}
