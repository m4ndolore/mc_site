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

        // Play video when visible
        video.play().catch(() => {
          // Autoplay failed (browser policy), that's ok
          console.log('Video autoplay prevented by browser');
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
      // Only lazy load videos below the fold
      const rect = video.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        videoObserver.observe(video);
      } else {
        // Video is above fold, play immediately
        video.play().catch(() => {});
      }
    });

    console.log(`Scroll reveal initialized: ${revealElements.length} elements`);
    console.log(`Video backgrounds initialized: ${videos.length} videos`);
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
    const anchor = e.target.closest('a[href]');
    if (anchor && anchor.href && !anchor.href.startsWith('#')) {
      prefetchLink(anchor.href);
    }
  }, { capture: true, passive: true });

})();
