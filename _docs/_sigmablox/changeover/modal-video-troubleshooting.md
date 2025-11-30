# Company Modal Video Not Loading - Troubleshooting Guide

**Date:** 2025-11-22
**Status:** 🔴 CRITICAL - Videos not displaying on Cohorts and My Company pages
**Working:** ✅ My-Notes page shows videos correctly

---

## Current Situation

### What Works ✅
- **My-Notes page** (`page-my-notes.hbs`):
  - Modal opens successfully
  - Videos display full-width with auto-play
  - Auto-play preference system works
  - All functionality as expected

### What Doesn't Work ❌
- **Cohorts page** (`custom-cohorts.hbs`):
  - Modal opens but NO video displays
  - Missing video section entirely

- **My Company page** (`custom-my-company.hbs`):
  - Modal opens but NO video displays
  - Missing video section entirely

### Visual Differences Observed
- **My-Notes**: Video section appears prominently at top of modal
- **Cohorts**: No video section, different favorites button placement
- **My Company**: No video section, dual close buttons (reported by user)

---

## What We've Done So Far

### 1. ✅ API Backend (WORKING)
**File:** `webhook/local-server.js`

- **Endpoint:** `/api/company/details` (lines 4302-4355)
  - Returns company data with video payload
  - Adds `videoUrl`, `videoProvider`, `videoStreamUid`, `videoAccess`
  - Uses `buildCompanyVideoPayload()` function (lines 171-217)
  - Maps companies to Cloudflare Stream videos correctly

**Verification:**
```bash
# Test API endpoint
curl -X GET "http://localhost:2000/api/company/details?companyId=COMPANY_ID" \
  -H "Accept: application/json" \
  --cookie "ghost-members-ssr=YOUR_COOKIE"
```

Expected response includes:
```json
{
  "company": {
    "videoUrl": "https://iframe.cloudflarestream.com/[UID]?...",
    "videoProvider": "cloudflare",
    "videoStreamUid": "...",
    "videoAccess": {
      "enabled": true,
      "allowed": true,
      "shareLevel": "limited"
    }
  }
}
```

### 2. ✅ Modal HTML Structure (CONSISTENT)
**File:** `partials/company-modals.hbs`

All three pages include the same shared partial:
- `custom-cohorts.hbs` line 1405: `{{> company-modals }}`
- `custom-my-company.hbs` line 55: `{{> company-modals }}`
- `page-my-notes.hbs` line 116: `{{> company-modals }}`

### 3. ✅ Global JavaScript (UNIFIED)
**File:** `assets/js/company-modal-global.js`

All three pages load the same JavaScript file:
- `custom-cohorts.hbs` line ~1411
- `custom-my-company.hbs` line ~65
- `page-my-notes.hbs` line ~128

**Key Functions:**
- `fetchCompanyVideoMeta()` (lines 637-656) - Transforms video data
- `buildModalVideoSection()` (lines 684-763) - Renders video HTML
- `initializeModalVideoToggles()` (lines 768-833) - Attaches handlers
- `renderModal()` (lines 1024-1468) - Main rendering function

### 4. ✅ Removed Duplicate Code
**File:** `custom-cohorts.hbs`

Removed all duplicate modal functions (lines 2825-2829):
- `fetchCompanyVideoMeta` - DELETED
- `buildModalVideoSection` - DELETED
- `initializeModalVideoToggles` - DELETED
- `resetModalVideos` - DELETED
- `closeCompanyModal` - DELETED
- `closeModalOnOverlay` - DELETED

---

## Problem Diagnosis

### Hypothesis 1: JavaScript Load Order
**Likelihood:** 🟡 Medium

**Issue:** `company-modal-global.js` may load before `auth-service.js` or other dependencies.

**Check:**
1. Open browser DevTools → Network tab
2. Filter by JS files
3. Verify load order:
   ```
   auth-service.js (must load first)
   ↓
   company-modal-global.js
   ```

**Fix if needed:**
```html
<!-- In page template -->
<script src="{{asset "js/auth-service.js"}}"></script>
<script src="{{asset "js/company-modal-global.js"}}"></script>
```

---

### Hypothesis 2: Company Data Missing Video Fields
**Likelihood:** 🔴 High

**Issue:** When modal opens on Cohorts/My Company, company data may not include video fields.

