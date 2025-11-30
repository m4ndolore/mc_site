# Data Safety Strategy for Production Deployment

## ⚠️ CRITICAL: Understanding What Gets Overwritten

When you deploy with `./deploy-theme-to-vm.sh`, here's what happens:

### What WILL Be Overwritten (Safe ✅)
- **Theme files only** (`/var/lib/ghost/content/themes/ease/`)
  - HTML templates (`.hbs` files)
  - CSS files
  - JavaScript files
  - Images in theme assets

### What Will NOT Be Touched (Safe ✅)
- **Database** (`ghost.db`) - Contains:
  - Users and members
  - Posts and pages
  - Settings and configuration
  - All content data
- **Uploaded Images** (`/var/lib/ghost/content/images/`) - User-uploaded content
- **Other themes** - Only the `ease` theme is replaced

## Your Concern is Valid BUT...

You're right to worry about data loss, but in this case **you're only deploying theme files**, not the database or images. Here's why it's safe:

1. **Theme fixes are isolated**: Your changes are in `.hbs` files (HTML/CSS/JS)
2. **Database is untouched**: User accounts, articles, posts remain intact
3. **Images are untouched**: All uploaded content stays as-is

## Current Situation

Your local development environment has:
- ❓ **Unknown database state**: May be outdated or different from production
- ✅ **Updated theme files**: Contains your bug fixes

Production has:
- ✅ **Live database**: Current users, posts, articles
- ❌ **Buggy theme files**: Modal close button broken, cohorts page not loading

## Safe Deployment Strategy

### Step 1: Sync Production Data to Local (Optional but Recommended)

Run the sync script to pull down production data for reference:

```bash
./sync-ghost-data.sh
```

**What this does:**
- Downloads production database to `./ghost-cloudrun/ghost-data/data/ghost-prod.db` (backup)
- **Does NOT overwrite** your local `ghost.db` (if it exists)
- Downloads images (for reference)
- Downloads themes (will be overwritten with your fixes when you deploy)

**Why do this?**
- You can inspect what's in production before deploying
- You have a local backup of production data
- You can test your theme fixes against production data locally

### Step 2: Deploy Theme Fixes

```bash
cd ghost-cloudrun
./deploy-theme-to-vm.sh
```

**What this does:**
- Creates automatic backup of current production theme
- Uploads ONLY your theme files
- Restarts Ghost to apply changes
- **Does NOT touch database or images**

### Step 3: Verify Deployment

1. Visit https://www.sigmablox.com/cohorts/
2. Verify companies load (no spinning wheel)
3. Open a company modal
4. Click the X button to close

## What If Something Goes Wrong?

### Rollback Theme Only
```bash
# SSH to production
gcloud compute ssh paulgarcia@ghost-staging --zone=us-central1-a --ssh-flag="-F /dev/null"

# List backups
sudo docker exec ghost-staging sh -c 'ls -lt /var/lib/ghost/content/themes/ | grep ease.backup'

# Restore backup
sudo docker exec ghost-staging sh -c 'cd /var/lib/ghost/content/themes && rm -rf ease && cp -r ease.backup.YYYYMMDD-HHMMSS ease'

# Restart Ghost
sudo docker restart ghost-staging
```

## Data Comparison (Optional)

If you want to see what's different between local and production databases:

```bash
# After running sync-ghost-data.sh, compare databases
sqlite3 ./ghost-cloudrun/ghost-data/data/ghost-prod.db "SELECT COUNT(*) as users FROM users;"
sqlite3 ./ghost-cloudrun/ghost-data/data/ghost.db "SELECT COUNT(*) as users FROM users;"

# Check for new posts/articles
sqlite3 ./ghost-cloudrun/ghost-data/data/ghost-prod.db "SELECT title, created_at FROM posts ORDER BY created_at DESC LIMIT 5;"
```

## Bottom Line

✅ **Your deployment is SAFE because:**
1. Only theme files are being deployed (HTML/CSS/JS)
2. Database and images are not touched
3. Automatic backups are created
4. Easy rollback is available

⚠️ **Run sync first if you want to:**
1. Have a local backup of production
2. Test your fixes against production data locally
3. Inspect what's currently in production

## Recommended Workflow

```bash
# 1. Sync production data (creates backup, doesn't overwrite local)
./sync-ghost-data.sh

# 2. (Optional) Test locally with production data
cd ghost-cloudrun
docker compose -f docker-compose.local.yml down
docker compose -f docker-compose.local.yml up -d

# 3. Deploy theme fixes to production
./deploy-theme-to-vm.sh

# 4. Verify at https://www.sigmablox.com
```

## Key Points

- 🔒 **Database is never touched by theme deployment**
- 🔒 **Images are never touched by theme deployment**
- 📦 **Only theme files (.hbs, .css, .js) are updated**
- 💾 **Automatic backups are created before deployment**
- ↩️ **Rollback is quick and safe**

**You can confidently deploy!**
