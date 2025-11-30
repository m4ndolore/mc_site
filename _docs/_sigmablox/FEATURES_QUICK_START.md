# Features Quick Start Guide

**Created:** November 13, 2025
**Goal:** Fast-track implementation of high-value collaboration and engagement features

---

## 🎯 3-Week Implementation Plan

### **Week 1: "I'm Interested" System** (Core Collaboration)
Build the foundation for connecting members with companies

### **Week 2: Observability** (Understand Usage)
Add analytics to measure engagement and guide future features

### **Week 3: Smart Features** (AI-Powered Matching)
Proactive suggestions and automated workflows

---

## 📅 Week 1: Core Interest System

### **Day 1: Database & API** (4 hours)

#### 1. Add MongoDB Schema
```bash
# Connect to MongoDB
mongo "mongodb+srv://..." --username magnuzno

# Switch to production database
use sigmablox-production

# Create interests collection with indexes
db.interests.createIndex({ memberId: 1, createdAt: -1 })
db.interests.createIndex({ companyId: 1 })
db.interests.createIndex({ status: 1, createdAt: -1 })
```

#### 2. Create API Endpoints
```bash
# File: webhook/index.js

# Add these endpoints:
- POST /api/interest
- GET /api/member/interests
- POST /api/admin/make-introduction
- GET /api/admin/interests
```

**Implementation:**
```javascript
// webhook/index.js - Add these functions

functions.http('submitInterest', async (req, res) => {
  corsMiddleware(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method not allowed');
    }

    const { companyId, companyName, interestType, message } = req.body;
    const member = req.body.member; // Passed from frontend

    try {
      const client = await initializeMongoClient();
      const db = client.db(configManager.getDbName());

      // Create interest
      const interest = await db.collection('interests').insertOne({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        companyId,
        companyName,
        interestType,
        message,
        status: 'pending',
        createdAt: new Date(),
        metadata: {
          source: req.body.source || 'web'
        }
      });

      // Send admin notification
      await sendEmail(process.env.ADMIN_EMAIL || 'gus@mergecombinator.com', {
        subject: `🤝 New Interest: ${member.name} → ${companyName}`,
        html: `
          <h2>New Collaboration Interest</h2>
          <p><strong>${member.name}</strong> (${member.email}) expressed interest in <strong>${companyName}</strong></p>
          <p><strong>Type:</strong> ${interestType}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p><a href="https://www.sigmablox.com/admin-interests/">View in Admin Panel</a></p>
        `
      });

      // Send member confirmation
      await sendEmail(member.email, {
        subject: `Interest Submitted: ${companyName}`,
        html: `
          <h2>Thanks for your interest! 👋</h2>
          <p>You expressed interest in collaborating with <strong>${companyName}</strong>.</p>
          <p>Our team will review and reach out within 2-3 business days.</p>
          <p><a href="https://www.sigmablox.com/my-interests/">View Your Interests</a></p>
        `
      });

      res.json({ success: true, interestId: interest.insertedId });
    } catch (error) {
      console.error('Submit interest error:', error);
      res.status(500).json({ error: 'Failed to submit interest' });
    }
  });
});

functions.http('getMemberInterests', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { memberId } = req.query;

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID required' });
    }

    try {
      const client = await initializeMongoClient();
      const db = client.db(configManager.getDbName());

      const interests = await db.collection('interests')
        .find({ memberId })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(interests);
    } catch (error) {
      console.error('Get interests error:', error);
      res.status(500).json({ error: 'Failed to fetch interests' });
    }
  });
});
```

#### 3. Deploy Webhook Service
```bash
cd webhook
./deploy-to-prod.sh
```

---

### **Day 2: Frontend UI** (4 hours)

#### 1. Create Interest Modal
```bash
# File: ghost-cloudrun/ghost-data/themes/ease/assets/js/interest-modal.js
```

