# Collaboration & Engagement Features

**Created:** November 13, 2025
**Status:** Design & Implementation Guide
**Goal:** Automate introductions and foster collaboration between members and companies

---

## 🎯 Design Principles

1. **Low friction** - One click to express interest
2. **Automated workflows** - System handles introductions
3. **Privacy-first** - Members control what they share
4. **Async-friendly** - No forced real-time interaction
5. **Trackable** - Measure engagement and outcomes

---

## 🚀 Feature Set Overview

### **Tier 1: Quick Wins** (1-2 weeks)
*High value, low complexity*

1. **"I'm Interested" Button** - Express interest in collaborating with a company
2. **Project Match Suggestions** - Auto-suggest companies based on member profile
3. **Introduction Requests** - One-click request for warm intro via admin
4. **Engagement Dashboard** - Track interest, intros, connections

### **Tier 2: Automation** (2-3 weeks)
*Reduce manual work, increase value*

5. **Auto-Introductions** - System emails both parties with context
6. **Project Brief Generator** - AI-generated collaboration brief
7. **Follow-up Reminders** - Nudge members to update status
8. **Success Stories** - Showcase completed collaborations

### **Tier 3: Advanced** (Future)
*Scale and sophistication*

9. **Smart Matching Algorithm** - ML-based company recommendations
10. **Collaboration Workspace** - In-platform messaging/docs
11. **RFP/RFI Board** - Post opportunities, companies respond

---

## 💡 Additional Ideas & Next Steps

1. **Member Portal**
   - `/my-interests/` page showing submission history, statuses, and admin notes
   - Actions: withdraw interest, request update, provide outcome feedback
   - Integrate with interest confirmation email for quick access

2. **Company & Coach Visibility**
   - Secure panels on `/my-company/` and `/coaches/` showing inbound interests
   - Mask contact info until the company accepts the interest (“brokered intro”)
   - Track who accepted/declined and when

3. **Brokered Intro Workflow**
   - Admin/company clicks “Share contact info” → status becomes `intro_sent`
   - Automated email to both parties with context and contact details
   - Follow-up reminders (7/14 days) asking if the intro was successful

4. **Reminders & Nudges**
   - Cron job checks for `pending` interests older than 7 days → nudges company/admin
   - After `intro_sent`, send a check-in at 14 days (“Did you connect?”)
   - Monthly digest summarizing open interests & successes

5. **Success Stories**
   - Simple form/email capture referencing an interest ID
   - Admin dashboard button to “Mark as success” with notes
   - Publish curated stories on a `/success-stories/` page (opt-in quotes)

6. **Analytics Enhancements**
   - Funnel metrics (interest → intro → connection)
   - Leaderboard of most-engaged companies/members
   - Slack/Email alerts for spikes in activity

These ideas can be implemented in phases, starting with member/company visibility and the brokered intro actions, then layering reminders and storytelling for long-term engagement.

---

## 📝 Cohort Update Form (AAR Workflow)

**Purpose:** Capture structured cohort health signals from participating companies, turning their post-program feedback into measurable KPIs, fresh testimonials, and follow-up actions.

### Form Structure (mirrors `_docs/aar.md`)
1. **Impact & Experience**
   - 1–5 value rating, key outcomes, top highlight, single change request
2. **Network & Momentum**
   - Collab counts, funding/contracting touchpoints, pipeline ranges, continued pod engagement
3. **Strategic Outcomes / KPIs**
   - Funding acceleration, TRL delta, DoD/primes engagement, jobs added, revenue/pipeline shift
4. **Open Commentary**
   - Quote/testimonial, “what do you need now” picklist, attend/recommend indicator
5. **Follow-up & Visibility**
   - Opt-in for 15‑min interview or feature, LinkedIn/contact handle

### Experience Flow
1. **Trigger**
   - Send form link at Day 30 + Day 60 post-cohort via automated email (`/api/cohort-update/notify`)
   - Include personalized intro with last recorded milestones to increase response rate
2. **Form Surface**
   - Host at `/cohort-update/` (authenticated or magic-link token)
   - Embed progress bar + estimated completion time (<5 mins); allow autosave for partially completed responses
