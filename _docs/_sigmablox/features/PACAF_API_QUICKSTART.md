# PACAF API Quick Start Guide

## Files Created

### Core Implementation
1. **`/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-api.js`**
   - Complete Express.js API implementation
   - All 8 endpoints with authentication and error handling
   - Program matching algorithm with scoring logic
   - MongoDB integration using existing patterns

2. **`/Users/paulgarcia/Dev/sigmablox/webhook/local-server.js`** (Modified)
   - Added PACAF routes integration (lines 6623-6672)
   - Follows existing auth middleware patterns
   - Uses rate limiting for protected endpoints

3. **`/Users/paulgarcia/Dev/sigmablox/webhook/load-pacaf-data.js`**
   - Data loader script for initial setup
   - Loads 13 PACAF programs into MongoDB
   - Creates necessary indexes
   - One-time setup utility

### Documentation
4. **`/Users/paulgarcia/Dev/sigmablox/_docs/features/PACAF_API_DOCUMENTATION.md`**
   - Complete API reference with examples
   - Authentication patterns
   - Request/response formats
   - Error handling

5. **`/Users/paulgarcia/Dev/sigmablox/_docs/features/pacaf-data-seed.json`** (Existing)
   - 13 PACAF programs with full details
   - Tags, keywords, and metadata
   - Prime contractor mappings

6. **`/Users/paulgarcia/Dev/sigmablox/_docs/features/pacaf-hub-technical-spec.md`** (Existing)
   - Technical architecture specification
   - Database schema
   - Integration patterns

## Quick Setup (5 Minutes)

### 1. Load Data into MongoDB

```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
node load-pacaf-data.js
```

**Expected Output:**
```
📦 Connecting to MongoDB...
✅ Connected to MongoDB
📄 Loading data from: .../pacaf-data-seed.json
📊 Found 13 programs to load
  → Loading: Multi-Capable Airman (MCA) Programt34
  → Loading: Cyber Collaboration & Exchange Program (CCEP)
  ...
✅ Successfully loaded 13 programs
```

### 2. Start the Server

```bash
node local-server.js
```

**Expected Output:**
```
🚀 Webhook server running on port 3000
📦 Using database: sigmablox_users_dev
```

### 3. Test the API

```bash
# List all programs
curl http://localhost:3000/api/pacaf/programs

# Get specific program
curl http://localhost:3000/api/pacaf/programs/mca-001

# Search (with authentication)
curl -H "x-member-email: test@example.com" \
  http://localhost:3000/api/pacaf/search?query=training
```

## API Endpoints Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/pacaf/programs` | GET | Optional | List all programs |
| `/api/pacaf/programs/:id` | GET | Optional | Get program details |
| `/api/pacaf/matcher/assess` | POST | Required | Submit capability assessment |
| `/api/pacaf/matcher/results/:assessmentId` | GET | Required | Get assessment results |
| `/api/pacaf/profile/update` | POST | Required | Update PACAF profile |
| `/api/pacaf/opportunities` | GET | Optional | Get SBIR opportunities |
| `/api/pacaf/notifications/preferences` | POST | Required | Update notifications |
| `/api/pacaf/search` | GET | Optional | Advanced search |

## Key Features

### 1. Program Matching Algorithm
- **Technology Alignment**: 40 points max
- **Experience Bonus**: 20 points max
- **Stage Appropriateness**: 20 points max
- **Security Clearance**: 10 points max
- **Timeframe Alignment**: 10 points max

### 2. Authentication
Uses existing Ghost member authentication:
- Cookie: `ghost-members-ssr`
- Header: `x-ghost-session`
- Header: `x-member-email` (dev only)

### 3. Data Collections
- `pacaf_programs` - Program definitions
- `pacaf_assessments` - User assessments
- `company_pacaf_profiles` - Company PACAF data
- `coach_pacaf_profiles` - Coach expertise
- `pacaf_notifications` - Notification queue
- `notification_preferences` - User preferences
- `sbir_pacaf_relevance` - SBIR mappings

## Integration Patterns

### With Existing Auth Middleware
```javascript
const auth = require('./auth-middleware-simple');

// Optional auth (public + enhanced for members)
app.get('/api/pacaf/programs', auth.optionalAuth(), async (req, res) => {
  // req.member will be populated if logged in
});

// Required auth
app.post('/api/pacaf/matcher/assess', auth.requireAuth(), async (req, res) => {
  // req.member.email available
});
```

### With MongoDB
```javascript
const db = this.client.db(this.dbName);
const collection = db.collection('pacaf_programs');
const programs = await collection.find({}).toArray();
```