```javascript
function showInterestModal(companyId, companyName) {
  const modal = document.createElement('div');
  modal.className = 'interest-modal-overlay';
  modal.innerHTML = `
    <div class="interest-modal">
      <button class="modal-close">&times;</button>
      <h2>Express Interest in ${companyName}</h2>

      <form id="interest-form">
        <label>What are you interested in?</label>
        <select name="interestType" required>
          <option value="">Select...</option>
          <option value="project">Potential project collaboration</option>
          <option value="learn_more">Want to learn more</option>
          <option value="partnership">Partnership opportunity</option>
          <option value="exploring">Just exploring</option>
        </select>

        <label>Message (optional)</label>
        <textarea name="message" rows="4" maxlength="300"
          placeholder="Tell us about your interest..."></textarea>
        <div class="char-count">0 / 300</div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.interest-modal-overlay').remove()">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Submit Interest
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  const form = modal.querySelector('#interest-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      companyId,
      companyName,
      interestType: formData.get('interestType'),
      message: formData.get('message'),
      member: window.memberData, // Ghost member context
      source: 'modal'
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const response = await fetch('https://api.sigmablox.com/submitInterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        modal.remove();
        showToast('✅ Interest submitted! We\'ll be in touch soon.');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert('Failed to submit interest. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Interest';
    }
  });

  // Character counter
  const textarea = modal.querySelector('textarea');
  const counter = modal.querySelector('.char-count');
  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length} / 300`;
  });

  // Close button
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
  });
}
```

#### 2. Add Interest Button to Company Cards
```handlebars
<!-- In custom-cohorts.hbs, add to company card -->
<div class="company-actions">
  <button class="favorite-btn" data-company-id="{{airtableId}}">
    ❤️
  </button>
  <button class="interest-btn" data-company-id="{{airtableId}}" data-company-name="{{companyName}}">
    👋 I'm Interested
  </button>
</div>

<script>
document.querySelectorAll('.interest-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const companyId = e.target.dataset.companyId;
    const companyName = e.target.dataset.companyName;

    if (!window.memberData) {
      alert('Please sign in to express interest');
      return;
    }

    showInterestModal(companyId, companyName);
  });
});
</script>
```

---

### **Day 3: Member Interest Page** (3 hours)

