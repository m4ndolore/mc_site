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
    // URL Configuration - Update these before launch
    urls: {
      appUrl: 'https://guild.mergecombinator.com',
      applyUrl: 'https://guild.mergecombinator.com/apply',
      loginUrl: '/access',
      combineUrl: 'https://sigmablox.com'
    },

    // Animation & UI Configuration
    observerThreshold: 0.15,
    observerRootMargin: '0px 0px -80px 0px',
    navScrollThreshold: 50,
    canvasParticleCount: 50,
    canvasConnectionDistance: 150
  };

  // ============================================
  // CLOUDFLARE IMAGE OPTIMIZATION
  // ============================================
  const CF_IMAGE_CONFIG = {
    // Domains where CF Image Resizing is available
    cfDomains: ['mergecombinator.com', 'pages.dev'],
    // Default transform options
    defaults: {
      format: 'auto',  // Auto-selects WebP/AVIF based on browser
      quality: 85,
      fit: 'contain'
    }
  };

  /**
   * Check if current domain supports CF Image Resizing
   */
  function isCFDomain() {
    const hostname = window.location.hostname;
    return CF_IMAGE_CONFIG.cfDomains.some(domain => hostname.includes(domain));
  }

  /**
   * Transform image URL to use CF Image Resizing
   * @param {string} src - Original image path
   * @param {object} options - Transform options (width, height, quality, format)
   */
  function cfImage(src, options = {}) {
    if (!isCFDomain() || !src) return src;

    // Skip if already transformed or external URL
    if (src.includes('/cdn-cgi/image/') || src.startsWith('http')) return src;

    const opts = { ...CF_IMAGE_CONFIG.defaults, ...options };
    const transforms = [];

    if (opts.format) transforms.push(`format=${opts.format}`);
    if (opts.width) transforms.push(`width=${opts.width}`);
    if (opts.height) transforms.push(`height=${opts.height}`);
    if (opts.quality) transforms.push(`quality=${opts.quality}`);
    if (opts.fit) transforms.push(`fit=${opts.fit}`);

    // Ensure src starts with /
    const cleanSrc = src.startsWith('/') ? src : `/${src}`;

    return `/cdn-cgi/image/${transforms.join(',')}${cleanSrc}`;
  }

  /**
   * Apply CF Image transforms to elements matching selector
   */
  function optimizeImages(selector, options = {}) {
    if (!isCFDomain()) return;

    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc) {
        img.setAttribute('src', cfImage(originalSrc, options));
      }
    });
  }

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
    if (!nav || document.getElementById('mc-navbar')?.dataset?.initialized) return;

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
        tabs.forEach(t => {
          t.classList.remove('platform__tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('platform__tab--active');
        tab.setAttribute('aria-selected', 'true');

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
  // HERO CANVAS (Enhanced Node Network - OSINT Style)
  // ============================================
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let nodes = [];
    let particles = [];
    let animationId;
    let mouseX = -1000;
    let mouseY = -1000;
    let time = 0;

    // Colors
    const BLUE = { r: 42, g: 127, b: 219 };
    const GREEN = { r: 93, g: 160, b: 111 };
    const CYAN = { r: 56, g: 189, b: 248 };

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    // Large hub nodes that pulse
    class Node {
      constructor(isHub = false) {
        this.isHub = isHub;
        this.reset();
      }

      reset() {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        this.x = random(50, w - 50);
        this.y = random(50, h - 50);
        this.baseRadius = this.isHub ? random(4, 8) : random(1.5, 3);
        this.radius = this.baseRadius;
        this.vx = random(-0.08, 0.08);
        this.vy = random(-0.08, 0.08);
        this.pulseOffset = random(0, Math.PI * 2);
        this.pulseSpeed = random(0.008, 0.015);
        this.color = Math.random() > 0.7 ? GREEN : (Math.random() > 0.5 ? CYAN : BLUE);
        this.opacity = this.isHub ? random(0.6, 0.9) : random(0.3, 0.6);
      }

      update() {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;

        this.x += this.vx;
        this.y += this.vy;

        // Pulse effect
        this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed + this.pulseOffset) * (this.isHub ? 2 : 0.5);

        // Soft boundary
        if (this.x < 30) this.vx += 0.01;
        if (this.x > w - 30) this.vx -= 0.01;
        if (this.y < 30) this.vy += 0.01;
        if (this.y > h - 30) this.vy -= 0.01;

        // Mouse repulsion
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200 && distance > 0) {
          const force = (200 - distance) / 200;
          this.vx -= (dx / distance) * force * 0.03;
          this.vy -= (dy / distance) * force * 0.03;
        }

        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.3) {
          this.vx = (this.vx / speed) * 0.3;
          this.vy = (this.vy / speed) * 0.3;
        }
      }

      draw() {
        const { r, g, b } = this.color;

        // Glow effect for hubs
        if (this.isHub) {
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.1})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.fill();

        // Bright center for hubs
        if (this.isHub) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.8})`;
          ctx.fill();
        }
      }
    }

    // Data stream particles
    class DataParticle {
      constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.progress = 0;
        this.speed = random(0.002, 0.006);
        this.size = random(1, 2);
        this.color = Math.random() > 0.5 ? BLUE : CYAN;
      }

      update() {
        this.progress += this.speed;
        return this.progress < 1;
      }

      draw() {
        const x = lerp(this.startNode.x, this.endNode.x, this.progress);
        const y = lerp(this.startNode.y, this.endNode.y, this.progress);
        const { r, g, b } = this.color;

        // Trail
        const trailLength = 5;
        for (let i = 0; i < trailLength; i++) {
          const tp = this.progress - (i * 0.02);
          if (tp > 0) {
            const tx = lerp(this.startNode.x, this.endNode.x, tp);
            const ty = lerp(this.startNode.y, this.endNode.y, tp);
            ctx.beginPath();
            ctx.arc(tx, ty, this.size * (1 - i / trailLength), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.8 - i * 0.15})`;
            ctx.fill();
          }
        }
      }
    }

    function createNodes() {
      nodes = [];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const area = w * h;

      // Scale density for large viewports
      const isLarge = w >= 1400;
      const hubDivisor = isLarge ? 60000 : 80000;
      const nodeDivisor = isLarge ? 9000 : 12000;

      // Hub nodes (larger, fewer)
      const hubCount = Math.max(5, Math.floor(area / hubDivisor));
      for (let i = 0; i < hubCount; i++) {
        nodes.push(new Node(true));
      }

      // Regular nodes
      const nodeCount = Math.max(30, Math.floor(area / nodeDivisor));
      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node(false));
      }
    }

    function drawConnections() {
      const connectionDist = 180;
      const hubConnectionDist = 280;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = (nodes[i].isHub || nodes[j].isHub) ? hubConnectionDist : connectionDist;

          if (distance < maxDist) {
            const opacity = (1 - distance / maxDist) * (nodes[i].isHub || nodes[j].isHub ? 0.2 : 0.08);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(42, 127, 219, ${opacity})`;
            ctx.lineWidth = nodes[i].isHub && nodes[j].isHub ? 1.5 : 0.5;
            ctx.stroke();

            // Occasionally spawn data particles
            if (Math.random() < 0.002 && particles.length < 30) {
              particles.push(new DataParticle(nodes[i], nodes[j]));
            }
          }
        }
      }
    }

    function drawGrid() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const gridSize = 60;

      ctx.strokeStyle = 'rgba(42, 127, 219, 0.03)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function drawScanline() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const scanY = (time * 0.15) % (h + 100) - 50;

      const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
      gradient.addColorStop(0, 'rgba(42, 127, 219, 0)');
      gradient.addColorStop(0.5, 'rgba(42, 127, 219, 0.03)');
      gradient.addColorStop(1, 'rgba(42, 127, 219, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 50, w, 100);
    }

    function animate() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);
      time++;

      // Background elements
      drawGrid();
      drawScanline();

      // Update and draw connections
      drawConnections();

      // Update and draw nodes
      nodes.forEach(node => {
        node.update();
        node.draw();
      });

      // Update and draw data particles
      particles = particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw();
        return alive;
      });

      animationId = requestAnimationFrame(animate);
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouseX = -1000;
      mouseY = -1000;
    }

    function handleResize() {
      resizeCanvas();
      createNodes();
    }

    // Initialize
    resizeCanvas();
    createNodes();
    animate();

    // Event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
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
    const heroCanvas = document.querySelector('.hero__canvas');

    if (!heroGrid) return;

    let ticking = false;

    function updateParallax() {
      const scrolled = window.pageYOffset;

      if (scrolled < window.innerHeight) {
        const rate = scrolled * 0.25;
        heroGrid.style.transform = `translateY(${rate}px)`;
        if (heroGradient) {
          heroGradient.style.transform = `translateY(${rate * 0.5}px)`;
        }
        if (heroCanvas) {
          heroCanvas.style.opacity = Math.max(0.3, 0.75 - scrolled / window.innerHeight * 0.45);
        }
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // MOBILE MENU TOGGLE
  // ============================================
  function initMobileMenu() {
    if (document.getElementById('mc-navbar')?.dataset?.initialized) return;
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.querySelector('.nav__menu');

    if (!toggle || !menu) return;

    const closeDropdowns = () => {
      document.querySelectorAll('.nav__dropdown.active').forEach((dropdown) => {
        dropdown.classList.remove('active');
        const trigger = dropdown.querySelector('.nav__dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    const setMenuState = (isOpen) => {
      toggle.classList.toggle('active', isOpen);
      menu.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeDropdowns();
    };

    const isOpen = () => toggle.classList.contains('active');

    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      setMenuState(!isOpen());
    });

    menu.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      setMenuState(false);
    });

    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      const target = event.target;
      if (menu.contains(target) || toggle.contains(target)) return;
      setMenuState(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!isOpen()) return;
      setMenuState(false);
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 1024 && isOpen()) {
        setMenuState(false);
      }
    }, 150));
  }

  // ============================================
  // DROPDOWN MENU (Mobile)
  // ============================================
  function initDropdownMenu() {
    if (document.getElementById('mc-navbar')?.dataset?.initialized) return;
    const dropdowns = document.querySelectorAll('.nav__dropdown');

    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.nav__dropdown-trigger');
      if (!trigger) return;

      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', (e) => {
        // Only handle click on mobile (when dropdown menu is not hover-based)
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          dropdown.classList.toggle('active');
          const expanded = dropdown.classList.contains('active');
          trigger.setAttribute('aria-expanded', String(expanded));
        }
      });
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
  // UPDATE CTA LINKS
  // ============================================
  function updateCTALinks() {
    // Update "Build With Us" buttons to apply URL
    const buildWithUsButtons = document.querySelectorAll('a[href="#engage"]');
    buildWithUsButtons.forEach(btn => {
      if (btn.textContent.trim().includes('Build With Us') ||
          btn.textContent.trim().includes('Build with us')) {
        btn.href = CONFIG.urls.applyUrl;
      }
    });

    // Update "The Combine" and "SigmaBlox" links
    const combineLinks = document.querySelectorAll('a');
    combineLinks.forEach(link => {
      const text = link.textContent.trim();
      if (text === 'Learn About The Combine' ||
          text === 'The Combine' ||
          text === 'Learn More') {
        // Only update if it's not already linking somewhere specific
        if (link.getAttribute('href') === '#') {
          link.href = CONFIG.urls.combineUrl;
        }
      }
    });
  }

  // ============================================
  // SECTION CANVASES (Mission & CTA)
  // ============================================
  function initSectionCanvases() {
    const canvasIds = ['mission-canvas', 'cta-canvas'];

    canvasIds.forEach(id => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let nodes = [];
      let animationId;
      let time = 0;
      let isVisible = false;

      const BLUE = { r: 42, g: 127, b: 219 };
      const GREEN = { r: 93, g: 160, b: 111 };

      function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      class Node {
        constructor() {
          this.reset();
        }

        reset() {
          const w = canvas.offsetWidth;
          const h = canvas.offsetHeight;
          this.x = random(20, w - 20);
          this.y = random(20, h - 20);
          this.radius = random(1, 3);
          this.vx = random(-0.06, 0.06);
          this.vy = random(-0.06, 0.06);
          this.pulseOffset = random(0, Math.PI * 2);
          this.color = Math.random() > 0.7 ? GREEN : BLUE;
          this.opacity = random(0.2, 0.4);
        }

        update() {
          const w = canvas.offsetWidth;
          const h = canvas.offsetHeight;

          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 10) this.vx += 0.01;
          if (this.x > w - 10) this.vx -= 0.01;
          if (this.y < 10) this.vy += 0.01;
          if (this.y > h - 10) this.vy -= 0.01;

          this.vx *= 0.99;
          this.vy *= 0.99;
        }

        draw() {
          const { r, g, b } = this.color;
          const pulse = 1 + Math.sin(time * 0.012 + this.pulseOffset) * 0.2;

          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
          ctx.fill();
        }
      }

      function createNodes() {
        nodes = [];
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        const count = Math.max(15, Math.floor((w * h) / 20000));

        for (let i = 0; i < count; i++) {
          nodes.push(new Node());
        }
      }

      function drawConnections() {
        const maxDist = 150;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDist) {
              const opacity = (1 - distance / maxDist) * 0.12;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(42, 127, 219, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      function animate() {
        if (!isVisible) return;

        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;

        ctx.clearRect(0, 0, w, h);
        time++;

        drawConnections();
        nodes.forEach(node => {
          node.update();
          node.draw();
        });

        animationId = requestAnimationFrame(animate);
      }

      function handleResize() {
        resizeCanvas();
        createNodes();
      }

      // Intersection observer to only animate when visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationId) {
            animate();
          } else if (!isVisible && animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
        });
      }, { threshold: 0.1 });

      // Initialize
      resizeCanvas();
      createNodes();
      observer.observe(canvas);
      window.addEventListener('resize', debounce(handleResize, 200));
    });
  }

  // ============================================
  // INITIALIZE ALL MODULES
  // ============================================
  function init() {
    // Update CTA links with configured URLs
    updateCTALinks();

    // Core functionality
    initNavigation();
    initPlatformTabs();
    initScrollAnimations();
    initSmoothScroll();
    initMobileMenu();
    initDropdownMenu();

    // Visual enhancements
    initHeroCanvas();
    initSectionCanvases();
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

    // CF Image Optimization - convert SVG logos to optimized WebP
    optimizeImages('.logo-marquee__item img', { width: 200, format: 'auto' });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
