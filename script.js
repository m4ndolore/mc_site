/**
 * MERGE COMBINATOR — Landing Page JavaScript
 * Palantir-Inspired Production-Grade Interactions
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    observerThreshold: 0.15,
    observerRootMargin: '0px 0px -80px 0px',
    navScrollThreshold: 50,
    canvasParticleCount: 50,
    canvasConnectionDistance: 150
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
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

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // ============================================
  // NAVIGATION
  // ============================================
  function initNavigation() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let lastScroll = 0;

    const handleScroll = () => {
      const currentScroll = window.pageYOffset;

      // Add/remove scrolled class for background
      if (currentScroll > CONFIG.navScrollThreshold) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }

      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
  }

  // ============================================
  // PLATFORM TABS
  // ============================================
  function initPlatformTabs() {
    const tabs = document.querySelectorAll('.platform__tab');
    const panels = document.querySelectorAll('.platform__panel');

    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        // Update tabs
        tabs.forEach(t => t.classList.remove('platform__tab--active'));
        tab.classList.add('platform__tab--active');

        // Update panels
        panels.forEach(panel => {
          panel.classList.remove('platform__panel--active');
          if (panel.id === `panel-${targetId}`) {
            panel.classList.add('platform__panel--active');
          }
        });
      });
    });
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
  // HERO CANVAS (Particle Network)
  // ============================================
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouseX = 0;
    let mouseY = 0;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = random(0, canvas.width);
        this.y = random(0, canvas.height);
        this.vx = random(-0.3, 0.3);
        this.vy = random(-0.3, 0.3);
        this.radius = random(1, 2);
        this.opacity = random(0.2, 0.5);
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Boundary check
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.vx -= (dx / distance) * force * 0.02;
          this.vy -= (dy / distance) * force * 0.02;
        }

        // Limit velocity
        const maxSpeed = 1;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(42, 127, 219, ${this.opacity})`;
        ctx.fill();
      }
    }

    function createParticles() {
      particles = [];
      const count = Math.min(CONFIG.canvasParticleCount, Math.floor(canvas.width * canvas.height / 15000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.canvasConnectionDistance) {
            const opacity = (1 - distance / CONFIG.canvasConnectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(42, 127, 219, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      drawConnections();
      animationId = requestAnimationFrame(animate);
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function handleResize() {
      resizeCanvas();
      createParticles();
    }

    // Initialize
    resizeCanvas();
    createParticles();
    animate();

    // Event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', debounce(handleResize, 200));

    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }

  // ============================================
  // SMOOTH SCROLL
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const navHeight = 72; // var(--nav-height)
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;

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
    const metrics = document.querySelectorAll('.hero__stat-number, .bento-card__metric, .why-merge__stat-value');
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

    if (!match) return; // Skip non-numeric values

    const target = parseInt(match[1], 10);
    const suffix = text.replace(/^\d+/, '');
    const duration = 2000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
  // PROGRESS BAR ANIMATION
  // ============================================
  function initProgressBars() {
    const bars = document.querySelectorAll('.why-merge__stat-bar-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animation = 'fillBar 2s ease forwards';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    bars.forEach((bar) => {
      bar.style.width = '0';
      observer.observe(bar);
    });
  }

  // ============================================
  // PIPELINE ANIMATION
  // ============================================
  function initPipelineAnimations() {
    const stages = document.querySelectorAll('.pipeline-stage');
    if (!stages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * 200);
          }
        });
      },
      { threshold: 0.3 }
    );

    stages.forEach((stage) => observer.observe(stage));
  }

  // ============================================
  // CARD HOVER EFFECTS
  // ============================================
  function initCardHoverEffects() {
    const cards = document.querySelectorAll('.bento-card, .capability-card, .testimonial-card, .engage-card');

    cards.forEach((card) => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });
  }

  // ============================================
  // HERO PARALLAX
  // ============================================
  function initHeroParallax() {
    const heroGrid = document.querySelector('.hero__grid');
    const heroGradient = document.querySelector('.hero__gradient');

    if (!heroGrid) return;

    const handleScroll = debounce(() => {
      const scrolled = window.pageYOffset;

      if (scrolled < window.innerHeight) {
        const rate = scrolled * 0.15;
        heroGrid.style.transform = `translateY(${rate}px)`;
        if (heroGradient) {
          heroGradient.style.transform = `translateY(${rate * 0.5}px)`;
        }
      }
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ============================================
  // MOBILE MENU TOGGLE
  // ============================================
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.querySelector('.nav__menu');

    if (!toggle || !menu) return;

    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');

      const expanded = toggle.classList.contains('active');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  function initKeyboardNav() {
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
  // LOGO MARQUEE PAUSE ON HOVER
  // ============================================
  function initLogoMarquee() {
    const marquee = document.querySelector('.logo-marquee');
    const track = document.querySelector('.logo-marquee__track');

    if (!marquee || !track) return;

    marquee.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });

    marquee.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  // ============================================
  // SVG LINE DRAW ANIMATION
  // ============================================
  function initSVGAnimations() {
    const flowLines = document.querySelectorAll('.hero__flow-line');

    if (!flowLines.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            flowLines.forEach((line, index) => {
              line.style.animationDelay = `${index * 0.3}s`;
              line.style.animationPlayState = 'running';
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const heroFlow = document.querySelector('.hero__flow');
    if (heroFlow) {
      observer.observe(heroFlow);
    }
  }

  // ============================================
  // SCROLL TO TOP ON LOGO CLICK
  // ============================================
  function initScrollToTop() {
    const logos = document.querySelectorAll('.nav__logo, .footer__logo');

    logos.forEach(logo => {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // INITIALIZE ALL MODULES
  // ============================================
  function init() {
    // Core functionality
    initNavigation();
    initPlatformTabs();
    initScrollAnimations();
    initSmoothScroll();
    initMobileMenu();

    // Visual enhancements
    initHeroCanvas();
    initMetricsCounter();
    initProgressBars();
    initPipelineAnimations();
    initSVGAnimations();

    // UX improvements
    initCardHoverEffects();
    initHeroParallax();
    initLogoMarquee();
    initKeyboardNav();
    initScrollToTop();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
