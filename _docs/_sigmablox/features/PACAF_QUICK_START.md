# PACAF Hub - Quick Start Guide (5 Minutes)

## ✅ Status Check

- ✅ **Backend API**: Running on port 2000
- ✅ **Database**: Seeded with 13 programs
- ✅ **Templates**: All 3 HBS files created
- ✅ **JavaScript**: Fixed API URL (now pointing to port 2000)
- ✅ **Routes**: Configured in routes.yaml

---

## 🚀 3 Steps to Launch

### **Step 1: Create Ghost Pages** (2 minutes)

Go to Ghost Admin and create 3 pages:

**Local**: http://localhost:2368/ghost/
**Production**: https://www.sigmablox.com/ghost/

#### Page 1: PACAF Hub
- **Title**: `PACAF Intelligence Hub`
- **Slug**: `pacaf-hub` ⚠️ MUST match exactly
- **Content**: (optional) "Discover PACAF opportunities"
- Click **Publish** → Publish now

#### Page 2: Program Matcher
- **Title**: `PACAF Program Matcher`
- **Slug**: `pacaf-matcher` ⚠️ MUST match exactly
- **Content**: (optional) "Find your ideal PACAF program"
- Click **Publish** → Publish now

#### Page 3: Program Detail
- **Title**: `PACAF Program`
- **Slug**: `pacaf-program` ⚠️ MUST match exactly
- **Content**: (optional) "Program details"
- Click **Publish** → Publish now

---

### **Step 2: Restart Ghost** (1 minute)

```bash
cd /Users/paulgarcia/Dev/sigmablox/ghost-cloudrun
docker-compose -f docker-compose.local.yml restart ghost
```

Wait ~30 seconds for Ghost to restart.

---

### **Step 3: Test the Pages** (2 minutes)

Visit each page in your browser:

```bash
# Test 1: Hub landing page
open http://localhost:2368/pacaf-hub/

# Test 2: Program matcher quiz
open http://localhost:2368/pacaf-matcher/

# Test 3: Program detail page (with sample program)
open "http://localhost:2368/pacaf-program/?id=mca-001"
```

---

## ✅ Expected Results

### Hub Page (`/pacaf-hub/`)
You should see:
- Dark gradient background (SigmaBlox theme)
- Hero section with stats: "13 Programs", "$11B+ Funding"
- Grid of 6 high-priority program cards
- Technology focus area cards (Training, Cyber, Materials, Resilience)
- Filter dropdowns (Category, Tech Area)
- All programs list below

### Matcher Page (`/pacaf-matcher/`)
You should see:
- Progress bar showing "Question 1 of 8"
- Question 1: "What is your primary technology area?"
- 4 option cards (Training, Cybersecurity, Materials, Resilience)
- "Next" button
- Dark themed form matching SigmaBlox design

### Program Detail Page (`/pacaf-program/?id=mca-001`)
You should see:
- Program title: "Multi-Capable Airman (MCA) Program"
- Category badge: "High Priority"
- Program overview section
- Problem & Need section with bullet points
- Objectives section
- Technology requirements with tags
- Engagement pathways
- Funding initiatives
- Sidebar with quick stats

---

## 🐛 Troubleshooting

### **Issue**: Page shows 404 Not Found
**Fix**:
1. Verify you created the Ghost page with the exact slug
2. Check slug matches routes.yaml: `pacaf-hub`, `pacaf-matcher`, `pacaf-program`
3. Restart Ghost (Step 2 above)

### **Issue**: Page loads but shows blank/white screen
**Fix**:
1. Open browser console (F12) and check for errors
2. Most common: API calls failing
3. Verify webhook server is running:
   ```bash
   ps aux | grep "local-server.js"
   ```
4. If not running, start it:
   ```bash
   cd /Users/paulgarcia/Dev/sigmablox/webhook
   node local-server.js
   ```

### **Issue**: Console shows "404 /api/pacaf/programs"
**Fix**:
1. The JavaScript was just fixed to point to port 2000
2. Hard refresh your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Clear browser cache if needed

### **Issue**: Programs don't show or show empty
**Fix**:
1. Verify database has programs:
   ```bash
   curl http://localhost:2000/api/pacaf/programs | jq '.count'
   ```
