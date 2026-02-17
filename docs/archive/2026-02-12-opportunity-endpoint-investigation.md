# Opportunity Endpoint Investigation Report
**Date**: 2026-02-12
**Requirement**: REQ-BUG-007
**Status**: Investigation Complete

---

## Executive Summary

The Merge Combinator codebase has significant plans and partial implementation for an **Opportunities** aggregation platform, currently in **Phase 1** (branding integration) with detailed roadmaps for Phase 2 (comprehensive aggregation) and Phase 3 (hybrid authentication). There is **1 critical bug** blocking the current `/opportunities` endpoint from working.

---

## 1. Current State: Opportunities Endpoint

### Existing Implementation
- **Current Route**: `/opportunities` → `https://sbir.mergecombinator.com` (Railway deployment)
- **Current Status**: BROKEN - Returns HTTP 500 error when proxied
- **Origin**: `misfits_scraper` repository (separate from mc-site)
- **Current Functionality**: SBIR/STTR opportunity discovery tool with filtering and search
- **Frontend**: React + TypeScript (Vite-based, dark theme with MC branding)
- **Backend**: Node.js Express server with AI analysis engine

### Router Configuration
**File**: `cloudflare/merge-router.js` (line 210)
```javascript
{ prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true }
```

### Critical Bug (REQ-BUG-007)
- **Status**: PENDING
- **Priority**: LOW
- **Issue**: `/opportunities` returns 500 error when accessed via proxy, but `sbir.mergecombinator.com` returns 200 when accessed directly
- **Root Cause**: Likely header handling issue (X-Forwarded-* headers) at Railway origin
- **Investigation Path**:
  1. Check Railway origin logs for error details
  2. Verify header passthrough in MC Router
  3. Test with explicit Host header override
  4. Consider Railway configuration changes

---

## 2. Backend: SBIR Scraper (misfits_scraper)

**Repository Location**: `/Users/paulgarcia/Dev/misfits_scraper`

### Current API Endpoints
- `GET /api/sbir/summary` - Get SBIR opportunities summary
- `POST /api/sbir/bulk-download-enhanced` - Batch download PDFs
- `POST /api/download-pdf` - Single PDF download
- `POST /api/generate-topic-pdf` - Generate topic analysis PDF
- `GET /health` - Health check
- `GET /api/health` - API health check

### AI Analysis Routes
- `POST /api/analyze-opportunities` - Batch analysis
- `POST /api/match-opportunities` - Score against profiles
- `POST /api/analyze-single` - Individual opportunity analysis
- `POST /api/market-insights` - Generate market intelligence
- `GET /api/analysis-status` - Health check

### Current Server Configuration
- **Port**: 3001 (default) or environment `PORT` variable
- **Frontend Path**: `frontend/dist` (Vite-built React app)
- **CORS**: Enabled for localhost:5173/5174 (development only)

### Data Source (Current)
- **Primary**: DoD SBIR.gov - queries `https://www.dodsbirsttr.mil/topics/api/public/topics/search`
- **Method**: Web scraping with Playwright + browser automation

---

## 3. Phase Roadmap

### Phase 1: SBIR Quick Polish (COMPLETED)
**Objective**: Make sbir.mergecombinator.com look like part of MC without touching internals.

**Changes Made** (in misfits_scraper/frontend):
- `MCHeader.tsx` - Slim header with MC logo + "Opportunities" title
- `MCFooter.tsx` - Footer with MC branding + nav links
- `mc-branding.css` - MC design tokens (colors, fonts)

**Status**: DEPLOYED (Jan 26, 2026)

### Phase 2: Opportunities Frontend in MC-Site (FUTURE)
**Objective**: Replace SBIR-only tool with comprehensive Opportunities aggregation platform

#### Data Sources to Aggregate
1. **SBIR/STTR** (existing scraper)
2. **SAM.gov** contracts
3. **Grants.gov**
4. **DIU CSO** (Defense Innovation Unit)
5. **AFWERX challenges**
6. Other DoD opportunities

#### Architecture
- **Frontend**: mc-site (Vite + vanilla JS or React migration)
- **API**: `api.mergecombinator.com/opportunities` (future)
- **Scrapers**: Microservices feeding unified data store

### Phase 3: Builders Hybrid Auth (FUTURE)
Hybrid auth pattern applied to `/builders` page with public browse + authenticated engagement.

---

## 4. Related Infrastructure Requirements

| Req ID | Category | Status | Notes |
|--------|----------|--------|-------|
| REQ-BUG-007 | Bugs | PENDING | `/opportunities` 500 error |
| REQ-INFRA-001 | Infrastructure | PENDING | Create api.mergecombinator.com |
| REQ-INFRA-003 | Infrastructure | PARTIAL | Router restructuring, DNS blocked |

---

## 5. Test URLs

| Endpoint | URL | Status |
|----------|-----|--------|
| MC Home | `https://www.mergecombinator.com` | ✓ Working |
| Opportunities Page | `https://www.mergecombinator.com/opportunities` | ✗ 500 Error |
| SBIR Direct | `https://sbir.mergecombinator.com` | ✓ Working |

---

## 6. Key Files & Locations

**MC Site**:
- Planning: `docs/plans/2026-01-26-opportunities-integration-design.md`
- Router config: `cloudflare/merge-router.js` (line 210)
- Bug report: `.rtmx/requirements/BUGS/REQ-BUG-007.md`
- Current page: `opportunities.html`

**SBIR Scraper**:
- Server config: `/Users/paulgarcia/Dev/misfits_scraper/server.js`
- Backlog: `/Users/paulgarcia/Dev/misfits_scraper/BACKLOG.md`
- Frontend: `/Users/paulgarcia/Dev/misfits_scraper/frontend/`

---

## 7. Expansion Backlog (Priority Order)

### Priority 1: Core Functionality
- Download queue management with pause/resume
- Retry logic for failed downloads
- Download history with re-download options

### Priority 2: AI & Intelligence
- iME business profile API integration
- GPT-4/Claude API integration for deeper analysis
- Competitive landscape analysis
- Proposal outline generation

### Priority 3: Platform Expansion
- Integrate grants.gov opportunities
- Add BAA (Broad Agency Announcements)
- Include OTAs (Other Transaction Authorities)
- SAM.gov company data integration
- CSV/Excel export capabilities

### Priority 4: Advanced Features
- Success probability scoring
- Optimal submission timing recommendations
- Opportunity sharing via links
- Team workspaces
