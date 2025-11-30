# PACAF Frontend Implementation Guide

## Current Status ✅

- ✅ **Backend API**: Fully operational on port 2000
- ✅ **Database**: Seeded with 13 programs, 15 tags, SBIR keywords
- ✅ **Templates**: All 3 Handlebars templates created
- ✅ **JavaScript**: Manager object created (pacaf-hub.js)
- ✅ **Routes**: Configured in routes.yaml


**Expected Result:**
- Pages should load with the dark SigmaBlox theme
- Hub should show stats and program cards
- Matcher should show the quiz form
- Program detail shows template structure

---

## URL Structure

Once deployed, your PACAF pages will be accessible at:

```
Production URLs:
https://www.sigmablox.com/pacaf-hub/              → Main landing page
https://www.sigmablox.com/pacaf-matcher/          → Interactive quiz
https://www.sigmablox.com/pacaf-program/          → Program detail template

API Endpoints (Backend):
http://localhost:2000/api/pacaf/programs          → All programs
http://localhost:2000/api/pacaf/programs/mca-001  → Specific program
http://localhost:2000/api/pacaf/matcher/assess    → Submit assessment
```

---

## Navigation Integration

### **Option 1: Add to Main Navigation**

In Ghost Admin → **Settings** → **Navigation**:

```
Label: PACAF Hub
URL: /pacaf-hub/
```

### **Option 2: Add to Hero/Homepage**

Update your homepage to include a PACAF CTA:
- "Explore PACAF Opportunities →"
- Links to `/pacaf-hub/`

### **Option 3: Create PACAF Sub-Menu**

If you have a dropdown menu system:
```
PACAF Programs
  ├─ Program Hub (/pacaf-hub/)
  ├─ Find Your Match (/pacaf-matcher/)
  └─ All Programs (/pacaf-hub/#programs)
```

---

## Individual Program Pages (Dynamic URLs)

The current implementation uses a **single template** for all programs. Here's how to handle individual program pages:

### **Approach 1: Query Parameters** (Simplest)
```
/pacaf-program/?id=mca-001
/pacaf-program/?id=ccep-001
```

**Implementation**: Already built into `pacaf-hub.js`:
```javascript
// Detects ?id=mca-001 in URL
const programId = new URLSearchParams(window.location.search).get('id');
```

### **Approach 2: Ghost Dynamic Routing** (More SEO-friendly)

Create individual pages for each program:

1. **Create 13 Ghost Pages**, one per program:
   - Slug: `pacaf-mca`
   - Slug: `pacaf-ccep`
   - Slug: `pacaf-ngap`
   - (etc. for all 13 programs)

2. **Update routes.yaml**:
```yaml
routes:
  /pacaf-mca/:
    template: custom-pacaf-program
    data: page.pacaf-mca

  /pacaf-ccep/:
    template: custom-pacaf-program
    data: page.pacaf-ccep

  # ... repeat for all 13 programs
```

3. **Update JavaScript** to detect slug:
```javascript
// Map slug to program ID
const slugToProgramId = {
  'pacaf-mca': 'mca-001',
  'pacaf-ccep': 'ccep-001',
  // ... etc
};

const slug = window.location.pathname.split('/')[1]; // "pacaf-mca"
const programId = slugToProgramId[slug];
```

**Recommendation**: Start with **Approach 1** (query parameters) for speed. Migrate to Approach 2 later for better SEO.

---

## Testing Checklist

After completing Steps 1-4, verify:

### **Hub Page** (`/pacaf-hub/`)
- [ ] Page loads without errors
- [ ] Stats display (13 programs, etc.)
- [ ] High-priority programs grid shows 6 cards
- [ ] Technology filter buttons work
- [ ] Category filter works
- [ ] Program cards link to detail pages
- [ ] "Take the Matcher" CTA links to `/pacaf-matcher/`

