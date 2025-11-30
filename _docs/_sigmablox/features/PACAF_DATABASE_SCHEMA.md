# PACAF Database Schema Documentation

**Version:** 1.0
**Last Updated:** 2025-11-18
**Database:** MongoDB
**Implementation:** `/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-setup.js`

## Overview

This document describes the MongoDB database schema for the PACAF (Pacific Air Forces) Intelligence Hub matching engine. The schema supports program discovery, capability assessment, company-program matching, SBIR integration, and intelligent notifications.

## Collections

### 1. `pacaf_programs`

Stores PACAF program definitions and details.

**Schema:**
```javascript
{
  _id: ObjectId,
  id: String,                    // Unique program identifier (e.g., "mca-001")
  slug: String,                  // URL-friendly slug (e.g., "multi-capable-airman")
  name: String,                  // Program name
  category: String,              // "high-priority" | "additional-opportunity"

  // Program Details
  overview: String,              // Program description
  problemNeed: [String],         // Array of problem statements
  objectives: [String],          // Program objectives

  // Technology & Requirements
  techFocusAreas: [String],      // Technology categories
  specificTechnologies: [String],// Specific tech needed
  warfareDomain: String,         // Air, Land, Sea, Space, Cyber, Multi-Domain

  // Organizational
  managedBy: String,             // Managing base/organization
  engagementPathways: [String],  // How to engage (SBIR, OTA, etc.)
  typesOfCompaniesNeeded: [String],

  // Financial & Timeline
  budgetRange: String,           // e.g., "$622M+"
  typicalTimeToAward: String,    // e.g., "6-12 months"
  fundingInitiatives: [{
    title: String,
    amount: String,
    description: String,
    link: String
  }],

  // Relationships
  relatedPrimes: [String],       // Prime contractor names
  suitableStages: [String],      // ["Early Stage", "Growth", "Established"]

  // Requirements
  requiresClearance: Boolean,

  // Metadata
  opportunityDescription: String,
  lastUpdated: Date,
  status: String,                // "active" | "inactive" | "archived"
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ id: 1 }` - Unique
- `{ slug: 1 }` - Unique
- `{ category: 1 }`
- `{ category: 1, status: 1 }` - Compound
- `{ techFocusAreas: 1 }`
- Text index on: `name`, `overview`, `problemNeed`, `objectives`, `specificTechnologies`

---

### 2. `pacaf_assessments`

Stores user capability assessments and quiz results.

**Schema:**
```javascript
{
  _id: ObjectId,
  assessmentId: String,          // Unique assessment ID

  // User Info
  userEmail: String,             // User's email
  userId: String,                // Optional: Ghost member ID
  companyId: String,             // Optional: Associated company

  // Assessment Data
  responses: {
    technologyAreas: [{
      area: String,              // Technology area
      proficiencyLevel: Number,  // 0-4 scale
      description: String        // Details about capability
    }],
    domains: [String],           // Warfare domains
    companyStage: String,        // "Early Stage", "Growth", "Established"
    clearanceLevel: String,      // Current clearance level
    sbirExperience: Boolean,
    contractVehicles: [String],
    targetPrograms: [String]     // Optional: Pre-selected interests
  },

  // Results
  programMatches: [{
    programId: String,
    programName: String,
    matchScore: Number,          // 0-100
    matchReason: String,         // Why they matched
    alignedCapabilities: [String]
  }],

  // Metadata
  completedAt: Date,
  status: String,                // "completed" | "in_progress" | "abandoned"
  timeToComplete: Number,        // Seconds
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ userEmail: 1, assessmentId: 1 }` - Unique compound
- `{ userEmail: 1, completedAt: -1 }`
- `{ companyId: 1, completedAt: -1 }`
- `{ status: 1 }`

---

### 3. `company_pacaf_profiles`

Extended PACAF data for companies (supplements `companies` collection).

