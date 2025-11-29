/**
 * MERGE COMBINATOR — Landing Page JavaScript
 * Production-Grade Animations & Interactions
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    observerThreshold: 0.15,
    observerRootMargin: '0px 0px -50px 0px',
    heroDotsCount: 15,
    heroDotsAnimationDuration: 20000
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Debounce function for performance optimization
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Generate a random number between min and max
   */
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // ============================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ============================================

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-up, .stagger-children');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optionally unobserve after animation
            // observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.observerThreshold,
        rootMargin: CONFIG.observerRootMargin
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }

  // ============================================
  // HERO FLOATING DOTS
  // ============================================

  function initHeroDots() {
    const dotsContainer = document.getElementById('hero-dots');
    if (!dotsContainer) return;

    // Create floating dots
    for (let i = 0; i < CONFIG.heroDotsCount; i++) {
      createDot(dotsContainer, i);
    }
  }

  function createDot(container, index) {
    const dot = document.createElement('div');
    dot.className = 'hero__dot';

    // Random positioning and timing
    const left = random(10, 90);
    const delay = random(0, 15);
    const duration = random(15, 25);
    const size = random(2, 4);

    dot.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;

    container.appendChild(dot);

    // Restart animation when complete (continuous effect)
    dot.addEventListener('animationend', () => {
      dot.remove();
      createDot(container, index);
    });
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerOffset = 0; // Adjust if you add a sticky header
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // METRICS COUNTER ANIMATION
  // ============================================

  function initMetricsCounter() {
    const metrics = document.querySelectorAll('.metric__number');
    if (!metrics.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    metrics.forEach((metric) => observer.observe(metric));
  }

  function animateCounter(element) {
    const text = element.textContent;
    const match = text.match(/^(\d+)/);

    if (!match) return; // Skip non-numeric values like "IP"

    const target = parseInt(match[1], 10);
    const suffix = text.replace(/^\d+/, ''); // Get the suffix (like '+')
    const duration = 2000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * easeOut);

      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // ============================================
  // PIPELINE NODE ANIMATIONS (Section 3)
  // ============================================

  function initPipelineAnimations() {
    const pipeline = document.querySelector('.pipeline');
    if (!pipeline) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pipeline.classList.add('animate');
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(pipeline);
  }

  // ============================================
  // CARD HOVER EFFECTS (Enhanced)
  // ============================================

  function initCardHoverEffects() {
    const cards = document.querySelectorAll('.program-card, .ecosystem-card, .engage-card');

    cards.forEach((card) => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      });
    });
  }

  // ============================================
  // PARALLAX EFFECT FOR HERO BACKGROUND
  // ============================================

  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    const heroGrid = document.querySelector('.hero__grid');
    const heroMap = document.querySelector('.hero__map');

    if (!hero || !heroGrid) return;

    const handleScroll = debounce(() => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.3;

      if (scrolled < window.innerHeight) {
        heroGrid.style.transform = `translateY(${rate * 0.2}px)`;
        if (heroMap) {
          heroMap.style.transform = `translateY(calc(-50% + ${rate * 0.1}px))`;
        }
      }
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ============================================
  // KEYBOARD NAVIGATION ENHANCEMENTS
  // ============================================

  function initKeyboardNav() {
    // Add focus styles for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  // ============================================
  // PRELOADER (Optional)
  // ============================================

  function initPreloader() {
    // Add a brief delay to ensure smooth initial animations
    document.body.classList.add('loading');

    window.addEventListener('load', () => {
      setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
      }, 100);
    });
  }

  // ============================================
  // INITIALIZE ALL MODULES
  // ============================================

  function init() {
    // Core animations
    initScrollAnimations();
    initHeroDots();
    initSmoothScroll();
    initMetricsCounter();
    initPipelineAnimations();

    // Enhancements
    initCardHoverEffects();
    initHeroParallax();
    initKeyboardNav();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // FRAMER EXPORT HELPERS
  // ============================================

  /**
   * When porting to Framer:
   *
   * 1. SCROLL ANIMATIONS:
   *    - Use Framer's native "While in View" interactions
   *    - Set entrance: opacity 0→1, translateY 30→0
   *    - Transition: 0.6s ease
   *
   * 2. HERO DOTS:
   *    - Create a code component with this logic
   *    - Or use Framer's particle effects
   *
   * 3. COUNTER ANIMATIONS:
   *    - Use Framer's "useInView" hook with useAnimation
   *    - Or use a code override with animate() from motion
   *
   * 4. PIPELINE ANIMATIONS:
   *    - Use staggerChildren in Framer variants
   *    - staggerChildren: 0.2, delayChildren: 0.1
   *
   * 5. SMOOTH SCROLL:
   *    - Framer handles this natively for page links
   */

})();