### With Rate Limiting
```javascript
const { rateLimiters } = require('./rate-limit-config');

app.post('/api/pacaf/matcher/assess',
  auth.requireAuth(),
  rateLimiters.api,  // 100 req/min
  async (req, res) => { ... }
);
```

## Example Usage

### Submit Assessment & Get Matches

```javascript
// POST /api/pacaf/matcher/assess
const response = await fetch('http://localhost:3000/api/pacaf/matcher/assess', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-member-email': 'user@company.com'
  },
  body: JSON.stringify({
    responses: {
      technologyAreas: ['AI/ML', 'Training & Simulation'],
      companyStage: 'Growth',
      hasGovernmentExperience: true,
      hasSBIRExperience: true,
      targetTimeframe: '6-12 months',
      securityClearance: 'Secret'
    }
  })
});

const data = await response.json();
console.log('Top matches:', data.matches);
// [
//   {
//     programId: 'mca-001',
//     programName: 'Multi-Capable Airman (MCA) Program',
//     matchScore: 87,
//     alignmentFactors: [...],
//     recommendedNextSteps: [...]
//   }
// ]
```

### Search Programs

```javascript
// GET /api/pacaf/search
const response = await fetch(
  'http://localhost:3000/api/pacaf/search?' + new URLSearchParams({
    query: 'cybersecurity',
    techAreas: 'Cybersecurity & Communications',
    limit: '20'
  })
);

const data = await response.json();
console.log('Results:', data.results);
// {
//   programs: [...],
//   companies: [...],
//   coaches: [...]
// }
```

### Update Profile

```javascript
// POST /api/pacaf/profile/update
const response = await fetch('http://localhost:3000/api/pacaf/profile/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-member-email': 'user@company.com'
  },
  body: JSON.stringify({
    capabilities: {
      technologyAreas: ['AI/ML', 'Cybersecurity & Communications']
    },
    readiness: {
      hasGovernmentExperience: true,
      securityClearance: 'Secret'
    },
    interestedPrograms: ['mca-001', 'ccep-001']
  })
});
```

## MongoDB Queries

### Find Programs by Tech Area
```javascript
db.pacaf_programs.find({
  techFocusAreas: 'Training & Simulation'
})
```

### Find High-Score Matches
```javascript
db.pacaf_assessments.find({
  'matchScores': {
    $elemMatch: { matchScore: { $gte: 70 } }
  }
}).sort({ timestamp: -1 })
```

### Find Companies Interested in Program
```javascript
db.company_pacaf_profiles.find({
  interestedPrograms: 'mca-001'
})
```

## Next Steps

### Frontend Development
1. Build program listing page (`/pacaf/programs`)
2. Build program detail page (`/pacaf/programs/:slug`)
3. Build assessment quiz (`/pacaf/matcher`)
4. Build results dashboard
5. Build profile management UI

### Backend Enhancements
1. Implement SBIR keyword matching and tagging
2. Build notification triggers
3. Create email templates
4. Add analytics tracking
5. Implement caching for frequently accessed programs

### Testing
1. Unit tests for matching algorithm
2. Integration tests for API endpoints
3. Load testing for assessment endpoint
4. E2E tests for complete user flows

## Troubleshooting

### Data Not Loading
```bash
# Check MongoDB connection
node -e "require('./webhook/config-manager').getMongoUri(); console.log('URI OK')"

# Verify data file exists
ls -la _docs/features/pacaf-data-seed.json

# Run loader with verbose output
node webhook/load-pacaf-data.js
```

### Auth Issues
```bash
# Test with member email header
curl -H "x-member-email: test@example.com" \
  http://localhost:3000/api/pacaf/programs

# Check auth middleware
node -e "require('./webhook/auth-middleware-simple'); console.log('Auth OK')"
```

### Rate Limiting
```bash
# Check rate limit headers in response
curl -i http://localhost:3000/api/pacaf/programs | grep -i rate
```

## Support

- Technical Issues: paul@sigmablox.com
- Documentation: `/Users/paulgarcia/Dev/sigmablox/_docs/features/`
- API Reference: `PACAF_API_DOCUMENTATION.md`

## Files Reference

```
sigmablox/
├── webhook/
│   ├── pacaf-api.js                    # Main API implementation
│   ├── local-server.js                 # Server with PACAF routes
│   ├── load-pacaf-data.js              # Data loader script
│   ├── auth-middleware-simple.js       # Auth (existing)
│   ├── config-manager.js               # Config (existing)
│   └── lib/
│       └── favorites-utils.js          # Shared utils (existing)
└── _docs/
    └── features/
        ├── PACAF_API_DOCUMENTATION.md   # Full API docs
        ├── PACAF_API_QUICKSTART.md      # This file
        ├── pacaf-data-seed.json         # Program data
        └── pacaf-hub-technical-spec.md  # Tech spec
```
