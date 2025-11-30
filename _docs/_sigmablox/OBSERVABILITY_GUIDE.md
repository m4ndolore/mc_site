# Observability Implementation Guide

**Created:** November 13, 2025
**Status:** Quick Implementation Guide
**Goal:** Add visibility into user behavior and system health

---

## 🎯 Overview

This guide provides **quick, practical implementations** for:
1. Search analytics
2. User engagement tracking
3. System monitoring
4. Performance metrics

**Philosophy:** Start simple, iterate based on data.

---

## 📊 1. Search Analytics (30 minutes)

### **What to Track**

```javascript
const searchEvent = {
  timestamp: Date,
  query: String,
  resultsCount: Number,
  resultTypes: {
    companies: Number,
    coaches: Number
  },
  memberId: String (optional),
  resultClicked: Boolean,
  clickedCompanyId: String (optional),
  searchDuration: Number (ms),
  source: String // 'keyboard_shortcut', 'search_button', 'header'
};
```

### **Backend Implementation**

```javascript
// webhook/index.js

// Add analytics collection
const analyticsDb = client.db('sigmablox-analytics');

// Update search endpoint to log analytics
functions.http('search', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const startTime = Date.now();

    try {
      const query = req.query.q || req.query.query || '';

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters'
        });
      }

      const searchTerm = query.trim().toLowerCase();
      const client = await initializeMongoClient();
      const db = client.db(configManager.getDbName());

      // [... existing search logic ...]

      const searchDuration = Date.now() - startTime;

      // Log search analytics (non-blocking)
      analyticsDb.collection('searches').insertOne({
        timestamp: new Date(),
        query: query,
        resultsCount: allResults.length,
        resultTypes: {
          companies: companyResults.length,
          coaches: coaches.length
        },
        searchDuration,
        source: req.query.source || 'unknown',
        memberId: req.query.memberId || null // From auth if available
      }).catch(err => console.error('Analytics error:', err));

      res.json({
        query: query,
        totalResults: allResults.length,
        companies: companyResults.length,
        coaches: coaches.length,
        results: allResults.slice(0, 50)
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
});
```

### **Track Click-Through**

```javascript
// POST /api/analytics/search-click
functions.http('searchClick', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { query, companyId, resultPosition } = req.body;

    await analyticsDb.collection('search_clicks').insertOne({
      timestamp: new Date(),
      query,
      companyId,
      resultPosition,
      memberId: req.body.memberId || null
    });

    res.json({ success: true });
  });
});
```

### **Frontend Tracking**

```javascript
// assets/js/unified-search.js

// When user clicks a search result
function trackSearchClick(query, companyId, position) {
  fetch('/api/analytics/search-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      companyId,
      resultPosition: position,
      source: 'unified_search'
    })
  }).catch(err => console.error('Analytics error:', err));
}

// Usage in search results handler
document.querySelectorAll('.search-result').forEach((result, index) => {
  result.addEventListener('click', () => {
    const query = searchInput.value;
    const companyId = result.dataset.companyId;
    trackSearchClick(query, companyId, index);
  });
});
```

### **Analytics Dashboard (Admin)**

```javascript
// GET /api/analytics/search-stats
functions.http('searchStats', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { startDate, endDate } = req.query;

    const stats = await analyticsDb.collection('searches').aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
            $lte: new Date(endDate || Date.now())
          }
        }
      },
      {
        $facet: {
          totalSearches: [{ $count: 'count' }],
          avgResults: [{ $group: { _id: null, avg: { $avg: '$resultsCount' } } }],
          topQueries: [
            { $group: { _id: '$query', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          zeroResults: [
            { $match: { resultsCount: 0 } },
            { $count: 'count' }
          ],
          avgDuration: [
            { $group: { _id: null, avg: { $avg: '$searchDuration' } } }
          ]
        }
      }
    ]).toArray();

    res.json(stats[0]);
  });
});
```

---

## 📈 2. User Engagement Tracking (45 minutes)

### **Events to Track**

```javascript
const eventSchema = {
  timestamp: Date,
  memberId: String,
  eventType: String, // 'page_view', 'favorite', 'unfavorite', 'profile_view', etc.
  resourceType: String, // 'company', 'coach', 'page'
  resourceId: String,
  metadata: Object, // Event-specific data
  sessionId: String, // Group related events
  source: String // Where event originated
};
```

### **Generic Tracking Function**

```javascript
// POST /api/analytics/event
functions.http('trackEvent', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const event = {
      timestamp: new Date(),
      memberId: req.body.memberId || null,
      eventType: req.body.eventType,
      resourceType: req.body.resourceType,
      resourceId: req.body.resourceId,
      metadata: req.body.metadata || {},
      sessionId: req.body.sessionId || generateSessionId(),
      source: req.body.source || 'web'
    };

    await analyticsDb.collection('events').insertOne(event);

    res.json({ success: true });
  });
});
```

### **Frontend Tracking Helper**

