# SITREP: MC Site Production Readiness

**Date:** 2026-01-19
**Session:** Production readiness audit and fixes
**Status:** STAGING READY - Pending DNS cutover

---

## Executive Summary

Performed full production readiness audit of mc_site (Merge Combinator marketing site). Fixed critical issues including redirect loops, broken links, and missing SEO files. Site is now deployed to staging (`mc-site-dr4.pages.dev`) and ready for DNS cutover to `www.mergecombinator.com`.

---

## Completed Tasks

### Critical Fixes
| Issue | Fix | Commit |
|-------|-----|--------|
| Redirect loops on `/builders`, `/merch` | Removed conflicting `_redirects` rules | `ca23ae0` |
| Login link broken (app.mergecombinator.com) | Changed to "Join Combine" → sigmablox.com | `ca23ae0` |
| Missing 404 page | Created `404.html` with branded design | `e7357d4` |
| Broken `archive.html` link | Added to vite config, updated nav/footer | `e7357d4` |
| Copyright year outdated | Updated 2025 → 2026 across all pages | `e7357d4` |
| Missing `robots.txt` | Created in `public/` | `e7357d4` |
| Missing `sitemap.xml` | Created in `public/` | `e7357d4` |

### CF Image Resizing
| Task | Status |
|------|--------|
| Added `cfImage()` utility to script.js | ✅ Complete |
| Auto-detects CF domains for optimization | ✅ Complete |
| Logo marquee optimization (SVG → WebP) | ✅ Code ready, will work on custom domain |

---

## Staging Test Results

**URL:** https://mc-site-dr4.pages.dev/

| Page | Status | Notes |
|------|--------|-------|
| Homepage (`/`) | ✅ Pass | Loads correctly, nav updated |
| `/builders` | ✅ Pass | No redirect loop |
| `/merch` | ✅ Pass | No redirect loop |
| `/opportunities` | ✅ Pass | Coming soon page |
| `/knowledge` | ✅ Pass | Coming soon page |
| `/archive.html` | ✅ Pass | Updated nav works |
| 404 page | ✅ Pass | Custom branded page |
| CF Image Resizing | ⚠️ Expected | 404 on pages.dev, will work on custom domain with Pro+ plan |

---

## Pending Tasks

### Immediate (Next Session)

1. **CF Images Hosting Setup**
   - User has updated `config/base.yaml` and `.env.local` with API credentials
   - Need to upload key images (arrows.png, hero images)
   - Update code to use CF Images URLs

2. **DNS Cutover (Blue/Green)**
   - Add custom domain `www.mergecombinator.com` to CF Pages project
   - Test on staging one more time
   - Switch CNAME from Framer to `mc-site-dr4.pages.dev`
   - Verify CF Image Resizing works on custom domain

### Future Work

1. **Social Media** (parallel workstream)
   - Add `og:image` meta tags
   - Twitter/X card meta tags
   - Design social share images

2. **VIA Authentication Integration**
   - Blueprints created in `/via` repo
   - Need to deploy VIA blueprints
   - Integrate NextAuth.js with MC site

3. **Performance**
   - Optimize large SVG logos (400KB+ each)
   - Consider converting to optimized PNG via CF Images

---

## Architecture Overview

```
Current State:
www.mergecombinator.com → Framer (LIVE)
mc-site-dr4.pages.dev → CF Pages (STAGING) ✅ Ready

Target State:
www.mergecombinator.com → CF Pages (mc-site-dr4)
via.mergecombinator.com → VIA/Authentik (auth)
```

---

## Key Files Changed

```
Modified:
- index.html, builders.html, merch.html, etc. (nav updates, copyright)
- script.js, public/script.js (CF Image utility)
- vite.config.js (added archive, 404)
- public/_redirects (removed conflicting rules)
- _redirects (cleaned up)

Created:
- 404.html
- public/robots.txt
- public/sitemap.xml
- docs/sitrep-2026-01-19-production-readiness.md
```

---

## Commands Reference

```bash
# Build
npm run build

# Local dev
npm run dev

# Deploy (auto on push)
git push

# Test staging
curl -sI "https://mc-site-dr4.pages.dev/builders"
```

---

## Notes for Next Session

1. User prefers API approach for CF Images upload
2. CF Images is enabled on their account
3. Credentials are in `config/base.yaml` and `.env.local`
4. Domain `www.mergecombinator.com` is managed at Cloudflare
5. Blue/green cutover approach - test fully before DNS switch
6. Social media work is a separate parallel workstream

---

**Prepared by:** Claude Opus 4.5
**Next Action:** Set up CF Images hosting via API, then DNS cutover
