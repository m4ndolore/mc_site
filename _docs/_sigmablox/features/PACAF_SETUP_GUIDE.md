# PACAF Database Setup Guide

Quick reference for setting up and using the PACAF MongoDB database schema.

## Files Created

1. **`/Users/paulgarcia/Dev/sigmablox/webhook/lib/pacaf-constants.js`** (4.9KB)
   - Collection names
   - Enums and constants
   - Validation functions
   - Match scoring utilities

2. **`/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-setup.js`** (15KB)
   - Executable setup script
   - Creates all 9 collections
   - Creates 40+ performance indexes
   - Verification and status reporting

3. **`/Users/paulgarcia/Dev/sigmablox/_docs/features/PACAF_DATABASE_SCHEMA.md`** (17KB)
   - Complete schema documentation
   - All 9 collections detailed
   - Usage examples
   - Index specifications

## Quick Start

### 1. Run Setup Script

```bash
cd /Users/paulgarcia/Dev/sigmablox
node webhook/pacaf-setup.js
```

**Expected Output:**
```
✅ Connected to MongoDB

📋 Creating pacaf_programs collection...
  ✅ Created unique index: program_id_unique
  ✅ Created unique index: program_slug_unique
  ... (40+ indexes total)

🎉 PACAF MongoDB setup completed successfully!
```

### 2. Verify Collections

The script creates these 9 collections:

| Collection | Purpose | Key Indexes |
|------------|---------|-------------|
| `pacaf_programs` | Program definitions | `id`, `slug`, `category`, text search |
| `pacaf_assessments` | User assessments | `userEmail + assessmentId`, company lookups |
| `company_pacaf_profiles` | Company PACAF data | `companyId`, targeted programs, capabilities |
| `coach_pacaf_profiles` | Coach PACAF expertise | `coachId`, `email`, program expertise |
| `tags` | Tag definitions | `id`, `label + category` |
| `entity_tags` | Tag relationships | `entityType + entityId + tagId` |
| `pacaf_notifications` | User notifications | `userId`, read status, TTL (90 days) |
| `notification_preferences` | User settings | `userId`, `email` |
| `sbir_pacaf_relevance` | SBIR-program matching | `sbirId + programId`, relevance scores |

### 3. Import Constants in Your Code

```javascript
const {
  COLLECTIONS,
  TECH_FOCUS_AREAS,
  PROGRAM_CATEGORIES,
  isValidMatchScore,
  getMatchScoreTier
} = require('./lib/pacaf-constants');

// Use in your code
const programsCollection = db.collection(COLLECTIONS.PACAF_PROGRAMS);
```

## Common Operations

### Query Programs by Category

```javascript
const { COLLECTIONS, PROGRAM_CATEGORIES } = require('./lib/pacaf-constants');

const highPriorityPrograms = await db
  .collection(COLLECTIONS.PACAF_PROGRAMS)
  .find({
    category: PROGRAM_CATEGORIES.HIGH_PRIORITY,
    status: 'active'
  })
  .toArray();
```

### Save Assessment Results

```javascript
const { COLLECTIONS } = require('./lib/pacaf-constants');

await db.collection(COLLECTIONS.PACAF_ASSESSMENTS).insertOne({
  assessmentId: `assess_${Date.now()}`,
  userEmail: 'user@company.com',
  responses: {
    technologyAreas: [
      { area: 'AI/ML', proficiencyLevel: 3, description: '...' }
    ]
  },
  programMatches: [
    { programId: 'mca-001', matchScore: 85, matchReason: '...' }
  ],
  completedAt: new Date(),
  status: 'completed'
});
```

### Find Companies Targeting a Program

```javascript
const { COLLECTIONS } = require('./lib/pacaf-constants');

const companies = await db
  .collection(COLLECTIONS.COMPANY_PACAF_PROFILES)
  .find({ 'targetedPrograms.programId': 'mca-001' })
  .sort({ 'targetedPrograms.matchScore': -1 })
  .limit(10)
  .toArray();
```

### Auto-Apply Tags

```javascript
const { COLLECTIONS, ENTITY_TYPES } = require('./lib/pacaf-constants');

await db.collection(COLLECTIONS.ENTITY_TAGS).insertOne({
  entityType: ENTITY_TYPES.COMPANY,
  entityId: 'company_123',
  tagId: 'tag-sbir-2',
  autoApplied: true,
  confidence: 95,
  appliedAt: new Date(),
  context: {
    reason: 'Company has SBIR Phase II experience',
    sourceField: 'governmentReadiness.sbirPhaseIIReady'
  }
});
```

