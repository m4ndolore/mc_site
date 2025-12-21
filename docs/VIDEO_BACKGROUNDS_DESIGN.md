# Video Backgrounds & Scroll Reveal Design

## Overview

Implementation design for background videos and scroll reveal animations on the Merge Combinator website.

**Date**: 2024-12-21
**Status**: Approved for implementation

---

## Features

### 1. Background Videos

**Sections with video:**
- Hero section ("Build What Warfighters Need")
- Mission section ("Our national security demands better technology")
- Final CTA section ("Build what warfighters need")

**Visual treatment:**
- Dark overlay (70-75% opacity)
- Subtle blur (2px)
- Optional blue tint via mix-blend-mode
- Desaturated, moody color grade

**Video content:**
- AI-generated via Runway/Pika/Kling
- Indo-Pacific warfighter focused
- See `AI_VIDEO_GENERATION_GUIDE.md` for creation instructions

### 2. Scroll Reveal Animations

**Style**: Fade up
- Elements start invisible, shifted 40px down
- Animate to visible + original position on viewport entry
- 0.8s duration with cubic-bezier easing
- Staggered delays for child elements

**Trigger**: Intersection Observer API (performance-optimized)

---

## Technical Implementation

### HTML Structure

```html
<!-- Video background container -->
<section class="hero">
  <div class="video-bg">
    <video class="video-bg__video" autoplay muted loop playsinline>
      <source src="assets/videos/hero-carrier-ops.mp4" type="video/mp4">
    </video>
    <div class="video-bg__overlay"></div>
    <div class="video-bg__tint"></div>
  </div>

  <div class="container hero__content">
    <!-- Content with reveal classes -->
    <h1 class="reveal">Build What Warfighters Need.</h1>
  </div>
</section>
```

### CSS

```css
/* Video Background */
.video-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.video-bg__video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
  object-fit: cover;
  filter: blur(2px) saturate(0.6) brightness(0.8);
}

.video-bg__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    rgba(11, 14, 17, 0.7),
    rgba(11, 14, 17, 0.8)
  );
}

.video-bg__tint {
  position: absolute;
  inset: 0;
  background: rgba(42, 127, 219, 0.1);
  mix-blend-mode: overlay;
}

/* Scroll Reveal */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

.reveal-stagger > .reveal:nth-child(1) { transition-delay: 0s; }
.reveal-stagger > .reveal:nth-child(2) { transition-delay: 0.1s; }
.reveal-stagger > .reveal:nth-child(3) { transition-delay: 0.2s; }
.reveal-stagger > .reveal:nth-child(4) { transition-delay: 0.3s; }
.reveal-stagger > .reveal:nth-child(5) { transition-delay: 0.4s; }
.reveal-stagger > .reveal:nth-child(6) { transition-delay: 0.5s; }
```

### JavaScript

```javascript
// scroll-reveal.js
(function() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  });

  // Lazy load videos below fold
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.load();
        }
        videoObserver.unobserve(video);
      }
    });
  }, { rootMargin: '200px' });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('video[data-src]').forEach(video => {
      videoObserver.observe(video);
    });
  });
})();
```

---

## File Structure

```
/assets/
  /videos/
    hero-carrier-ops.mp4
    mission-tactical.mp4
    cta-deployment.mp4
    placeholder.mp4          # Temporary gradient video

/js/
  scroll-reveal.js

/styles.css                   # Add video-bg and reveal styles
/index.html                   # Add video containers + reveal classes
```

---

## Implementation Steps

1. **Add CSS** - Video background and reveal animation styles
2. **Add JavaScript** - Scroll reveal with Intersection Observer
3. **Update Hero HTML** - Add video container, reveal classes
4. **Test with placeholder** - Use gradient/color placeholder video
5. **Update Mission section** - Add video background
6. **Update CTA section** - Add video background
7. **Generate real videos** - Using AI_VIDEO_GENERATION_GUIDE.md
8. **Replace placeholders** - Swap in real video files
9. **Performance test** - Verify mobile performance, file sizes

---

## Performance Considerations

- Videos lazy-loaded below fold
- Compressed to 2-4MB each
- `playsinline` + `muted` for mobile autoplay
- Blur filter reduces need for high resolution
- No audio tracks (smaller files)
- Consider `prefers-reduced-motion` media query

---

## Browser Support

- Video autoplay: All modern browsers (with muted)
- Intersection Observer: 95%+ browser support
- CSS filters: 97%+ browser support
- Fallback: Gradient background if video fails to load

---

*Approved for implementation with placeholder videos.*