2. Should return: `13`
3. If 0, re-seed database:
   ```bash
   cd /Users/paulgarcia/Dev/sigmablox/webhook
   node seed-pacaf-programs.js
   ```

---

## 📱 Test the Complete Flow

1. **Visit Hub**: http://localhost:2368/pacaf-hub/
2. **Click** "Find Your Match" button
3. **Complete Quiz**:
   - Select "Training & Simulation"
   - Check "VR/AR platforms"
   - Select TRL 4-6
   - Select "SBIR Phase I"
   - Select 6-25 employees
   - Select "Secret clearance"
   - Select "Near-term (3-6 months)"
   - Select "Win SBIR funding"
4. **Click Submit**
5. **See Results**: Should show MCA Program at 80%+ match
6. **Click "View Details"** on top match
7. **See Program Page**: Full MCA program details

---

## 🎨 Add to Navigation (Optional)

### Option 1: Main Nav
In Ghost Admin → **Settings** → **Navigation**:

Add:
- **Label**: `PACAF Hub`
- **URL**: `/pacaf-hub/`

### Option 2: Homepage CTA
Edit your homepage and add a prominent CTA:
```html
<a href="/pacaf-hub/" class="cta-button">
  Explore PACAF Opportunities →
</a>
```

---

## 📊 What You Get

### **13 PACAF Programs**:
1. Multi-Capable Airman (MCA) - $622M+
2. Cyber Collaboration & Exchange (CCEP)
3. Next Generation Aircrew Protection (NGAP)
4. Ready Aircrew Program (RAP)
5. Theater Security Cooperation (TSC)
6. Cyber Operations A6 - $11.1B
7. Inter-Pacific Air Forces Academy (IPAFA)
8. Corrosion Control Program
9. True North-Lite (TN-L)
10. Misawa Bilateral Programs
11. A5/8 Strategic Engagement
12. Chaplains Directorate Workshops
13. A4S Security Forces Division

### **Features**:
- ✅ Interactive 8-question capability matcher
- ✅ Smart matching algorithm (100-point scoring)
- ✅ Program filtering by category & technology
- ✅ Detailed program pages with all info
- ✅ Responsive mobile-friendly design
- ✅ Dark theme matching SigmaBlox brand
- ✅ Integration ready for SBIR scraper
- ✅ Save to profile functionality (when logged in)

---

## 🚀 Next Steps

### Week 1: Basic Integration
- [ ] Create the 3 Ghost pages
- [ ] Test all pages work
- [ ] Add to main navigation
- [ ] Test on mobile devices

### Week 2: Enhanced Features
- [ ] Connect SBIR scraper (mergecombinator.com/sbir)
- [ ] Tag companies with PACAF interests
- [ ] Tag coaches with PACAF expertise
- [ ] Test matcher with real users

### Week 3: Data Enhancement
- [ ] Add company profiles pursuing PACAF
- [ ] Add coach PACAF specializations
- [ ] Display related companies on program pages
- [ ] Display related coaches on program pages

### Week 4: Advanced Features
- [ ] Email notifications for new matches
- [ ] Save favorite programs to user profiles
- [ ] Track analytics (which programs get most views)
- [ ] Add social sharing for programs

---

## 🎯 Success Metrics

Track these to measure impact:

- **Page views**: How many people visit each page
- **Matcher completions**: % who finish the 8-question quiz
- **Top programs**: Which programs get most interest
- **SBIR clicks**: Click-through rate to SBIR opportunities
- **Profile updates**: Companies adding PACAF to their profiles

---

## 📞 Support

**Documentation**:
- Full API Reference: `_docs/features/PACAF_API_DOCUMENTATION.md`
- Implementation Guide: `_docs/features/PACAF_FRONTEND_IMPLEMENTATION_GUIDE.md`
- Database Schema: `_docs/features/PACAF_DATABASE_SCHEMA.md`

**Key Files**:
- Backend API: `/webhook/pacaf-api.js`
- Frontend JS: `/ghost-cloudrun/ghost-data/themes/ease/assets/js/pacaf-hub.js`
- Templates: `/ghost-cloudrun/ghost-data/themes/ease/custom-pacaf-*.hbs`

---

## ⚡ That's It!

Your PACAF Intelligence Hub is now ready to use! 🎉

Just create those 3 Ghost pages and you're live.
