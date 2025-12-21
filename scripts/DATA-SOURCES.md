# SigmaBlox Data Sources Analysis

## Overview

This document details the data sources available in the SigmaBlox platform and how they map to the MC Platform user schema.

## Data Source Summary

### 1. Ghost CMS SQLite Database
**Location**: `/Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db`

**Status**: ✅ Primary source - 21 users available

**Tables Used**:
- `members` - User accounts and basic info
- `members_labels` - User role/capability assignments
- `labels` - Available roles and tags

### 2. Airtable (via MongoDB Sync)
**Location**: `apps/webhook/airtable-sync.js`

**Status**: ⚠️ Secondary source - Available but not currently used in migration

**Collections**:
- **Companies** - Organization profiles with:
  - Company name, website, logo
  - Mission areas, warfare domains
  - TRL levels, technical maturity
  - Team size, funding stage
  - Government compliance (clearances, ATO, GPC ready)
  - Cohort participation

- **Coaches** - Expert profiles with:
  - Name, email, LinkedIn
  - Company/affiliation
  - SME areas, expertise
  - Warfare domain focus
  - Role in the combine

### 3. Ghost Members Data Limitations

**Available**:
- Email (unique)
- Name
- Status (membership tier)
- Labels/roles
- Created/updated timestamps
- Notes (limited metadata)

**NOT Available**:
- Company affiliation
- Website
- Mission areas
- Clearances
- TRL level
- GPC readiness
- Technical expertise details

## Ghost Database Schema

### Members Table
```sql
CREATE TABLE `members` (
  `id` varchar(24) not null,
  `uuid` varchar(36) null,
  `transient_id` varchar(191) not null,
  `email` varchar(191) not null,
  `status` varchar(50) not null default 'free',
  `name` varchar(191) null,
  `expertise` varchar(191) null,  -- NOT USED
  `note` varchar(2000) null,
  `geolocation` varchar(2000) null,  -- NOT POPULATED
  -- ... other fields for email tracking
  primary key (`id`)
);
```

### Labels Available
From analysis of production database:

| Label ID | Label Name | Slug | Count |
|----------|-----------|------|-------|
| ... | Coach | coach | 7 |
| ... | Alumni | alumni | 7 |
| ... | Staff | staff | 2 |
| ... | Admin | admin | 1 |
| ... | Trusted | trusted | 8 |
| ... | Industry | industry | 11 |
| ... | founder | founder | 8 |
| ... | advisor | advisor | 4 |
| ... | operator | operator | 2 |
| ... | general | general | 1 |
| ... | guest | guest | 1 |
| ... | restricted | restricted | 1 |
| ... | limited | limited | 1 |
| ... | Trust | trust | 0 |

**Note**: Users can have multiple labels

## Sample User Records

### Admin User
```javascript
{
  email: "gus@mergecombinator.com",
  name: "Paul \"Gu$\" Garcia",
  status: "free",
  labels: ["Coach", "Alumni", "Staff", "Admin", "Trusted", "restricted"],
  note: null
}
```

### Typical Member
```javascript
{
  email: "drclbair@gmail.com",
  name: "Dr. Catherine Bair",
  status: "free",
  labels: ["Coach", "Alumni", "Trusted"],
  note: null
}
```

### Founder
```javascript
{
  email: "james@sheridantech.io",
  name: "James Sheridan",
  status: "free",
  labels: ["founder", "Industry"],
  note: null
}
```

### Recent Sign-up
```javascript
{
  email: "nomar116@gmail.com",
  name: "PAUL A Garcia",
  status: "free",
  labels: ["guest"],
  note: "Auto-approved: 2025-12-12T03:59:53.684Z"
}
```

## Airtable Company Schema

**Available via Airtable Sync** (not currently used in migration):

```javascript
{
  airtableId: "recXXXXXXXXXXXXXX",
  companyName: "Example Defense Tech",
  productName: "TacticalOS",
  website: "https://example.com",
  logoUrl: "https://...",

  // Contact
  contactName: "John Founder",
  email: "john@example.com",
  location: "Austin, TX",

  // Mission
  missionArea: "C2",
  secondaryMissions: "ISR, Fires",
  warfareDomain: "Air",

  // Technical
  trlLevel: 7,
  technicalMaturity: "Production Ready",
  description: "...",
  hardwareOrSoftware: "Software",
  systemLayer: "Application",

  // Business
  teamSize: "10-25",
  fundingStage: "Seed",

  // Government
  currentCyberCompliance: "NIST 800-171",
  securityClearanceLevel: "Secret",
  atoStatus: "In Progress",
  gpcReady: "Yes",

  // Cohort
  cohort: "25-1",
  status: "active"
}
```

## Airtable Coach Schema

**Available via Airtable Sync**:

