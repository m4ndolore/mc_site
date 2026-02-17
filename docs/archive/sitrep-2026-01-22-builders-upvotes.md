# Situation Report: 2026-01-22

**Status:** Production Ready
**Staging URL:** https://mc-site-dr4.pages.dev
**Last Deploy:** 24d5c90

---

## Completed This Session

### 1. Cleanup & Maintenance
- Removed stale worktree (`builders-directory`)
- Deleted merged branches (local + 2 remote)
- Removed 10 outdated plan documents from `docs/plans/`

### 2. Cloudflare Images Migration
- Uploaded key images to CF Images CDN:
  - `arrows.png` (148KB → 33KB optimized)
  - `pentagon.webp`, `counter_drone.webp`, `carrier.webp`
- Updated 16 HTML files to use CF Images URLs
- Images now served from `imagedelivery.net` with global CDN

### 3. Builders Directory - SigmaBlox 25-1 Filter
- Updated SigmaBlox API to expose `tulsaAttended` and `cohort` fields
- `/builders` now filters to show only companies that attended SigmaBlox 25-1
- 83 companies displayed (out of 125 total)

### 4. Upvote Feature Implementation
- **SigmaBlox API:**
  - Added `upvoteCount` field to Company model (PostgreSQL)
  - Created `POST /api/public/companies/:id/upvote` endpoint
  - Applied database migration
- **mc_site:**
  - Uses real upvote counts from API (replaces random demo numbers)
  - Click handler with optimistic UI update
  - Upvotes persist to PostgreSQL, shared across all users

---

## Current Architecture

```
mc_site (Cloudflare Pages)
├── /builders → Filters by tulsaAttended="Attended"
├── Images → CF Images CDN (imagedelivery.net)
└── API calls → api.sigmablox.com

SigmaBlox API (Cloud Run)
├── PostgreSQL (Neon) → Companies, Upvotes, Cohorts
├── /api/public/companies → Returns upvoteCount, cohort, tulsaAttended
└── /api/public/companies/:id/upvote → Increments upvoteCount
```

---

## Known Issues

### Prisma Build Issue (Non-blocking)
- Docker builds fail locally due to Prisma 6.x WASM issue on arm64
- **Workaround:** Use Google Cloud Build or build on amd64
- Last successful deploy used existing image; migrations applied manually

---

## Pending Tasks

### Immediate (Next Session)

1. **DNS Cutover**
   - Add custom domain `www.mergecombinator.com` to CF Pages project
   - Test staging one more time
   - Switch CNAME from Framer to `mc-site-dr4.pages.dev`
   - Verify CF Image Resizing works on custom domain (for SVG logos)

2. **Upvote Enhancements** (Optional)
   - Add visual feedback when upvote succeeds/fails
   - Consider rate limiting (currently no limits)
   - Track upvote analytics

### Future Work

1. **User Authentication Integration**
   - Connect upvotes to user accounts
   - Show "you upvoted this" state
   - Allow un-upvote

2. **Social Media** (parallel workstream)
   - Set up social accounts
   - Create launch content

3. **SigmaBlox /combine Page**
   - Update to use same upvote API (currently uses localStorage)
   - Sync upvote counts between mc_site and sigmablox.com

---

## Commits This Session

| Repo | Commit | Description |
|------|--------|-------------|
| mc_site | `c96c448` | chore: remove outdated documentation |
| mc_site | `e4e3d25` | feat: migrate images to Cloudflare Images |
| mc_site | `089f94e` | feat(builders): filter to show only SigmaBlox 25-1 attendees |
| mc_site | `adba9d5` | fix(builders): handle cohort objects in filter dropdown |
| mc_site | `24d5c90` | feat(builders): implement real upvote functionality |
| sigmablox | `8820702` | feat(api): expose tulsaAttended and cohort data in public API |

---

## Environment Notes

- **CF Images Account ID:** `e329d5d08803656fa4607d11cf18e033`
- **CF Images Delivery URL:** `https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/`
- **SigmaBlox DB:** Neon PostgreSQL (migrations tracked in Prisma)