**Schema:**
```javascript
{
  _id: ObjectId,
  companyId: String,             // Reference to companies collection
  airtableId: String,            // Reference to Airtable record

  // Capabilities
  capabilities: {
    technologyAreas: [String],   // Primary tech areas
    specificCapabilities: [{
      name: String,
      description: String,
      trlLevel: Number,          // 1-9
      keywords: [String]
    }],
    domains: [String],           // Warfare domains
    successStories: [String]
  },

  // PACAF-Specific
  targetedPrograms: [{
    programId: String,
    programName: String,
    matchScore: Number,          // 0-100
    priority: Number,            // User-set priority
    notes: String,
    addedAt: Date
  }],

  // Government Readiness
  governmentReadiness: {
    clearanceLevel: String,
    hasSBIRExperience: Boolean,
    sbirPhaseIIReady: Boolean,
    contractVehicles: [String],  // "IDIQ", "OTA", etc.
    cageCode: String,
    ueiNumber: String,
    hasATO: Boolean
  },

  // Engagement History
  pacafEngagement: {
    hasEngaged: Boolean,
    engagementType: [String],    // "SBIR", "OTA", "Direct", etc.
    contactHistory: [{
      date: Date,
      type: String,
      notes: String
    }]
  },

  // Metadata
  profileCompleteness: Number,   // 0-100 percentage
  lastAssessmentId: String,      // Reference to latest assessment
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ companyId: 1 }` - Unique
- `{ airtableId: 1 }`
- `{ 'targetedPrograms.programId': 1, 'targetedPrograms.matchScore': -1 }` - Compound
- `{ 'capabilities.technologyAreas': 1 }`
- `{ 'governmentReadiness.clearanceLevel': 1 }`
- `{ updatedAt: -1 }`

---

### 4. `coach_pacaf_profiles`

PACAF expertise data for coaches (supplements `coaches` collection).

**Schema:**
```javascript
{
  _id: ObjectId,
  coachId: String,               // Reference to coaches collection
  airtableId: String,            // Reference to Airtable record
  email: String,                 // Coach email
  name: String,                  // Coach name

  // PACAF Expertise
  programExpertise: [{
    programId: String,
    programName: String,
    expertiseLevel: Number,      // 0-4 scale
    companiesHelped: Number,
    successRate: Number,         // Percentage
    notes: String
  }],

  // Specialty Areas
  specialtyAreas: [String],      // Tech focus areas
  engagementPathways: [String],  // SBIR, OTA expertise
  domains: [String],             // Warfare domain expertise

  // Track Record
  successStories: [{
    companyName: String,
    programName: String,
    outcome: String,             // "Contract won", "SBIR Phase II", etc.
    date: Date,
    testimonial: String
  }],

  // Availability
  availability: {
    acceptingClients: Boolean,
    capacity: String,            // "Limited", "Available", "Full"
    responseTime: String,        // "24 hours", "1 week", etc.
    preferredContact: String
  },

  // Metadata
  bio: String,
  profileCompleteness: Number,   // 0-100 percentage
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ coachId: 1 }` - Unique
- `{ email: 1 }` - Unique, sparse
- `{ airtableId: 1 }`
- `{ 'programExpertise.programId': 1, 'programExpertise.expertiseLevel': -1 }` - Compound
- `{ specialtyAreas: 1 }`
- Text index on: `name`, `bio`, `specialtyAreas`, `successStories`

---

### 5. `tags`

Tag definitions for categorizing entities.

**Schema:**
```javascript
{
  _id: ObjectId,
  id: String,                    // Unique tag ID (e.g., "tag-mca")
  label: String,                 // Display name
  category: String,              // "program" | "technology" | "stage" | "expertise" | "domain"
  color: String,                 // Hex color code
  description: String,
  icon: String,                  // Optional icon name
  metadata: Object,              // Additional tag data
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ id: 1 }` - Unique
- `{ label: 1, category: 1 }` - Unique compound
- `{ category: 1 }`

---

### 6. `entity_tags`

Tag relationships to entities (companies, coaches, programs, SBIRs).

**Schema:**
```javascript
{
  _id: ObjectId,
  entityType: String,            // "company" | "coach" | "program" | "sbir"
  entityId: String,              // ID of the tagged entity
  tagId: String,                 // Reference to tags collection

  // Tag Application
  autoApplied: Boolean,          // Was this auto-applied by system?
  appliedBy: String,             // User ID who applied (if manual)
  appliedAt: Date,
  confidence: Number,            // 0-100 (for auto-applied tags)

  // Context
  context: {
    reason: String,              // Why tag was applied
    sourceField: String,         // Which field triggered auto-tagging
    keywords: [String]           // Keywords that matched
  },

  // Metadata
  createdAt: Date
}
```