```javascript
{
  airtableId: "recXXXXXXXXXXXXXX",

  // Basic Info
  name: "Jane Expert",
  email: "jane@example.com",
  linkedIn: "https://linkedin.com/in/janeexpert",
  photoUrl: "https://...",
  phone: "+1234567890",

  // Role
  company: "USAF",
  affiliation: "Active Duty",
  combineRole: "Mentor",
  domain: "Air",

  // Expertise
  smeArea: "Autonomous Systems",
  problemAreas: "Integration of AI in tactical environments",
  expertise: ["AI/ML", "Systems Integration", "Flight Test"],

  // Meta
  cohort: "25-1",
  status: "active"
}
```

## Migration Strategy

### Current Approach (Phase 1)
✅ **Export Ghost members only**
- Simple, reliable
- Gets core user accounts migrated
- Preserves all Ghost metadata
- Maps labels to capabilities

### Future Enhancement (Phase 2)
⚠️ **Enrich with Airtable data**
- Match Ghost members to Airtable coaches by email
- Match members to companies (if contact email matches)
- Import company-specific data:
  - Mission areas
  - TRL level
  - Clearances
  - GPC readiness
  - Company affiliation

## Airtable Integration Code

The webhook service already has full Airtable sync functionality:

**File**: `/Users/paulgarcia/Dev/sigmablox/apps/webhook/airtable-sync.js`

**Key Methods**:
- `syncCompanies()` - Sync all companies from Airtable
- `syncCoaches()` - Sync all coaches from Airtable
- `transformCompanyRecord()` - Transform Airtable company to MongoDB schema
- `transformCoachRecord()` - Transform Airtable coach to MongoDB schema

**MongoDB Collections Created**:
- `companies` - Company profiles
- `coaches` - Coach profiles
- `cohorts` - Cohort information with participants

## Cross-Reference Possibilities

### Email-based Matching

1. **Ghost Member → Airtable Coach**
   ```javascript
   // Match by email
   const ghostMember = { email: "coach@example.com" }
   const airtableCoach = await db.collection('coaches')
     .findOne({ email: ghostMember.email })

   // Enrich profile
   userProfile.expertise = airtableCoach.expertise
   userProfile.missionAreas = [airtableCoach.domain]
   userProfile.company = airtableCoach.company
   ```

2. **Ghost Member → Airtable Company Contact**
   ```javascript
   // Match by email (if member is the company contact)
   const ghostMember = { email: "founder@startup.com" }
   const company = await db.collection('companies')
     .findOne({ email: ghostMember.email })

   // Enrich profile
   userProfile.company = company.companyName
   userProfile.website = company.website
   userProfile.missionAreas = [company.missionArea]
   userProfile.trlLevel = company.trlLevel
   userProfile.clearances = [company.securityClearanceLevel]
   userProfile.gpcReady = company.gpcReady === 'Yes'
   ```

## Data Quality Notes

### Ghost Members
- ✅ All 21 users have valid emails
- ✅ All users have names
- ✅ 18/21 users have labels assigned
- ⚠️ No company data
- ⚠️ No technical metadata
- ⚠️ Limited profile information

### Airtable Companies
- Comprehensive company profiles
- Mission and technical details
- Government compliance info
- NOT linked to Ghost members

### Airtable Coaches
- Expert profiles with detailed expertise
- Contact information
- SME areas and domains
- Some emails may match Ghost members

## Recommendations

### Immediate (Phase 1)
1. ✅ Migrate Ghost members as-is
2. ✅ Map labels to basic capabilities
3. ✅ Preserve all Ghost metadata
4. Notify users about migration
5. Encourage profile completion

### Future (Phase 2)
1. Export Airtable coaches and companies
2. Match emails between systems
3. Enrich user profiles with Airtable data
4. Allow users to claim company profiles
5. Build admin interface for manual matching

## Example Enhancement Script

A future script could enrich migrated users:

```javascript
// Hypothetical: enrich-from-airtable.js
async function enrichUsers() {
  const users = await db.collection('users')
    .find({ migratedFrom: 'sigmablox' })

  for (const user of users) {
    // Try to find matching coach
    const coach = await db.collection('coaches')
      .findOne({ email: user.email })

    if (coach) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: {
          'profile.company': coach.company,
          'profile.capabilities': [...user.profile.capabilities, ...coach.expertise],
          'profile.missionAreas': [coach.domain]
        }}
      )
    }

    // Try to find matching company contact
    const company = await db.collection('companies')
      .findOne({ email: user.email })

    if (company) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: {
          'profile.company': company.companyName,
          'profile.website': company.website,
          'profile.missionAreas': [company.missionArea],
          'profile.trlLevel': company.trlLevel,
          'profile.gpcReady': company.gpcReady === 'Yes'
        }}
      )
    }
  }
}
```

## Summary

**Current Migration Capabilities**:
- ✅ 21 Ghost member accounts
- ✅ Email, name, role, labels
- ✅ Basic capability mapping
- ✅ Preserves source metadata

**Available But Not Yet Used**:
- ⚠️ Airtable company profiles
- ⚠️ Airtable coach profiles
- ⚠️ Mission areas, TRL, clearances
- ⚠️ Technical expertise details

**Recommendation**: Start with Ghost-only migration (Phase 1), then enhance with Airtable data in Phase 2 after validating the basic migration works correctly.