3. **Data Capture**
   - Store responses in `cohort_updates` collection keyed by `companyId`, `cohortId`, `contactEmail`
   - Preserve question groupings so analytics can roll up Impact, Network, KPI, Commentary, Follow-up
```javascript
const CohortUpdateSchema = {
  companyId: String,
  cohortId: String,
  contactEmail: String,
  submittedAt: Date,
  impact: { rating: Number, outcome: String, highlight: String, changeRequest: String },
  network: { partnerships: Number, funderContacts: Boolean, opportunityRange: String, stayedInTouch: Boolean },
  kpis: { accelerated: String, trlBefore: String, trlAfter: String, dodEngagement: Boolean, jobs: Number, revenueChange: String },
  commentary: { quote: String, currentNeed: String, recommend: String },
  followUp: { interviewOptIn: Boolean, contactLink: String },
  status: ['draft', 'submitted', 'flagged']
};
```
4. **Notifications & Tasks**
   - On submission: notify cohort ops Slack channel w/ highlight + needs summary
   - Flag responses needing follow-up (e.g., low value rating, urgent needs) into `/admin-engagement/` dashboard tab
5. **Reporting**
   - Auto-generate AAR rollups: counts, funding totals, testimonials sentiment, needs heatmap
   - Enable CSV export + Ghost CMS embed for success stories

### Why it matters
- Closes the loop between collaboration features and measurable outcomes
- Supplies testimonials + KPIs for sponsors without extra manual outreach
- Feeds success-story pipeline and coach/company nudging logic with fresh data

---

## 📋 Tier 1 Implementation Guide

### **1. "I'm Interested" Button**

**User Experience:**
```
Company Profile Card/Modal:
  [❤️ Favorite]  [👋 I'm Interested]

When clicked:
  → Modal: "Tell us about your interest"
  → Options: [ ] Potential project  [ ] Looking to learn more
              [ ] Hiring/Partnership [ ] Just exploring
  → [Optional] Message to company (300 chars)
  → [Submit Interest]

Confirmation:
  "✅ Interest submitted! We'll notify the company and connect you."
```

**Backend Implementation:**

```javascript
// MongoDB Schema
const InterestSchema = {
  memberId: ObjectId,
  memberEmail: String,
  memberName: String,
  companyId: String,
  companyName: String,
  interestType: ['project', 'learn_more', 'partnership', 'exploring'],
  message: String,
  status: ['pending', 'intro_sent', 'connected', 'declined', 'stale'],
  createdAt: Date,
  updatedAt: Date,
  introSentAt: Date,
  metadata: {
    memberProfile: String, // Role, organization
    companyMissionArea: String,
    source: String // 'profile_view', 'search', 'favorites'
  }
};
```

**API Endpoints:**

```javascript
// POST /api/interest
// Submit interest in a company
app.post('/api/interest', authenticateMember, async (req, res) => {
  const { companyId, interestType, message } = req.body;
  const member = req.member; // From auth middleware

  // Create interest record
  const interest = await db.collection('interests').insertOne({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    companyId,
    companyName: getCompanyName(companyId),
    interestType,
    message,
    status: 'pending',
    createdAt: new Date(),
    metadata: {
      memberProfile: member.profile,
      source: req.body.source || 'direct'
    }
  });

  // Send notification to admin
  await sendEmail(ADMIN_EMAIL, {
    subject: `New Interest: ${member.name} → ${companyName}`,
    html: emailTemplates.newInterest(interest)
  });

  // Send confirmation to member
  await sendEmail(member.email, {
    subject: `Interest submitted: ${companyName}`,
    html: emailTemplates.interestConfirmation(interest)
  });

  res.json({ success: true, interestId: interest.insertedId });
});

// GET /api/member/interests
// Get member's interest history
app.get('/api/member/interests', authenticateMember, async (req, res) => {
  const interests = await db.collection('interests')
    .find({ memberId: req.member.id })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(interests);
});
```

**Frontend Integration:**

