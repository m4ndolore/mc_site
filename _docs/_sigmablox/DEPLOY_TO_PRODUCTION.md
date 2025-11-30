# Deploy Theme Changes to Production

## Overview
This guide explains how to deploy the recent bug fixes to production.

## Changes Being Deployed
1. **Modal Close Button Fix**: Added z-index to modal close button (X) so it's clickable
2. **Cohorts Page Loading Fix**: Fixed JavaScript ReferenceError that prevented the page from loading

These are **superficial changes** (CSS and JS bug fixes only) with no backend/database modifications.

## Current Production Setup
- **VM**: `ghost-staging` (us-central1-a) - **NOTE: This was staging, now it's PRODUCTION**
- **Container**: `ghost-staging`
- **Domain**: https://www.sigmablox.com
- **Theme**: ease
- **Note**: `ghost-vm` is disabled; we A/B switched staging to become prod

## Quick Deploy Command

```bash
# Deploy theme to production
./deploy-theme-to-vm.sh
```

## What the Script Does
1. Creates a tar.gz archive of the `ease` theme
2. Uploads it to the `ghost-staging` VM (production)
3. Backs up the current theme (timestamped backup)
4. Copies the new theme to the Ghost container
5. Sets correct permissions
6. Restarts Ghost to apply changes
7. Waits 30 seconds and verifies Ghost is running
8. Uses `-F /dev/null` SSH flag to bypass SSH config permission issues (Nix compatibility)

## Verification Steps

After deployment:
1. Visit https://www.sigmablox.com
2. Test the fixes:
   - Go to https://www.sigmablox.com/cohorts/
   - Verify the page loads (no spinning wheel)
   - Click on a company card to open the modal
   - Click the X button in the upper right - should close the modal

## Rollback (If Needed)

If something goes wrong:
```bash
# SSH to the VM (bypassing SSH config permission issues)
gcloud compute ssh paulgarcia@ghost-staging --zone=us-central1-a --ssh-flag="-F /dev/null"

# List backups
sudo docker exec ghost-staging sh -c 'ls -lt /var/lib/ghost/content/themes/ | grep ease.backup'

# Restore a backup (replace timestamp)
sudo docker exec ghost-staging sh -c 'cd /var/lib/ghost/content/themes && rm -rf ease && cp -r ease.backup.YYYYMMDD-HHMMSS ease'

# Restart Ghost
sudo docker restart ghost-staging
```

## Monitoring

Check Ghost logs during deployment:
```bash
# In a separate terminal
gcloud compute ssh paulgarcia@ghost-staging --zone=us-central1-a --ssh-flag="-F /dev/null" --command="sudo docker logs ghost-staging -f"
```

## Notes
- The deployment script automatically creates timestamped backups
- Ghost will be down for ~30 seconds during restart
- Browser caching: Users may need to hard refresh (Cmd+Shift+R / Ctrl+F5)