### **Matcher Page** (`/pacaf-matcher/`)
- [ ] Quiz form displays
- [ ] Progress indicator shows (Step 1 of 8)
- [ ] Can navigate between questions
- [ ] Form validation works (can't skip required fields)
- [ ] Submit button on final step
- [ ] Results page displays after submission
- [ ] Match scores calculated correctly
- [ ] Top programs show with percentages
- [ ] Recommended next steps appear

### **Program Detail Page** (`/pacaf-program/?id=mca-001`)
- [ ] Page loads with program data
- [ ] Program overview section displays
- [ ] Problem & Need section displays
- [ ] Objectives section displays
- [ ] Technology requirements show
- [ ] Engagement pathways listed
- [ ] Funding initiatives displayed
- [ ] Related SBIR opportunities section (may be empty initially)
- [ ] "Save to Profile" button works (if logged in)

### **API Integration**
- [ ] Programs load from API (not mock data)
- [ ] Console shows successful API calls (no 404s)
- [ ] Match scoring calculates correctly
- [ ] Results persist (can refresh and see same results)

-

## Next Steps After Initial Deployment

### **Week 1: Polish & Test**
1. Test all three pages end-to-end
2. Fix any visual/UX issues
3. Test on mobile devices
4. Add error handling for failed API calls

### **Week 2: Add Dynamic Features**
1. Implement "Save to Profile" functionality
2. Add user authentication gates
3. Link matcher results to user profiles
4. Create notification system for new matches

### **Week 3: SBIR Integration**
1. Connect your existing SBIR scraper at mergecombinator.com/sbir
2. Tag SBIR opportunities with PACAF program IDs using keyword matching
3. Display related opportunities on program detail pages
4. Add "New SBIR Alert" notifications

### **Week 4: Analytics & Optimization**
1. Track page views and engagement
2. Monitor matcher completion rates
3. Analyze which programs get most interest
4. Optimize scoring algorithm based on user feedback

---

## Production Deployment

When ready for production:

### **1. Environment Variables**
Ensure production environment has:
```
MONGODB_URI=<production-mongodb-connection>
DB_NAME=sigmablox_users_prod
PORT=2000 (or your production port)
```

### **2. Deploy Backend**
```bash
# Deploy webhook service to Cloud Run or your production environment
cd webhook
# Your deployment command here
```

### **3. Update API URL in JavaScript**
In `pacaf-hub.js`, ensure production URL is correct:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:2000/api'
  : 'https://webhook.sigmablox.com/api';  // Your production webhook URL
```

### **4. Deploy Ghost Theme**
```bash
cd ghost-cloudrun
# Your Ghost deployment command
# Upload theme via Ghost Admin → Design → Upload Theme
```

### **5. Create Production Ghost Pages**
Repeat Step 1 in production Ghost Admin at:
```
https://www.sigmablox.com/ghost/
```

### **6. Seed Production Database**
```bash
# SSH into production or run via Cloud Run
node seed-pacaf-programs.js
```

---

## Performance Optimization

### **Caching Strategy**
- Programs data changes infrequently → Cache for 1 hour
- User assessments → No caching (user-specific)
- SBIR opportunities → Cache for 24 hours

Add to `pacaf-hub.js`:
```javascript
// Simple localStorage caching
async loadPrograms() {
  const cached = localStorage.getItem('pacaf_programs');
  const cacheTime = localStorage.getItem('pacaf_programs_time');

  if (cached && cacheTime && (Date.now() - cacheTime) < 3600000) {
    return JSON.parse(cached);
  }

  const response = await fetch(`${API_BASE_URL}/pacaf/programs`);
  const data = await response.json();

  localStorage.setItem('pacaf_programs', JSON.stringify(data.programs));
  localStorage.setItem('pacaf_programs_time', Date.now().toString());

  return data.programs;
}
```

### **Lazy Loading**
For program detail pages with many images/videos:
```javascript
// Add to HTML images
<img data-src="image.jpg" class="lazy-load" alt="...">

// JavaScript to lazy load
const lazyImages = document.querySelectorAll('.lazy-load');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});
lazyImages.forEach(img => imageObserver.observe(img));
```

---

## Summary: Quick Start

**5-Minute Setup:**
```bash
# 1. Create 3 Ghost pages (pacaf-hub, pacaf-matcher, pacaf-program)
# 2. Update API URL in pacaf-hub.js (line ~12, change port to 2000)
# 3. Restart Ghost
cd ghost-cloudrun && docker-compose -f docker-compose.local.yml restart ghost

# 4. Test
open http://localhost:2368/pacaf-hub/
```

That's it! Your PACAF Intelligence Hub is now live. 🚀

---

## Support & Documentation

**Full Documentation:**
- API Reference: `_docs/features/PACAF_API_DOCUMENTATION.md`
- Matching Algorithm: `_docs/features/MATCHING_ENGINE_IMPLEMENTATION.md`
- Database Schema: `_docs/features/PACAF_DATABASE_SCHEMA.md`
- Quick Start: `_docs/features/PACAF_API_QUICKSTART.md`

**Key Files:**
- Backend API: `/webhook/pacaf-api.js`
- Frontend JS: `/ghost-cloudrun/ghost-data/themes/ease/assets/js/pacaf-hub.js`
- Templates: `/ghost-cloudrun/ghost-data/themes/ease/custom-pacaf-*.hbs`
- Routes: `/ghost-cloudrun/routes.yaml`