```javascript
// Add to company-modal.hbs and company cards
<button class="interest-btn" data-company-id="{{airtableId}}">
  <svg>👋</svg>
  I'm Interested
</button>

<script>
document.querySelectorAll('.interest-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const companyId = e.target.dataset.companyId;

    // Show interest modal
    showInterestModal({
      companyId,
      onSubmit: async (data) => {
        const response = await fetch('/api/interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            interestType: data.type,
            message: data.message,
            source: 'modal'
          })
        });

        if (response.ok) {
          showToast('✅ Interest submitted!');
        }
      }
    });
  });
});
</script>
```

**Email Templates:**

```javascript
// webhook/email-notifications.js
emailTemplates.newInterest = (interest) => ({
  subject: `🤝 New Interest: ${interest.memberName} → ${interest.companyName}`,
  html: `
    <h2>New Collaboration Interest</h2>
    <p><strong>${interest.memberName}</strong> expressed interest in <strong>${interest.companyName}</strong></p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
      <p><strong>Interest Type:</strong> ${interest.interestType}</p>
      <p><strong>Member Email:</strong> ${interest.memberEmail}</p>
      ${interest.message ? `<p><strong>Message:</strong><br>${interest.message}</p>` : ''}
    </div>

    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Review member profile</li>
      <li>Contact company for permission to share contact</li>
      <li>Make introduction via email</li>
    </ol>

    <a href="https://www.sigmablox.com/admin-interests/" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      View All Interests
    </a>
  `
});

emailTemplates.interestConfirmation = (interest) => ({
  subject: `Interest Submitted: ${interest.companyName}`,
  html: `
    <h2>Thanks for your interest! 👋</h2>
    <p>You expressed interest in collaborating with <strong>${interest.companyName}</strong>.</p>

    <p><strong>What happens next:</strong></p>
    <ol>
      <li>Our team will review your request</li>
      <li>We'll reach out to ${interest.companyName}</li>
      <li>If there's mutual interest, we'll make an introduction</li>
    </ol>

    <p>Typical response time: 2-3 business days</p>

    <a href="https://www.sigmablox.com/my-interests/" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      View Your Interests
    </a>
  `
});
```

---

### **2. Project Match Suggestions**

**Algorithm (Simple V1):**

```javascript
// POST /api/member/matches
// Get personalized company matches
app.post('/api/member/matches', authenticateMember, async (req, res) => {
  const member = req.member;

  // Get member's favorites for context
  const favorites = await db.collection('favorites')
    .findOne({ memberId: member.id });

  // Get all companies
  const cohorts = await db.collection('cohorts').find({}).toArray();
  const companies = cohorts.flatMap(c => c.participants || []);

  // Score companies based on:
  // 1. Member's favorite patterns (mission areas, TRL levels)
  // 2. Member's profile interests (if available)
  // 3. Recency (new companies)
  // 4. Not already favorited or expressed interest

  const scored = companies.map(company => {
    let score = 0;

    // Match on mission area
    const favoriteMissionAreas = getFavoriteMissionAreas(favorites, companies);
    if (favoriteMissionAreas.includes(company.missionArea)) score += 3;

    // Boost new companies
    const daysOld = daysSince(company.createdAt);
    if (daysOld < 30) score += 2;

    // Penalize if already favorited
    if (favorites?.companyIds?.includes(company.airtableId)) score -= 5;

    // Penalize if already expressed interest
    const hasInterest = await db.collection('interests')
      .findOne({ memberId: member.id, companyId: company.airtableId });
    if (hasInterest) score -= 5;

    return { ...company, matchScore: score };
  });

  // Return top 5 matches
  const matches = scored
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  res.json({ matches });
});
```

**Frontend Display:**

```handlebars
<!-- Add to homepage or dashboard -->
<section class="suggested-matches">
  <h2>Companies You Might Like</h2>
  <p>Based on your favorites and interests</p>

  <div class="match-grid">
    {{#each matches}}
    <div class="match-card">
      <img src="{{logo}}" alt="{{companyName}}" />
      <h3>{{companyName}}</h3>
      <p>{{description}}</p>
      <span class="match-reason">{{matchReason}}</span>
      <button class="view-profile" data-company-id="{{airtableId}}">
        View Profile
      </button>
    </div>
    {{/each}}
  </div>
</section>
```

---

### **3. Introduction Requests**

**Simple Manual Flow (V1):**