**Indexes:**
- `{ entityType: 1, entityId: 1, tagId: 1 }` - Unique compound
- `{ entityType: 1, entityId: 1 }`
- `{ tagId: 1 }`
- `{ autoApplied: 1, appliedAt: -1 }`

---

### 7. `pacaf_notifications`

User notifications for PACAF events.

**Schema:**
```javascript
{
  _id: ObjectId,
  notificationId: String,        // Unique notification ID

  // Recipient
  userId: String,                // Ghost member ID or email
  userEmail: String,

  // Notification Details
  type: String,                  // "new_sbir" | "program_update" | "match_suggestion" | "budget_change" | "new_opportunity"
  title: String,
  message: String,

  // Related Entity
  relatedEntity: {
    type: String,                // "program" | "sbir" | "company"
    id: String,
    name: String
  },

  // Action
  actionUrl: String,             // Where to go when clicked
  actionLabel: String,           // "View Program", "Apply Now", etc.

  // State
  read: Boolean,
  readAt: Date,
  dismissed: Boolean,
  dismissedAt: Date,

  // Metadata
  priority: String,              // "high" | "medium" | "low"
  expiresAt: Date,              // Optional expiration
  createdAt: Date               // TTL index: auto-delete after 90 days
}
```

**Indexes:**
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, read: 1, createdAt: -1 }` - Compound
- `{ type: 1, createdAt: -1 }`
- `{ 'relatedEntity.type': 1, 'relatedEntity.id': 1 }` - Compound
- `{ createdAt: 1 }` - TTL index (90 days)

---

### 8. `notification_preferences`

User notification preferences.

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: String,                // Ghost member ID
  email: String,                 // User email

  // Channel Preferences
  channels: {
    email: Boolean,
    inApp: Boolean,
    push: Boolean
  },

  // Notification Type Preferences
  preferences: {
    newSBIR: {
      enabled: Boolean,
      frequency: String,         // "immediate" | "daily" | "weekly" | "never"
      channels: [String]
    },
    programUpdate: {
      enabled: Boolean,
      frequency: String,
      channels: [String]
    },
    matchSuggestion: {
      enabled: Boolean,
      frequency: String,
      channels: [String]
    },
    budgetChange: {
      enabled: Boolean,
      frequency: String,
      channels: [String]
    },
    newOpportunity: {
      enabled: Boolean,
      frequency: String,
      channels: [String]
    }
  },

  // Filters
  filters: {
    minMatchScore: Number,       // Only notify for matches above this score
    programIds: [String],        // Only notify for these programs
    technologyAreas: [String]    // Only notify for these tech areas
  },

  // Digest Settings
  digestSettings: {
    dayOfWeek: Number,           // 0-6 for weekly digest
    timeOfDay: String,           // "09:00" for daily digest
    timezone: String             // User's timezone
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ userId: 1 }` - Unique
- `{ email: 1 }` - Unique, sparse

---

### 9. `sbir_pacaf_relevance`

SBIR opportunity relevance to PACAF programs.

**Schema:**
```javascript
{
  _id: ObjectId,

  // SBIR Reference
  sbirId: String,                // ID from SBIR scraper
  sbirTitle: String,
  sbirDescription: String,
  sbirAgency: String,
  sbirTopic: String,
  sbirDeadline: Date,
  sbirUrl: String,

  // PACAF Program Reference
  programId: String,             // Reference to pacaf_programs
  programName: String,

  // Matching Analysis
  relevanceScore: Number,        // 0-100
  matchedKeywords: [String],     // Keywords that matched
  matchReason: String,           // Human-readable explanation
  matchStatus: String,           // "pending" | "confirmed" | "rejected"

  // Analysis Details
  analysis: {
    technologyAlignment: Number, // 0-100
    problemAlignment: Number,    // 0-100
    domainAlignment: Number,     // 0-100
    budgetAlignment: Number,     // 0-100
    timelineAlignment: Number    // 0-100
  },

  // Feedback
  feedback: {
    confirmedBy: String,         // User who confirmed/rejected
    confirmedAt: Date,
    notes: String
  },

  // Metadata
  lastAnalyzedAt: Date,
  notificationsSent: Number,     // How many notifications sent
  viewCount: Number,             // How many times viewed
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ sbirId: 1, programId: 1 }` - Unique compound
- `{ sbirId: 1, relevanceScore: -1 }`
- `{ programId: 1, relevanceScore: -1 }`
- `{ matchStatus: 1, relevanceScore: -1 }` - Compound
- `{ lastAnalyzedAt: -1 }`