**Check Console:**
```javascript
// Add to company-modal-global.js line 1417 (in renderModal function)
console.log('🎥 Video Debug:', {
    hasVideoUrl: !!company.videoUrl,
    hasVideoProvider: !!company.videoProvider,
    videoUrl: company.videoUrl,
    videoProvider: company.videoProvider,
    videoAccess: company.videoAccess
});
```

**Expected Output:**
```
🎥 Video Debug: {
  hasVideoUrl: true,
  hasVideoProvider: true,
  videoUrl: "https://iframe.cloudflarestream.com/...",
  videoProvider: "cloudflare",
  videoAccess: { enabled: true, allowed: true, ... }
}
```

**If FALSE:** Company data is not being fetched from API or video fields are missing.

---

### Hypothesis 3: Data Source Discrepancy
**Likelihood:** 🔴 High

**Issue:** Different pages may be using different data sources for company objects.

**Possible Sources:**
1. ✅ **API Call** - `fetchCompanyDataFromApi()` (My-Notes uses this)
   - Calls `/api/company/details`
   - Returns full company data WITH video fields

2. ❌ **Cohort Manager Cache** - `findCompanyInCohorts()` (Cohorts may use this)
   - Uses pre-loaded `window.cohortManager.allCompanies`
   - May NOT have video fields (depends on initial load)

3. ❌ **Inline Page Data** - `options.companyData` (My Company may use this)
   - Passed from page context
   - May NOT include video fields

**Check in `resolveCompanyData()` (lines 172-195):**
```javascript
async function resolveCompanyData(airtableId, options = {}) {
    // 1. Check if passed directly
    if (options.companyData) {
        console.log('📦 Using passed company data:', options.companyData);
        return cacheCompanyData(airtableId, options.companyData);
    }

    // 2. Check cache
    if (companyDataCache.has(airtableId)) {
        console.log('💾 Using cached company data');
        return companyDataCache.get(airtableId);
    }

    // 3. Check window.companiesData
    if (window.companiesData[airtableId]) {
        console.log('🪟 Using window.companiesData');
        return cacheCompanyData(airtableId, window.companiesData[airtableId]);
    }

    // 4. Check cohort manager (MAY NOT HAVE VIDEO)
    const cohortCompany = findCompanyInCohorts(airtableId);
    if (cohortCompany) {
        console.log('🎯 Using cohort manager data:', cohortCompany);
        return cacheCompanyData(airtableId, cohortCompany);
    }

    // 5. Fetch from API (ALWAYS HAS VIDEO)
    console.log('🌐 Fetching from API');
    return fetchCompanyDataFromApi(airtableId);
}
```

**Problem:** Steps 2-4 may return company data WITHOUT video fields!

---

### Hypothesis 4: Initial Cohort Data Missing Video
**Likelihood:** 🔴 High

**Issue:** Cohorts page loads company list via `/api/cohorts` which may not include video data.

**Check:**
1. Open Cohorts page
2. Open DevTools → Network tab
3. Find `/api/cohorts` request
4. Check response - do companies have `videoUrl`, `videoProvider` fields?

**If NO:** The cohort endpoint needs to include video data.

**Fix Options:**

**Option A - Force API Fetch for Modal:**
```javascript
// In showCompanyModal() line 1383
const company = await fetchCompanyDataFromApi(airtableId); // Always use API
```

**Option B - Add Video to Cohort Endpoint:**
```javascript
// In webhook/local-server.js cohorts endpoint
participants.forEach(p => {
  const { video, videoAccess } = buildCompanyVideoPayload(p, memberRole);
  if (video) {
    p.videoUrl = video.embedUrl;
    p.videoProvider = video.provider;
    p.videoStreamUid = video.streamUid || video.vimeoId;
  }
  p.videoAccess = videoAccess;
});
```

---

### Hypothesis 5: Modal Rendering Logic Issue
**Likelihood:** 🟡 Medium

**Issue:** The video section HTML may not be inserted into the DOM correctly.

**Check in `renderModal()` around line 1189:**
```javascript
const videoMetadata = await fetchCompanyVideoMeta(company);
console.log('🎬 Video Metadata:', videoMetadata);

const videoSectionHtml = buildModalVideoSection(videoMetadata, company);
console.log('📝 Video Section HTML:', videoSectionHtml);
```