```javascript
// assets/js/analytics.js

class Analytics {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.memberId = this.getMemberId(); // From Ghost member context
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  getMemberId() {
    // Extract from Ghost member context if logged in
    return window.memberData?.id || null;
  }

  async track(eventType, data = {}) {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          ...data,
          memberId: this.memberId,
          sessionId: this.sessionId
        })
      });
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  }

  // Convenience methods
  trackPageView(pageName) {
    this.track('page_view', {
      resourceType: 'page',
      resourceId: pageName,
      metadata: {
        url: window.location.href,
        referrer: document.referrer
      }
    });
  }

  trackCompanyView(companyId, source = 'unknown') {
    this.track('company_view', {
      resourceType: 'company',
      resourceId: companyId,
      source,
      metadata: {
        url: window.location.href
      }
    });
  }

  trackFavorite(companyId, action = 'add') {
    this.track(action === 'add' ? 'favorite_add' : 'favorite_remove', {
      resourceType: 'company',
      resourceId: companyId,
      metadata: { action }
    });
  }
}

// Initialize global analytics
window.analytics = new Analytics();

// Track page views automatically
window.addEventListener('load', () => {
  const pageName = document.title || window.location.pathname;
  window.analytics.trackPageView(pageName);
});
```

### **Usage Examples**

```javascript
// In company modal/profile
function openCompanyModal(companyId) {
  window.analytics.trackCompanyView(companyId, 'modal');
  // ... rest of modal logic
}

// In favorites handler
function toggleFavorite(companyId, action) {
  window.analytics.trackFavorite(companyId, action);
  // ... rest of favorite logic
}

// In cohort detail page
window.analytics.track('cohort_view', {
  resourceType: 'cohort',
  resourceId: cohortId,
  metadata: {
    cohortName: cohortName,
    companyCount: companies.length
  }
});
```

---

## 🔔 3. System Monitoring (20 minutes)

### **Health Check Endpoint**

```javascript
// GET /health
functions.http('health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    service: 'webhook-service',
    checks: {}
  };

  try {
    // Check MongoDB connection
    const client = await initializeMongoClient();
    await client.db('admin').command({ ping: 1 });
    health.checks.mongodb = 'healthy';
  } catch (err) {
    health.checks.mongodb = 'unhealthy';
    health.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
  };

  // Response time
  health.responseTime = Date.now() - req.startTime;

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### **Setup Uptime Monitoring**

**Option 1: UptimeRobot (Free, Simple)**

```bash
# Visit https://uptimerobot.com
# Add monitors:
1. www.sigmablox.com - HTTP(S), 5 min interval
2. www.sigmablox.com/ghost/ - HTTP(S), 5 min interval
3. api.sigmablox.com/health - HTTP(S), 5 min interval

# Configure alerts:
- Email: your-email@domain.com
- Slack webhook: https://hooks.slack.com/... (optional)
```

**Option 2: Better Stack (Modern, Good Free Tier)**

```bash
# Visit https://betterstack.com/uptime
# Similar setup with better UI and incident management
```

### **Performance Tracking**

```javascript
// Add response time tracking to all endpoints

// Middleware for timing
function timingMiddleware(req, res, next) {
  req.startTime = Date.now();

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }

    // Track in analytics (non-blocking)
    analyticsDb.collection('performance').insertOne({
      timestamp: new Date(),
      endpoint: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode
    }).catch(err => console.error('Performance tracking error:', err));

    originalSend.call(this, data);
  };

  next();
}