```javascript
// One-click request for admin to make intro
// Button appears on company profiles

// POST /api/introduction-request
app.post('/api/introduction-request', authenticateMember, async (req, res) => {
  const { companyId, context } = req.body;
  const member = req.member;

  const request = await db.collection('intro_requests').insertOne({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    companyId,
    companyName: getCompanyName(companyId),
    context, // Why they want intro
    status: 'pending',
    createdAt: new Date()
  });

  // Notify admin
  await sendEmail(ADMIN_EMAIL, {
    subject: `Introduction Request: ${member.name} → ${companyName}`,
    html: emailTemplates.introRequest(request)
  });

  res.json({ success: true });
});
```

---

### **4. Engagement Dashboard**

**Admin View:**

```handlebars
<!-- /admin-engagement/ page -->
<div class="engagement-dashboard">
  <h1>Member Engagement</h1>

  <div class="stats-grid">
    <div class="stat-card">
      <h3>{{totalInterests}}</h3>
      <p>Total Interests</p>
    </div>
    <div class="stat-card">
      <h3>{{introsMade}}</h3>
      <p>Introductions Made</p>
    </div>
    <div class="stat-card">
      <h3>{{activeProjects}}</h3>
      <p>Active Projects</p>
    </div>
    <div class="stat-card">
      <h3>{{successRate}}%</h3>
      <p>Connection Rate</p>
    </div>
  </div>

  <h2>Recent Activity</h2>
  <table class="interests-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Member</th>
        <th>Company</th>
        <th>Type</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {{#each recentInterests}}
      <tr>
        <td>{{formatDate createdAt}}</td>
        <td>{{memberName}}</td>
        <td>{{companyName}}</td>
        <td>{{interestType}}</td>
        <td><span class="status-{{status}}">{{status}}</span></td>
        <td>
          <button onclick="makeIntroduction('{{_id}}')">Make Intro</button>
          <button onclick="viewDetails('{{_id}}')">Details</button>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <h2>Most Popular Companies</h2>
  <ul>
    {{#each popularCompanies}}
    <li>{{companyName}} - {{interestCount}} interests</li>
    {{/each}}
  </ul>
</div>
```

**Member View:**

```handlebars
<!-- /my-interests/ page -->
<div class="my-interests-page">
  <h1>My Interests & Connections</h1>

  <div class="interest-cards">
    {{#each interests}}
    <div class="interest-card status-{{status}}">
      <div class="company-info">
        <img src="{{companyLogo}}" alt="{{companyName}}" />
        <h3>{{companyName}}</h3>
      </div>

      <div class="interest-details">
        <p class="interest-type">{{formatInterestType interestType}}</p>
        <p class="date">Submitted {{formatDate createdAt}}</p>

        {{#if message}}
        <p class="message">"{{message}}"</p>
        {{/if}}

        <div class="status-indicator">
          {{#if (eq status 'pending')}}
            ⏳ Pending review
          {{else if (eq status 'intro_sent')}}
            ✉️ Introduction sent! Check your email.
          {{else if (eq status 'connected')}}
            ✅ Connected
          {{/if}}
        </div>
      </div>

      <button onclick="viewCompany('{{companyId}}')">View Profile</button>
    </div>
    {{/each}}
  </div>
</div>
```

---

## 📊 Analytics & Tracking

**Key Metrics to Track:**

```javascript
// MongoDB Aggregations for Dashboard

// 1. Interest funnel
const interestFunnel = await db.collection('interests').aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  }
]);

// 2. Most popular companies
const popularCompanies = await db.collection('interests').aggregate([
  {
    $group: {
      _id: '$companyId',
      companyName: { $first: '$companyName' },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);

// 3. Average time to introduction
const avgIntroTime = await db.collection('interests').aggregate([
  {
    $match: { status: 'intro_sent', introSentAt: { $exists: true } }
  },
  {
    $project: {
      daysToIntro: {
        $divide: [
          { $subtract: ['$introSentAt', '$createdAt'] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  },
  {
    $group: {
      _id: null,
      avgDays: { $avg: '$daysToIntro' }
    }
  }
]);

// 4. Engagement by member
const memberEngagement = await db.collection('interests').aggregate([
  {
    $group: {
      _id: '$memberId',
      memberName: { $first: '$memberName' },
      totalInterests: { $sum: 1 },
      connected: {
        $sum: { $cond: [{ $eq: ['$status', 'connected'] }, 1, 0] }
      }
    }
  },
  { $sort: { totalInterests: -1 } }
]);
```