**Expected:**
```
🎬 Video Metadata: {
  video: { embedUrl: "...", provider: "cloudflare", ... },
  videoAccess: { enabled: true, allowed: true, ... }
}

📝 Video Section HTML: "<div class="modal-section modal-video-section">..."
```

**If Empty String:** Video section is not being built.

---

## Recommended Fix Strategy

### Step 1: Add Debugging (Immediate)
Add console logs to identify WHERE the problem occurs:

```javascript
// In company-modal-global.js, add these logs:

// Line 1383 - showCompanyModal()
console.log('🔵 Opening modal for company:', airtableId);

// Line 1409 - After resolveCompanyData
console.log('✅ Company resolved:', {
  name: company?.companyName,
  hasVideoUrl: !!company?.videoUrl,
  hasVideoProvider: !!company?.videoProvider,
  videoData: {
    videoUrl: company?.videoUrl,
    videoProvider: company?.videoProvider,
    videoAccess: company?.videoAccess
  }
});

// Line 1134 - renderModal before video
const videoMetadata = await fetchCompanyVideoMeta(company);
console.log('🎬 Video Metadata Result:', videoMetadata);

const videoSectionHtml = buildModalVideoSection(videoMetadata, company);
console.log('📝 Video Section HTML Length:', videoSectionHtml?.length || 0);
console.log('📝 Video Section HTML:', videoSectionHtml);
```

### Step 2: Force API Fetch (Quick Fix)
**File:** `assets/js/company-modal-global.js` line 1409

Change:
```javascript
const company = await resolveCompanyData(airtableId, options);
```

To:
```javascript
// ALWAYS fetch from API to ensure video data is present
const company = await fetchCompanyDataFromApi(airtableId);
```

This bypasses cache and cohort manager data, forcing fresh data with video fields.

### Step 3: Update Cohorts Endpoint (Long-term Fix)
**File:** `webhook/local-server.js`

Find the `/api/cohorts` endpoint and add video data to each participant:

```javascript
// After building participant data
const { video, videoAccess } = buildCompanyVideoPayload(participant, memberRole);
if (video) {
  participant.videoUrl = video.embedUrl;
  participant.videoProvider = video.provider;
  participant.videoStreamUid = video.streamUid || video.vimeoId;
}
participant.videoAccess = videoAccess;
```

This ensures cohort data includes video from the start.

### Step 4: Update My Company Endpoint
Check how My Company page loads its data and ensure video fields are included.

---

## Testing Checklist

After implementing fixes:

- [ ] **Cohorts Page:**
  - [ ] Open modal for any company
  - [ ] Verify video appears full-width at top
  - [ ] Verify auto-play starts
  - [ ] Check browser console for errors

- [ ] **My Company Page:**
  - [ ] Open own company modal
  - [ ] Verify video appears
  - [ ] Verify edit functionality still works

- [ ] **My-Notes Page:**
  - [ ] Verify video still works (regression test)
  - [ ] Check auto-play preference persists

- [ ] **Cross-Page Consistency:**
  - [ ] All three pages show identical modal structure
  - [ ] All three pages have same favorites button placement
  - [ ] All three pages have single close X button

---

## Browser Console Commands

Useful commands to run in browser DevTools:

```javascript
// Check if company data has video
console.log(window.companiesData);

// Check cohort manager data
console.log(window.cohortManager?.allCompanies?.map(c => ({
  name: c.companyName,
  hasVideo: !!c.videoUrl
})));

// Check auto-play preference
console.log('Auto-play enabled:', localStorage.getItem('sigmablox_video_autoplay'));

// Force enable auto-play
localStorage.setItem('sigmablox_video_autoplay', 'true');

// Check if modal rendering functions exist
console.log({
  fetchCompanyVideoMeta: typeof window.companyModalShared?.fetchCompanyData,
  showCompanyModal: typeof window.showCompanyModal,
  closeCompanyModal: typeof window.closeCompanyModal
});
```

---

## Next Steps

1. **Immediate:** Add debug console logs to identify exact failure point
2. **Quick Fix:** Force API fetch in `showCompanyModal()`
3. **Long-term:** Ensure all data sources include video fields
4. **Test:** Verify all three pages show videos identically
5. **Cleanup:** Remove debug logs once issue is resolved

---

## Contact & Updates

- **Last Updated:** 2025-11-22
- **Issue Tracker:** Monitor browser console on Cohorts and My Company pages
- **Success Criteria:** All three pages show full-width auto-playing videos identically
