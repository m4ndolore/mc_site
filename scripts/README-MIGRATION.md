# SigmaBlox User Migration Guide

## Overview

This directory contains scripts to migrate user data from the SigmaBlox platform to the MC Platform.

## Data Sources

### Primary Source: Ghost CMS Database
- **Location**: `/Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db`
- **Database**: SQLite
- **Tables Used**:
  - `members` - Core user data (email, name, status)
  - `members_labels` - User label assignments
  - `labels` - Label definitions (roles, capabilities)

### Secondary Source: Airtable (Future Enhancement)
SigmaBlox also syncs company and coach data from Airtable to MongoDB. This could be used to:
- Enrich user profiles with company affiliations
- Add mission areas and technical details from company records
- Cross-reference coaches with their expertise areas

**Note**: The current migration focuses on Ghost members. Airtable integration can be added if needed.

## User Data Available

### Ghost Members (21 total users as of export)
- Email addresses (unique identifiers)
- Names
- Status (all are "free" tier members)
- Labels/Roles:
  - Admin (1 user)
  - Coach (7 users)
  - Alumni (7 users)
  - Staff (2 users)
  - Industry (11 users)
  - Founder (8 users)
  - Operator (2 users)
  - Advisor (4 users)
  - Trusted (8 users)
  - Other roles: guest, general, restricted, limited

## Migration Schema Mapping

### Ghost → MC Platform

```javascript
// Source (Ghost)
{
  id: "6892b19ae602690001d4dbd4",
  email: "user@example.com",
  name: "John Doe",
  status: "free",
  labels: ["Coach", "Alumni", "Trusted"]
}

// Target (MC Platform)
{
  email: "user@example.com",
  name: "John Doe",
  role: "member", // or "admin" based on labels
  profile: {
    company: null, // Not available in Ghost
    website: null, // Not available in Ghost
    capabilities: [
      "Coaching & Mentorship",
      "Program Alumni",
      "Trusted Member"
    ],
    missionAreas: [], // Could be enhanced with Airtable data
    clearances: [], // Not available
    trlLevel: null, // Not available
    gpcReady: false // Not available
  },
  sourceMetadata: {
    ghostId: "6892b19ae602690001d4dbd4",
    ghostUuid: "...",
    ghostStatus: "free",
    ghostLabels: ["Coach", "Alumni", "Trusted"],
    ghostNote: "...",
    originalCreatedAt: "2025-08-06 01:36:26",
    originalUpdatedAt: "2025-08-06 01:36:26"
  },
  migratedFrom: "sigmablox",
  migratedAt: "2025-12-20T22:35:00.000Z"
}
```

## Scripts

### 1. migrate-sigmablox-users.js
Exports users from Ghost database and transforms them to MC Platform schema.

**Usage**:
```bash
# Dry run (preview only, no files written)
node scripts/migrate-sigmablox-users.js --dry-run

# Export to default location (./sigmablox-users-export.json)
node scripts/migrate-sigmablox-users.js

# Export to custom location
node scripts/migrate-sigmablox-users.js --output /path/to/export.json
```

**Output Files**:
- `sigmablox-users-export.json` - Transformed user records
- `sigmablox-users-export-stats.json` - Migration statistics

### 2. import-to-mongodb.js
Imports the exported users into MongoDB.

**Usage**:
```bash
# Import users to MongoDB
node scripts/import-to-mongodb.js --file ./sigmablox-users-export.json

# Dry run
node scripts/import-to-mongodb.js --file ./sigmablox-users-export.json --dry-run

# Custom MongoDB URI
node scripts/import-to-mongodb.js --file ./export.json --uri "mongodb://localhost:27017" --db "mc_platform"
```

## Migration Workflow

### Step 1: Export Users from SigmaBlox
```bash
cd /Users/paulgarcia/Dev/mc_site

# First, do a dry run to preview
node scripts/migrate-sigmablox-users.js --dry-run

# If everything looks good, export for real
node scripts/migrate-sigmablox-users.js
```

