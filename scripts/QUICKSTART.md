# SigmaBlox User Migration - Quick Start

## Prerequisites

1. Install dependencies:
```bash
cd /Users/paulgarcia/Dev/mc_site/scripts
npm install
```

2. Set MongoDB connection (if needed):
```bash
export MONGODB_URI="your-mongodb-connection-string"
export MONGODB_DB_NAME="mc_platform"
```

## Quick Migration (3 Steps)

### Step 1: Export Users (Dry Run First)
```bash
# Preview what will be exported
node migrate-sigmablox-users.js --dry-run
```

Expected output:
- Total users found
- Sample user records
- Role distribution
- Capability mapping

### Step 2: Export Users (For Real)
```bash
# Export to default location
node migrate-sigmablox-users.js
```

Output files:
- `sigmablox-users-export.json` - User data
- `sigmablox-users-export-stats.json` - Statistics

### Step 3: Import to MongoDB
```bash
# Dry run first
node import-to-mongodb.js --file sigmablox-users-export.json --dry-run

# Import for real
node import-to-mongodb.js --file sigmablox-users-export.json
```

## Using NPM Scripts

```bash
# Install dependencies
npm run install-deps

# Dry run migration
npm run migrate:dry-run

# Run migration
npm run migrate

# Note: Import must specify file path
node import-to-mongodb.js --file sigmablox-users-export.json
```

## Verification

After import, verify in MongoDB:
```bash
# Count migrated users
mongosh "$MONGODB_URI" --eval "db.users.countDocuments({migratedFrom: 'sigmablox'})"

# Sample a user
mongosh "$MONGODB_URI" --eval "db.users.findOne({migratedFrom: 'sigmablox'})" | jq
```

## Expected Results

- **21 users** from SigmaBlox Ghost database
- **1 admin** (Paul "Gu$" Garcia)
- **20 members** with various capabilities
- All users have:
  - Email (unique identifier)
  - Name
  - Role assignment
  - Capabilities mapped from labels
  - Source metadata preserved

## Troubleshooting

### "Ghost database not found"
Check that sigmablox Ghost database exists:
```bash
ls -la /Users/paulgarcia/Dev/sigmablox/ghost-data/data/ghost.db
```

### "Module not found: sqlite3"
Install dependencies:
```bash
cd /Users/paulgarcia/Dev/mc_site/scripts
npm install
```

### "MongoDB connection failed"
- Verify MONGODB_URI is set
- Check MongoDB Atlas IP whitelist
- Test connection: `mongosh "$MONGODB_URI" --eval "db.stats()"`

## Advanced Options

### Custom Output Location
```bash
node migrate-sigmablox-users.js --output /tmp/users.json
```

### Custom MongoDB Database/Collection
```bash
node import-to-mongodb.js \
  --file sigmablox-users-export.json \
  --db "mc_platform_staging" \
  --collection "users_test"
```

## Files Generated

1. **sigmablox-users-export.json** - Transformed user records
2. **sigmablox-users-export-stats.json** - Migration metadata
3. **sigmablox-users-export-import-report.json** - Import results (after import)

## Next Steps After Migration

1. Review imported users in MongoDB
2. Notify users about platform migration
3. Set up authentication for migrated users
4. Consider enriching profiles with Airtable company data
5. Set up user roles and permissions

## Support

See `README-MIGRATION.md` for detailed documentation.
