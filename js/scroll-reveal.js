/**
 * Scroll Reveal & Video Lazy Loading
 * Merge Combinator
 *
 * Uses Intersection Observer for performance-optimized
 * scroll-triggered animations and video lazy loading.
 */

(function() {
  'use strict';

  // ============================================
  // SCROLL REVEAL
  // ============================================

  const revealOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Only animate once
        revealObserver.unobserve(entry.target);
      }
    });
  }, revealOptions);

  // ============================================
  // VIDEO LAZY LOADING
  // ============================================

  const videoOptions = {
    threshold: 0,
    rootMargin: '200px 0px' // Start loading 200px before visible
  };

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;

        // Load video source if using data-src
        const source = video.querySelector('source[data-src]');
        if (source && source.dataset.src) {
          source.src = source.dataset.src;
          video.load();
        }

        // Fade out placeholder when video starts playing
        video.addEventListener('playing', () => {
          const container = video.closest('.video-bg');
          if (container) container.classList.add('video-bg--loaded');
        }, { once: true });

        // Play video when visible
        video.play().catch(() => {
          // Autoplay prevented by browser policy — placeholder stays visible
        });

        videoObserver.unobserve(video);
      }
    });
  }, videoOptions);

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    // Initialize reveal animations
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });

    // Initialize video lazy loading
    const videos = document.querySelectorAll('.video-bg__video');
    videos.forEach(video => {
      // Load data-src for above-fold videos immediately
      const source = video.querySelector('source[data-src]');
      const rect = video.getBoundingClientRect();

      if (rect.top > window.innerHeight) {
        // Below fold — lazy load via observer
        videoObserver.observe(video);
      } else {
        // Above fold — load and play immediately
        if (source && source.dataset.src) {
          source.src = source.dataset.src;
          video.load();
        }
        video.addEventListener('playing', () => {
          const container = video.closest('.video-bg');
          if (container) container.classList.add('video-bg--loaded');
        }, { once: true });
        video.play().catch(() => {});
      }
    });

  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run after any dynamic content loads
  window.addEventListener('load', () => {
    // Re-check for any elements that might have been missed
    document.querySelectorAll('.reveal:not(.revealed)').forEach(el => {
      if (!el.classList.contains('revealed')) {
        revealObserver.observe(el);
      }
    });
  });

  // ============================================
  // LINK PREFETCH ON HOVER
  // ============================================

  const prefetched = new Set();

  function prefetchLink(href) {
    if (prefetched.has(href)) return;
    if (!href.startsWith('/') && !href.startsWith(location.origin)) return;

    prefetched.add(href);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  document.addEventListener('pointerenter', (e) => {
    let el = e.target;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    if (el && el.href && !el.href.startsWith('#')) {
      prefetchLink(el.href);
    }
  }, { capture: true, passive: true });

})();