**Expected Output**:
```
SigmaBlox User Migration Script
================================

Reading from: /Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db
Output file: /Users/paulgarcia/Dev/mc_site/scripts/sigmablox-users-export.json
Dry run: NO

Fetching members from Ghost database...
Found 21 members

Transforming members to MC Platform schema...

Migration Statistics:
---------------------
Total users: 21
Admins: 1
Members: 20
Users with capabilities: 18
Users with company: 0

Writing 21 users to ./scripts/sigmablox-users-export.json...
Export complete!
Stats saved to: ./scripts/sigmablox-users-export-stats.json
```

### Step 2: Review Export
```bash
# View stats
cat scripts/sigmablox-users-export-stats.json

# View first few users
head -n 50 scripts/sigmablox-users-export.json
```

### Step 3: Import to MongoDB
```bash
# Set your MongoDB connection string
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net"

# Dry run first
node scripts/import-to-mongodb.js --file scripts/sigmablox-users-export.json --dry-run

# Import for real
node scripts/import-to-mongodb.js --file scripts/sigmablox-users-export.json
```

### Step 4: Verify Import
```bash
# Connect to MongoDB and verify
mongosh "$MONGODB_URI" --eval "db.users.countDocuments({migratedFrom: 'sigmablox'})"

# Check a sample user
mongosh "$MONGODB_URI" --eval "db.users.findOne({migratedFrom: 'sigmablox'})"
```

## Label to Capability Mapping

The migration script maps Ghost labels to MC Platform capabilities:

| Ghost Label | MC Capability |
|-------------|---------------|
| Coach/coach | Coaching & Mentorship |
| Alumni/alumni | Program Alumni |
| advisor | Advisory Services |
| operator | Operations & Execution |
| founder | Company Founding |
| Industry/industry | Industry Expertise |
| Staff/staff | Program Staff |
| Trusted/trust/Trust | Trusted Member |

## Role Assignment Logic

- **Admin**: Users with "Admin" or "admin" label → `role: "admin"`
- **Member**: All other users → `role: "member"`

## Data Not Available in Current Migration

The following fields are not populated from Ghost (set to null/empty):
- `profile.company` - Not stored in Ghost members
- `profile.website` - Not stored in Ghost members
- `profile.missionAreas` - Not stored in Ghost members
- `profile.clearances` - Not stored in Ghost members
- `profile.trlLevel` - Not stored in Ghost members
- `profile.gpcReady` - Not stored in Ghost members

### Enhancement Opportunity: Airtable Integration

To populate these fields, we could:
1. Cross-reference Ghost member emails with Airtable company contacts
2. Import company data (missionAreas, trlLevel, etc.) from Airtable
3. Match users to their companies

The Airtable sync code is available at:
- `/Users/paulgarcia/Dev/sigmablox/apps/webhook/airtable-sync.js`

## Dependencies

Install required packages:
```bash
cd /Users/paulgarcia/Dev/mc_site
npm install sqlite3 mongodb
```

## Troubleshooting

### Ghost Database Not Found
```
Error: Ghost database not found at /Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db
```
**Solution**: Verify the Ghost database path exists. Update `GHOST_DB_PATH` in `migrate-sigmablox-users.js` if needed.

### SQLite3 Module Not Found
```
Error: Cannot find module 'sqlite3'
```
**Solution**: Install dependencies
```bash
npm install sqlite3
```

### MongoDB Connection Failed
```
MongoNetworkError: connection refused
```
**Solution**:
- Check MongoDB URI is correct
- Ensure MongoDB instance is running
- Verify network access (IP whitelist for MongoDB Atlas)

## Files Generated

1. **sigmablox-users-export.json** - Array of transformed user objects
2. **sigmablox-users-export-stats.json** - Migration metadata and statistics

## Next Steps

After successful migration:

1. **User Notification**: Notify migrated users about the platform migration
2. **Profile Completion**: Encourage users to complete their profiles
3. **Company Matching**: Manually or automatically match users to companies
4. **Role Verification**: Review and adjust user roles/permissions as needed
5. **Airtable Enhancement**: Consider integrating Airtable data for richer profiles

## Contact

For questions or issues with the migration:
- Review this README
- Check the source code comments in `migrate-sigmablox-users.js`
- Inspect the Ghost database schema: `sqlite3 path/to/ghost.db ".schema"`