// Apply to all routes
app.use(timingMiddleware);
```

---

## 📉 4. Performance Metrics Dashboard (30 minutes)

### **Admin Dashboard Endpoint**

```javascript
// GET /api/analytics/dashboard
functions.http('analyticsDashboard', async (req, res) => {
  corsMiddleware(req, res, async () => {
    const { period = '7d' } = req.query;

    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    if (period === '24h') startDate.setHours(startDate.getHours() - 24);

    // Aggregate all metrics
    const [searches, events, performance, interests] = await Promise.all([
      // Search metrics
      analyticsDb.collection('searches').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            avgResults: { $avg: '$resultsCount' },
            zeroResults: {
              $sum: { $cond: [{ $eq: ['$resultsCount', 0] }, 1, 0] }
            }
          }
        }
      ]).toArray(),

      // User engagement
      analyticsDb.collection('events').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Performance
      analyticsDb.collection('performance').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$endpoint',
            avgDuration: { $avg: '$duration' },
            maxDuration: { $max: '$duration' },
            requests: { $sum: 1 }
          }
        },
        { $sort: { avgDuration: -1 } }
      ]).toArray(),

      // Collaboration interests
      client.db(configManager.getDbName()).collection('interests').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    res.json({
      period,
      searches: searches[0] || {},
      engagement: events,
      performance,
      interests
    });
  });
});
```

### **Frontend Dashboard**

```handlebars
<!-- /admin-analytics/ page -->
<div class="analytics-dashboard">
  <h1>Platform Analytics</h1>

  <div class="time-selector">
    <button onclick="loadDashboard('24h')">Last 24h</button>
    <button onclick="loadDashboard('7d')" class="active">Last 7 days</button>
    <button onclick="loadDashboard('30d')">Last 30 days</button>
  </div>

  <div class="metrics-grid">
    <!-- Search Metrics -->
    <div class="metric-card">
      <h3>Search Performance</h3>
      <div class="stat-row">
        <span class="label">Total Searches:</span>
        <span class="value">{{searches.totalSearches}}</span>
      </div>
      <div class="stat-row">
        <span class="label">Avg Results:</span>
        <span class="value">{{round searches.avgResults}}</span>
      </div>
      <div class="stat-row">
        <span class="label">Zero Results:</span>
        <span class="value {{#if (gt searches.zeroResults 10)}}warning{{/if}}">
          {{searches.zeroResults}}
        </span>
      </div>
    </div>

    <!-- Engagement Metrics -->
    <div class="metric-card">
      <h3>User Engagement</h3>
      {{#each engagement}}
      <div class="stat-row">
        <span class="label">{{formatEventType _id}}:</span>
        <span class="value">{{count}}</span>
      </div>
      {{/each}}
    </div>

    <!-- Performance Metrics -->
    <div class="metric-card">
      <h3>API Performance</h3>
      {{#each performance}}
      <div class="stat-row">
        <span class="label">{{_id}}:</span>
        <span class="value {{#if (gt avgDuration 500)}}warning{{/if}}">
          {{round avgDuration}}ms
        </span>
        <span class="secondary">({{requests}} req)</span>
      </div>
      {{/each}}
    </div>

    <!-- Interest Funnel -->
    <div class="metric-card">
      <h3>Collaboration Funnel</h3>
      {{#each interests}}
      <div class="stat-row">
        <span class="label">{{formatStatus _id}}:</span>
        <span class="value">{{count}}</span>
      </div>
      {{/each}}
    </div>
  </div>

  <!-- Top Searches -->
  <div class="top-queries">
    <h2>Top Search Queries</h2>
    <ol id="top-queries-list"></ol>
  </div>

  <!-- Popular Companies -->
  <div class="popular-companies">
    <h2>Most Viewed Companies</h2>
    <ol id="popular-companies-list"></ol>
  </div>
</div>

<script>
async function loadDashboard(period) {
  const response = await fetch(`/api/analytics/dashboard?period=${period}`);
  const data = await response.json();

  // Update UI with data
  updateMetrics(data);
}

function updateMetrics(data) {
  // Update metric cards
  document.querySelector('.searches .value').textContent = data.searches.totalSearches;
  // ... etc
}
</script>
```

---

## 🚨 Quick Win: Error Tracking

```javascript
// Global error handler for frontend
window.addEventListener('error', (event) => {
  fetch('/api/analytics/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  });
});

// Backend error logging
functions.http('logError', async (req, res) => {
  corsMiddleware(req, res, async () => {
    await analyticsDb.collection('errors').insertOne({
      timestamp: new Date(),
      ...req.body
    });

    res.json({ success: true });
  });
});
```

---

## ✅ Quick Implementation Checklist

### **Day 1: Search Analytics**
- [ ] Add analytics database/collection
- [ ] Update search endpoint with logging
- [ ] Add search click tracking
- [ ] Test analytics data collection

### **Day 2: Engagement Tracking**
- [ ] Create generic event tracking endpoint
- [ ] Add analytics.js helper
- [ ] Instrument key user actions
- [ ] Test event logging

### **Day 3: Monitoring**
- [ ] Add health check endpoint
- [ ] Set up UptimeRobot monitors
- [ ] Add performance tracking middleware
- [ ] Configure alert emails

### **Day 4: Dashboard**
- [ ] Create admin analytics endpoint
- [ ] Build basic dashboard UI
- [ ] Test all metrics display
- [ ] Add export functionality

---

## 📊 Example Queries for Insights

```javascript
// 1. Most popular companies (by views)
db.events.aggregate([
  { $match: { eventType: 'company_view' } },
  { $group: { _id: '$resourceId', views: { $sum: 1 } } },
  { $sort: { views: -1 } },
  { $limit: 10 }
]);

// 2. Search to action conversion
db.search_clicks.aggregate([
  {
    $lookup: {
      from: 'interests',
      localField: 'companyId',
      foreignField: 'companyId',
      as: 'interests'
    }
  },
  {
    $project: {
      hasInterest: { $gt: [{ $size: '$interests' }, 0] }
    }
  }
]);

// 3. Member engagement score
db.events.aggregate([
  { $match: { memberId: { $ne: null } } },
  {
    $group: {
      _id: '$memberId',
      eventCount: { $sum: 1 },
      eventTypes: { $addToSet: '$eventType' }
    }
  },
  { $sort: { eventCount: -1 } }
]);
```

---

**Next Steps:**
1. Start with search analytics (highest value, lowest effort)
2. Add basic monitoring (critical for ops)
3. Layer in engagement tracking as you add collaboration features
4. Iterate dashboard based on what insights you actually use

**Tools Stack:**
- Analytics: MongoDB (already have it)
- Monitoring: UptimeRobot or Better Stack (free)
- Visualization: Custom dashboard (using existing theme)
- Future: Metabase or Grafana for advanced analytics

---

**Total implementation time:** 2-3 days for full observability suite.