---

## 🔄 Tier 2: Auto-Introductions

**Implementation:**

```javascript
// POST /api/admin/make-introduction
app.post('/api/admin/make-introduction', authenticateAdmin, async (req, res) => {
  const { interestId, companyEmail } = req.body;

  const interest = await db.collection('interests').findOne({
    _id: new ObjectId(interestId)
  });

  if (!interest) return res.status(404).json({ error: 'Interest not found' });

  // Generate introduction email
  const introEmail = emailTemplates.introduction({
    memberName: interest.memberName,
    memberEmail: interest.memberEmail,
    companyName: interest.companyName,
    companyEmail: companyEmail,
    interestType: interest.interestType,
    message: interest.message,
    context: generateIntroContext(interest)
  });

  // Send to both parties (double opt-in intro)
  await sendEmail([interest.memberEmail, companyEmail], introEmail);

  // Update status
  await db.collection('interests').updateOne(
    { _id: interest._id },
    {
      $set: {
        status: 'intro_sent',
        introSentAt: new Date(),
        companyEmail
      }
    }
  );

  res.json({ success: true });
});

// Email template for double opt-in intro
emailTemplates.introduction = (data) => ({
  subject: `Introduction: ${data.memberName} ↔ ${data.companyName}`,
  html: `
    <h2>🤝 SigmaBlox Introduction</h2>

    <p>Hi ${data.memberName} and ${data.companyName} team,</p>

    <p>We're excited to introduce you! ${data.memberName} expressed interest in learning more about ${data.companyName} based on ${data.context}.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>About ${data.memberName}:</h3>
      <p>${data.memberProfile}</p>

      <h3>Interest in ${data.companyName}:</h3>
      <p>${data.message || 'Interested in potential collaboration'}</p>
    </div>

    <p><strong>Suggested next steps:</strong></p>
    <ul>
      <li>Reply-all to this email to connect</li>
      <li>Schedule a brief intro call</li>
      <li>Share relevant materials or project details</li>
    </ul>

    <p>We're here to support this connection - let us know how it goes!</p>

    <p>Best,<br>The SigmaBlox Team</p>
  `
});
```

---

## 🎨 UI/UX Enhancements

**Toast Notifications:**

```javascript
// Add to theme assets/js/notifications.js
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span>
    <span class="toast-message">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Usage
showToast('Interest submitted successfully!');
showToast('Introduction sent to both parties', 'success');
```

---

## 📱 Quick Action Items (Priority Order)

### **Week 1: Core Interest System**
- [ ] Add `interests` collection to MongoDB
- [ ] Create `/api/interest` endpoint
- [ ] Add "I'm Interested" button to company modals/cards
- [ ] Create interest modal UI
- [ ] Set up email notifications (member + admin)
- [ ] Create `/my-interests/` page

### **Week 2: Admin Tools**
- [ ] Create `/admin-engagement/` dashboard page
- [ ] Add interest management UI
- [ ] Implement "Make Introduction" workflow
- [ ] Test end-to-end flow
- [ ] Add analytics queries

### **Week 3: Smart Features**
- [ ] Implement match suggestions algorithm
- [ ] Add "Suggested For You" section to homepage
- [ ] Create follow-up reminder system
- [ ] Add engagement tracking

---

## 🚀 Launch Strategy

1. **Soft launch** with 10-20 active members
2. **Gather feedback** on intro quality and timing
3. **Iterate** on match algorithm
4. **Scale** to all members
5. **Measure success**: Track intro → connection rate

---

**Success Metrics:**
- 20% of active members express interest in ≥1 company/month
- 50% intro acceptance rate (company agrees to connect)
- 3-day average time to introduction
- 10+ successful collaborations launched in first quarter

---

**Next:** See OBSERVABILITY_GUIDE.md and FEATURES_GUIDE.md for implementation details.