#### Create `/my-interests/` Page
```handlebars
<!-- File: ghost-cloudrun/ghost-data/themes/ease/custom-my-interests.hbs -->
{{!< default}}

<div class="my-interests-page">
  <h1>My Interests & Connections</h1>

  <div id="interests-loading">Loading your interests...</div>

  <div id="interests-list" style="display: none;"></div>

  <script>
  (async function() {
    if (!window.memberData) {
      window.location.href = '/signin/';
      return;
    }

    const response = await fetch(`https://api.sigmablox.com/getMemberInterests?memberId=${window.memberData.id}`);
    const interests = await response.json();

    document.getElementById('interests-loading').style.display = 'none';
    const listEl = document.getElementById('interests-list');
    listEl.style.display = 'block';

    if (interests.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>You haven't expressed interest in any companies yet.</p>
          <a href="/cohorts/" class="btn-primary">Browse Companies</a>
        </div>
      `;
      return;
    }

    listEl.innerHTML = interests.map(interest => `
      <div class="interest-card status-${interest.status}">
        <div class="interest-header">
          <h3>${interest.companyName}</h3>
          <span class="status-badge">${formatStatus(interest.status)}</span>
        </div>

        <div class="interest-details">
          <p><strong>Type:</strong> ${formatInterestType(interest.interestType)}</p>
          <p><strong>Submitted:</strong> ${formatDate(interest.createdAt)}</p>

          ${interest.message ? `<p><strong>Your message:</strong> "${interest.message}"</p>` : ''}

          <div class="status-message">
            ${getStatusMessage(interest.status)}
          </div>
        </div>

        <button onclick="window.location.href='/cohorts/'" class="btn-secondary">
          View Company Profile
        </button>
      </div>
    `).join('');
  })();

  function formatStatus(status) {
    const statusMap = {
      pending: '⏳ Pending',
      intro_sent: '✉️ Intro Sent',
      connected: '✅ Connected',
      declined: '❌ Declined'
    };
    return statusMap[status] || status;
  }

  function formatInterestType(type) {
    const typeMap = {
      project: 'Potential project',
      learn_more: 'Want to learn more',
      partnership: 'Partnership',
      exploring: 'Exploring'
    };
    return typeMap[type] || type;
  }

  function getStatusMessage(status) {
    const messages = {
      pending: 'We\'re reviewing your request and will reach out within 2-3 business days.',
      intro_sent: 'We\'ve made the introduction! Check your email for next steps.',
      connected: 'You\'re connected! Continue the conversation via email.',
      declined: 'This company is not currently seeking collaborations.'
    };
    return messages[status] || '';
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  </script>
</div>
```

---

### **Day 4: Admin Dashboard** (4 hours)

#### Create `/admin-interests/` Page
```handlebars
<!-- File: custom-admin-interests.hbs -->
{{!< default}}

<div class="admin-interests-dashboard">
  <h1>Member Interests & Introductions</h1>

  <div class="stats-row">
    <div class="stat-card">
      <h3 id="pending-count">-</h3>
      <p>Pending</p>
    </div>
    <div class="stat-card">
      <h3 id="intro-count">-</h3>
      <p>Intros Made</p>
    </div>
    <div class="stat-card">
      <h3 id="connected-count">-</h3>
      <p>Connected</p>
    </div>
  </div>

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
    <tbody id="interests-tbody"></tbody>
  </table>

  <script>
  (async function() {
    // Fetch all interests
    const response = await fetch('https://api.sigmablox.com/getAllInterests');
    const interests = await response.json();

    // Update stats
    document.getElementById('pending-count').textContent =
      interests.filter(i => i.status === 'pending').length;
    document.getElementById('intro-count').textContent =
      interests.filter(i => i.status === 'intro_sent').length;
    document.getElementById('connected-count').textContent =
      interests.filter(i => i.status === 'connected').length;

    // Render table
    const tbody = document.getElementById('interests-tbody');
    tbody.innerHTML = interests.map(interest => `
      <tr>
        <td>${formatDate(interest.createdAt)}</td>
        <td>${interest.memberName}<br><small>${interest.memberEmail}</small></td>
        <td>${interest.companyName}</td>
        <td>${interest.interestType}</td>
        <td><span class="badge-${interest.status}">${interest.status}</span></td>
        <td>
          ${interest.status === 'pending' ? `
            <button onclick="makeIntro('${interest._id}')">Make Intro</button>
          ` : ''}
          <button onclick="viewDetails('${interest._id}')">View</button>
        </td>
      </tr>
    `).join('');
  })();
  </script>
</div>
```

---

### **Day 5: Testing & Polish** (3 hours)

1. **End-to-end test:**
   - Submit interest as member
   - Verify emails sent
   - Check admin dashboard
   - Test member interests page

2. **Add CSS styling** for modals and cards

3. **Deploy theme:**
```bash
./ghost-cloudrun/deploy-theme-to-vm.sh
```

---

## 📊 Week 2: Observability

*See OBSERVABILITY_GUIDE.md for detailed implementation*

**Quick wins:**
- Day 1: Search analytics
- Day 2: Event tracking
- Day 3: System monitoring
- Day 4: Basic dashboard

---

## 🤖 Week 3: Smart Features

### **Day 1-2: Company Recommendations** (6 hours)

```javascript
// Matching algorithm based on:
// 1. Member's favorites patterns
// 2. Similar companies to ones they've viewed
// 3. New companies in areas of interest
// 4. Companies seeking collaboration

functions.http('getRecommendations', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { memberId } = req.query;

    // Get member's activity
    const [favorites, interests, views] = await Promise.all([
      db.collection('favorites').findOne({ memberId }),
      db.collection('interests').find({ memberId }).toArray(),
      analyticsDb.collection('events')
        .find({ memberId, eventType: 'company_view' })
        .limit(50)
        .toArray()
    ]);

    // Score all companies
    const cohorts = await db.collection('cohorts').find({}).toArray();
    const companies = cohorts.flatMap(c => c.participants || []);

    const scored = companies.map(company => {
      let score = 0;

      // Already favorited or expressed interest? Skip
      if (favorites?.companyIds?.includes(company.airtableId)) return null;
      if (interests.some(i => i.companyId === company.airtableId)) return null;

      // Match on mission area of favorites
      const favMissionAreas = getFavoriteMissionAreas(favorites, companies);
      if (favMissionAreas.includes(company.missionArea)) score += 5;

      // Viewed similar companies
      const viewedSimilar = views.some(v =>
        v.metadata?.missionArea === company.missionArea
      );
      if (viewedSimilar) score += 3;

      // New company (last 30 days)
      if (daysSince(company.addedDate) < 30) score += 2;

      // High TRL (more mature)
      if (company.trl >= 7) score += 1;

      return { ...company, matchScore: score, reasons: [] };
    }).filter(Boolean);

    // Return top 5
    const recommendations = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    res.json({ recommendations });
  });
});
```

### **Day 3-4: Auto-Intro Emails** (4 hours)

```javascript
// Automated introduction workflow
functions.http('autoIntroduction', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { interestId, companyEmail } = req.body;

    const interest = await db.collection('interests')
      .findOne({ _id: new ObjectId(interestId) });

    // Generate personalized intro email
    const introHtml = `
      <h2>Introduction: ${interest.memberName} ↔ ${interest.companyName}</h2>

      <p>Hi ${interest.memberName} and ${interest.companyName} team,</p>

      <p>${interest.memberName} expressed interest in ${interest.companyName} through SigmaBlox. Based on the details provided, we think there could be a great fit for collaboration.</p>

      <h3>About ${interest.memberName}:</h3>
      <p>${interest.memberProfile || 'Member of the SigmaBlox community'}</p>

      <h3>Why they're interested:</h3>
      <p>${interest.message || 'Interested in potential collaboration'}</p>

      <h3>Next Steps:</h3>
      <ul>
        <li>Reply-all to connect directly</li>
        <li>Schedule a brief intro call</li>
        <li>Share relevant materials</li>
      </ul>

      <p>Best,<br>The SigmaBlox Team</p>
    `;

    await sendEmail([interest.memberEmail, companyEmail], {
      subject: `SigmaBlox Introduction: ${interest.memberName} ↔ ${interest.companyName}`,
      html: introHtml
    });

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
});
```

### **Day 5: Follow-Up System** (2 hours)

```javascript
// Scheduled Cloud Function (daily cron job)
// Check for stale interests and send reminders

functions.http('followUpReminders', async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find intros sent but no update
  const staleIntros = await db.collection('interests').find({
    status: 'intro_sent',
    introSentAt: { $lt: sevenDaysAgo },
    followUpSent: { $ne: true }
  }).toArray();

  for (const interest of staleIntros) {
    await sendEmail(interest.memberEmail, {
      subject: `Follow-up: Connection with ${interest.companyName}`,
      html: `
        <h2>Following up on your introduction</h2>
        <p>We made an introduction between you and ${interest.companyName} last week.</p>
        <p>Have you connected? Let us know how it's going!</p>
        <p><a href="https://www.sigmablox.com/my-interests/">Update Status</a></p>
      `
    });

    await db.collection('interests').updateOne(
      { _id: interest._id },
      { $set: { followUpSent: true, followUpSentAt: new Date() } }
    );
  }

  res.json({ remindersSent: staleIntros.length });
});
```

---

## ✅ Final Checklist

### **Before Launch:**
- [ ] All API endpoints deployed and tested
- [ ] Frontend UI tested on mobile + desktop
- [ ] Email templates tested
- [ ] Admin dashboard functional
- [ ] Analytics tracking verified
- [ ] Error handling in place
- [ ] Load test with 10+ concurrent interests

### **Launch Day:**
- [ ] Announce feature to community
- [ ] Monitor for first 24 hours
- [ ] Respond to feedback quickly
- [ ] Track key metrics

### **Week 1 Post-Launch:**
- [ ] Review analytics data
- [ ] Gather user feedback
- [ ] Identify pain points
- [ ] Plan iteration

---

## 🎯 Success Metrics

**Week 1:**
- 10+ interests submitted
- 5+ introductions made
- 80%+ email open rate

**Month 1:**
- 50+ total interests
- 25+ intros made
- 3+ successful collaborations started

**Quarter 1:**
- 200+ total interests
- 50% intro acceptance rate
- 10+ documented success stories

---

**Ready to start? Begin with Week 1, Day 1 and build momentum!**