### Send Notification

```javascript
const { COLLECTIONS, NOTIFICATION_TYPES } = require('./lib/pacaf-constants');

await db.collection(COLLECTIONS.PACAF_NOTIFICATIONS).insertOne({
  notificationId: `notif_${Date.now()}`,
  userId: 'user_123',
  type: NOTIFICATION_TYPES.NEW_SBIR,
  title: 'New SBIR Matches Your Profile',
  message: '...',
  relatedEntity: {
    type: 'sbir',
    id: 'sbir_456',
    name: 'AI Training Simulation'
  },
  read: false,
  priority: 'high',
  createdAt: new Date()
});
```

## Index Performance

The setup script creates **40+ indexes** for optimal query performance:

- **Unique indexes:** Prevent duplicates (e.g., `program_id_unique`, `user_assessment_unique`)
- **Compound indexes:** Optimize multi-field queries (e.g., `category + status`)
- **Text indexes:** Enable full-text search on programs and coaches
- **TTL index:** Auto-delete old notifications after 90 days

## Next Steps

1. **Seed Program Data**
   - Create `webhook/pacaf-seed-data.js` to populate initial programs
   - Use data from `MATCHING_ENGINE_OVERVIEW.md`

2. **Build API Endpoints**
   - Add routes to `webhook/index.js` for PACAF operations
   - Follow existing patterns from `getCoaches`, `getCohorts`, etc.

3. **Integrate with Existing Collections**
   - Link `company_pacaf_profiles.companyId` to `companies._id`
   - Link `coach_pacaf_profiles.coachId` to `coaches._id`

4. **SBIR Integration**
   - Connect to existing SBIR scraper at mergecombinator.com/sbir
   - Auto-populate `sbir_pacaf_relevance` collection
   - Trigger notifications for relevant matches

5. **Frontend Components**
   - Program matcher quiz
   - Results display
   - Company profile PACAF section
   - Coach profile PACAF expertise

## Validation Utilities

The constants file includes validation functions:

```javascript
const {
  isValidMatchScore,
  getMatchScoreTier,
  isValidProgramCategory
} = require('./lib/pacaf-constants');

// Validate match score
if (!isValidMatchScore(score)) {
  throw new Error('Invalid match score');
}

// Get tier label
const tier = getMatchScoreTier(85); // Returns "Excellent"

// Validate category
if (!isValidProgramCategory(category)) {
  throw new Error('Invalid program category');
}
```

## Troubleshooting

### Connection Issues

```bash
# Check MongoDB connection
mongo "mongodb+srv://cluster9.wed5fxa.mongodb.net/" --username magnuzno
```

### Index Conflicts

If indexes already exist:

```javascript
// Drop and recreate
await db.collection('pacaf_programs').dropIndexes();
// Then re-run setup script
```

### Verification

```javascript
// Check collection exists
const collections = await db.listCollections().toArray();
console.log(collections.map(c => c.name));

// Check indexes
const indexes = await db.collection('pacaf_programs').indexes();
console.log(indexes);
```

## Pattern Consistency

This implementation follows the existing codebase patterns:

✅ **Similar to `favorites-utils.js`:**
- Constants file for collection names and enums
- Validation functions
- Normalized field access

✅ **Similar to `create-favorites-indexes.js`:**
- Executable setup script
- Index creation with verification
- Clear console output

✅ **Similar to `airtable-sync.js`:**
- MongoDB connection management
- Collection operations
- Error handling

## Reference Documents

- **Full Schema:** `/Users/paulgarcia/Dev/sigmablox/_docs/features/PACAF_DATABASE_SCHEMA.md`
- **Overview:** `/Users/paulgarcia/Dev/sigmablox/_docs/features/MATCHING_ENGINE_OVERVIEW.md`
- **Constants:** `/Users/paulgarcia/Dev/sigmablox/webhook/lib/pacaf-constants.js`
- **Setup Script:** `/Users/paulgarcia/Dev/sigmablox/webhook/pacaf-setup.js`

---

**Ready to run!** Execute `node webhook/pacaf-setup.js` to create your PACAF database infrastructure.
