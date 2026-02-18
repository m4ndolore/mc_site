# REQ-UX-009: Video Backgrounds for Hero/Mission/CTA Sections

## Status: BACKLOG

## Requirement
Add AI-generated background videos to three homepage sections: Hero, Mission, and Final CTA. Videos should be cinematic, Indo-Pacific warfighter themed, with dark overlays and subtle blur. Scroll-reveal animations already implemented.

## Acceptance Criteria
1. [x] Hero section has video background container with lazy loading
2. [x] Mission section has video background container with lazy loading
3. [x] Final CTA section has video background container with lazy loading
4. [ ] Videos are < 4MB each, lazy-loaded below fold — **awaiting video files**
5. [x] Dark overlay (70-75% opacity) preserves text readability
6. [x] `prefers-reduced-motion` respected (video hidden, static placeholder shown)
7. [x] Mobile: video disabled via CSS media query (placeholder gradient shown)

## Implementation Complete
- HTML: `<div class="video-bg">` containers added to all 3 sections in `index.html`
- CSS: Full `.video-bg` styles in `styles.css` (overlay, tint, placeholder, blur, mobile disable)
- JS: `scroll-reveal.js` handles lazy loading via `data-src`, fade-out placeholder on play
- Placeholder: Animated gradient fallback when videos not present
- z-index: Content layers verified above video layers in all 3 sections

## Remaining: Video Generation
Drop `.mp4` files into `assets/videos/`:
- `hero-carrier-ops.mp4` — carrier flight ops / flight deck
- `mission-tactical.mp4` — tactical operations center
- `cta-deployment.mp4` — deployment / transport aircraft

Video specs: 1280x720+, 8-12s loop, H.264, <4MB each, no audio.
See `docs/AI_VIDEO_GENERATION_GUIDE.md` for generation prompts and tools.

## Dependencies
None

## Source
- `docs/completed/VIDEO_BACKGROUNDS_DESIGN.md`
- `docs/AI_VIDEO_GENERATION_GUIDE.md`

## Effort
~1 week (video generation + integration)