---

## Usage Examples

### Create a New Program
```javascript
await db.collection('pacaf_programs').insertOne({
  id: 'mca-001',
  slug: 'multi-capable-airman',
  name: 'Multi-Capable Airman (MCA) Program',
  category: 'high-priority',
  techFocusAreas: ['Training & Simulation'],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
  // ... other fields
});
```

### Record an Assessment
```javascript
await db.collection('pacaf_assessments').insertOne({
  assessmentId: `assess_${Date.now()}`,
  userEmail: 'user@company.com',
  responses: {
    technologyAreas: [
      { area: 'AI/ML', proficiencyLevel: 3, description: 'Computer vision expertise' }
    ],
    companyStage: 'Growth'
  },
  programMatches: [
    { programId: 'mca-001', matchScore: 85, matchReason: 'Strong AI/ML capabilities' }
  ],
  completedAt: new Date(),
  status: 'completed'
});
```

### Find Top Matches for a Program
```javascript
const topCompanies = await db.collection('company_pacaf_profiles')
  .find({ 'targetedPrograms.programId': 'mca-001' })
  .sort({ 'targetedPrograms.matchScore': -1 })
  .limit(10)
  .toArray();
```

### Auto-Apply Tags
```javascript
// When a company adds SBIR experience
await db.collection('entity_tags').insertOne({
  entityType: 'company',
  entityId: 'company_123',
  tagId: 'tag-sbir-2',
  autoApplied: true,
  appliedAt: new Date(),
  confidence: 95,
  context: {
    reason: 'Company has SBIR Phase II experience',
    sourceField: 'governmentReadiness.sbirPhaseIIReady'
  }
});
```

### Send Notification
```javascript
await db.collection('pacaf_notifications').insertOne({
  notificationId: `notif_${Date.now()}`,
  userId: 'user_123',
  userEmail: 'user@company.com',
  type: 'new_sbir',
  title: 'New SBIR Opportunity Matches Your Profile',
  message: 'A new SBIR topic aligns with Multi-Capable Airman program',
  relatedEntity: {
    type: 'sbir',
    id: 'sbir_456',
    name: 'AI Training Simulation'
  },
  actionUrl: '/pacaf/programs/mca-001',
  actionLabel: 'View Details',
  read: false,
  priority: 'high',
  createdAt: new Date()
});
```

---

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd /Users/paulgarcia/Dev/sigmablox/webhook
   npm install
   ```

2. **Configure MongoDB:**
   Ensure `config-manager.js` has correct MongoDB URI and database name.

3. **Run Setup Script:**
   ```bash
   node webhook/pacaf-setup.js
   ```

4. **Verify Collections:**
   Check MongoDB to ensure all 9 collections exist with proper indexes.

5. **Seed Initial Data:**
   ```bash
   node webhook/pacaf-seed-data.js  # (To be created)
   ```

---

## Related Files

- **Constants:** `/Users/paulgarcia/Dev/sigmablox/webhook/lib/pacaf-constants.js`
- **Setup Script:** `/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-setup.js`
- **Overview Doc:** `/Users/paulgarcia/Dev/sigmablox/_docs/features/MATCHING_ENGINE_OVERVIEW.md`

---

## Future Enhancements

1. **Full-text search** across all collections
2. **Machine learning** for improved matching scores
3. **Historical tracking** of match accuracy
4. **Coach recommendation engine**
5. **Integration with external data sources** (USASpending, SAM.gov)
6. **Analytics dashboard** for program popularity and success rates

---

## Notes

- All dates use MongoDB `Date` type (UTC)
- Scores are normalized 0-100
- TTL index on notifications auto-deletes after 90 days
- Sparse indexes allow optional fields
- Text indexes enable natural language search
- Compound indexes optimize common query patterns

**End of Schema Documentation**
