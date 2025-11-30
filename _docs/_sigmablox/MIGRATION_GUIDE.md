# Staging to Production Migration Guide
## SigmaBlox Ghost CMS with Cloudflare Tunnel

### Executive Summary
This document captures the complete process, challenges, and solutions for migrating a Ghost CMS site from staging to production using Cloudflare Tunnels, including critical lessons learned for future deployments.

**Migration Date:** October 26, 2025  
**Time to Complete:** ~4 hours (with troubleshooting)  
**Downtime:** ~15 minutes  
**Result:** Successful migration with functional production site

---

## Table of Contents
1. [Pre-Migration State](#pre-migration-state)
2. [Critical Issues Encountered](#critical-issues-encountered)
3. [Step-by-Step Migration Process](#step-by-step-migration-process)
4. [Post-Migration Fixes](#post-migration-fixes)
5. [Lessons Learned](#lessons-learned)
6. [Future CI/CD Recommendations](#future-cicd-recommendations)
7. [Quick Reference Commands](#quick-reference-commands)

---

## Pre-Migration State

### Infrastructure
- **Staging VM (ghost-staging):** 4GB RAM, running stable Ghost + MongoDB + Caddy setup at staging.sigmablox.com
- **Production VM (ghost-vm):** 1GB RAM (later upgraded to 2GB, then 4GB), running Ghost + MySQL + Nginx + Cloudflare Tunnel at www.sigmablox.com
- **Cloudflare:** Orange cloud DNS with tunnels configured

### Architecture
```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│   Cloudflare    │
│  (Orange Cloud) │
└──────┬──────────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────┐
│   Ghost VM      │
│  ┌───────────┐  │
│  │   Nginx/  │  │
│  │   Caddy   │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │   Ghost   │  │
│  │  (Docker) │  │
│  └───────────┘  │
└─────────────────┘
```

---

## Critical Issues Encountered

### Issue 1: Production VM Resource Exhaustion
**Problem:** Production VM with 1GB RAM couldn't run Ghost + MySQL simultaneously. MySQL container caused the entire VM to become unresponsive.

**Symptoms:**
- SSH connections timing out
- VM showing "running" status but unresponsive
- Unable to stop or restart VM via console

**Root Cause:** MySQL requires minimum 256MB RAM, but with Ghost, Nginx, and OS overhead, 1GB was insufficient.

**Solution:**
```bash
# Stop VM (from local machine, not SSH)
gcloud compute instances stop ghost-vm --zone=us-central1-a

# Upgrade machine type
gcloud compute instances set-machine-type ghost-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium  # 4GB RAM

# Start VM
gcloud compute instances start ghost-vm --zone=us-central1-a
```

**Memory Recommendations:**
- **Minimum:** e2-small (2GB RAM) - ~$14/month
- **Recommended:** e2-medium (4GB RAM) - ~$28/month
- **Production:** e2-standard-2 (8GB RAM) - ~$50/month for high traffic

### Issue 2: Cloudflare Tunnel SSL Certificate Failures
**Problem:** Caddy couldn't obtain Let's Encrypt certificates when Cloudflare's orange cloud (proxy) was enabled, causing ACME challenge failures.

**Error Message:**
```
Cannot negotiate ALPN protocol "acme-tls/1" for tls-alpn-01 challenge
```

**Root Cause:** Cloudflare's proxy intercepts ACME TLS-ALPN-01 challenges, preventing certificate verification.

**Solutions (in order of preference):**

**Option 1: Disable Caddy's Auto HTTPS** (Used in final solution)
```
{
    auto_https off
}

:80 {
    reverse_proxy ghost:2368
    # Caddy serves HTTP only, Cloudflare handles SSL
}
```

**Option 2: Use Cloudflare Origin Certificates**
- Generate certificate in Cloudflare Dashboard
- Install on origin server
- Set Cloudflare SSL/TLS mode to "Full (strict)"

**Option 3: Grey Cloud (DNS Only)**
- Turn off orange cloud temporarily
- Let Caddy get certificates
- Re-enable orange cloud
- *Not recommended for production*

### Issue 3: Ghost Portal Mixed Content Errors
**Problem:** Ghost admin couldn't preview Portal settings. Login button didn't work on frontend.

**Error Message:**
```
Mixed Content: The page at 'https://www.sigmablox.com/ghost/#/settings/portal/edit' 
was loaded over HTTPS, but requested an insecure frame 'http://www.sigmablox.com/...'
```

**Root Cause:** Ghost was configured with `url: http://www.sigmablox.com` but Portal requires HTTPS URLs.

**Solution:**
```yaml
# docker-compose.yml
environment:
  url: https://www.sigmablox.com  # Use HTTPS even though origin serves HTTP
```

**Why this works:** Cloudflare handles SSL termination and forwards HTTP to origin, but Ghost needs to generate HTTPS URLs for Portal, API endpoints, and admin interface.

### Issue 4: Redirect Loops
**Problem:** After setting Ghost URL to HTTPS, infinite redirect loops occurred (HTTP 301 → HTTPS → HTTP 301...).

**Root Cause:** Ghost redirects HTTP to HTTPS based on its URL config, but Cloudflare Tunnel sends HTTP requests to the origin.

**Solution:** Configure Caddy to tell Ghost the original request was HTTPS:
```
:80 {
    reverse_proxy ghost:2368 {
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
    }
}
```

**Critical Insight:** The `X-Forwarded-Proto: https` header tells Ghost that the client used HTTPS, even though the Caddy → Ghost connection is HTTP.

### Issue 5: Cloudflare Tunnel Configuration Mismatch
**Problem:** Tunnel was connected and running, but www.sigmablox.com returned 404 errors.

**Root Cause:** Tunnel ingress rules in local config.yml didn't match the configuration in Cloudflare's dashboard. Dashboard configuration is the source of truth.

**Solution:** Recreated tunnel using Cloudflare Dashboard:
1. Zero Trust → Networks → Tunnels → Create tunnel
2. Named it `sigmablox-prod`
3. Installed with token: `sudo cloudflared service install <TOKEN>`
4. Configured Public Hostnames in dashboard:
   - www.sigmablox.com → http://localhost:80
   - sigmablox.com → http://localhost:80
   - staging.sigmablox.com → http://localhost:80

**Lesson:** Always use Cloudflare Dashboard for tunnel configuration rather than manual config.yml editing.

### Issue 6: Docker Container Networking
**Problem:** Cloudflare Tunnel (running as systemd service) couldn't communicate with Ghost container using `ghost:2368` hostname.

**Root Cause:** Tunnel runs outside Docker network, so Docker DNS names aren't resolvable.

**Solution:** Tunnel must use `localhost:80` (Caddy) which Docker exposes to the host via port mapping.

**Architecture:**
```
Cloudflare Tunnel (systemd)
    ↓ http://localhost:80
Docker Bridge Network
    ├─ Caddy (port 80:80)
    │   ↓ http://ghost:2368
    └─ Ghost (internal only)
```

---

## Step-by-Step Migration Process

### Phase 1: Preparation

#### 1. Verify Staging is Stable
```bash
# SSH into staging VM
gcloud compute ssh ghost-staging --zone=us-central1-a

# Check all containers running
sudo docker compose ps

# Verify Ghost is responding
curl -I http://localhost:80

# Check memory usage
free -h
# Should have >500MB available
```

#### 2. Create Staging Database Backup
```bash
cd ~/ghost

# For MongoDB (if applicable)
sudo docker exec ghost-db mongodump --out=/backup

# For SQLite (Ghost default)
sudo docker cp ghost:/var/lib/ghost/content/data/ghost.db ./backup/ghost-$(date +%Y%m%d).db

# Backup entire content directory
tar -czf ghost-content-backup-$(date +%Y%m%d).tar.gz ./content
```

#### 3. Document Current Configuration
```bash
# Save current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Save Caddyfile
cp Caddyfile Caddyfile.backup

# List current DNS records
# (Screenshot Cloudflare DNS page)
```

### Phase 2: DNS Preparation

#### 4. Update DNS to Point to Staging VM
**Cloudflare Dashboard → DNS → Records:**

1. **www.sigmablox.com**
   - Change from: A record → 34.45.159.53 (prod IP)
   - Change to: A record → 130.211.226.19 (staging IP)
   - Keep: Orange cloud ON

2. **sigmablox.com** (root @)
   - Change from: A record → 34.45.159.53
   - Change to: A record → 130.211.226.19
   - Keep: Orange cloud ON

3. **Purge Cloudflare Cache**
   - Caching → Configuration → Purge Everything

**Wait 2-3 minutes for propagation**

### Phase 3: Ghost Configuration

#### 5. Update Ghost URL Configuration
```bash
cd ~/ghost
nano docker-compose.yml
```

**Change:**
```yaml
services:
  ghost:
    environment:
      url: https://www.sigmablox.com  # Was: staging.sigmablox.com
```

**DO NOT change to http://** - Ghost needs HTTPS for Portal to work.

#### 6. Update Caddyfile for Proper Header Forwarding
```bash
nano Caddyfile
```

**Final working configuration:**
```
{
    auto_https off
}

:80 {
    reverse_proxy ghost:2368 {
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
    }
    
    encode gzip
    
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN" 
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    log {
        output stdout
        format console
    }
}
```

#### 7. Restart Services
```bash
# Full restart to pick up environment changes
sudo docker compose down
sudo docker compose up -d

# Watch logs for successful startup
sudo docker compose logs -f ghost

# Wait for: "Your site is now available on https://www.sigmablox.com/"
# Press Ctrl+C when ready

# Verify containers running
sudo docker compose ps
```

#### 8. Test Locally
```bash
# Should return 200 OK
curl -I http://localhost:80

# Check Ghost is responding
curl http://localhost:80 | head -20
```

### Phase 4: Cloudflare Tunnel Setup

#### 9. Create New Production Tunnel
**Cloudflare Dashboard → Zero Trust → Networks → Tunnels:**

1. Click **Create a tunnel**
2. Select **Cloudflared**
3. Name: `sigmablox-prod`
4. Click **Save tunnel**
5. **Copy the installation token** (starts with `eyJ...`)

#### 10. Install Tunnel on Staging VM
```bash
# Stop old tunnel if exists
sudo systemctl stop cloudflared

# Uninstall old tunnel service
sudo cloudflared service uninstall

# Install new tunnel with token from dashboard
sudo cloudflared service install eyJhIjoiNzY4NDkw...  # Your actual token

# Verify service started
sudo systemctl status cloudflared

# Check logs
sudo journalctl -u cloudflared -n 20
# Should see: "Registered tunnel connection"
```

#### 11. Configure Public Hostnames
**Back in Cloudflare Dashboard:**

1. Click **Configure** on your new tunnel
2. Go to **Public Hostname** tab
3. Click **Add a public hostname**
4. Add three hostnames:

**Hostname 1:**
- Subdomain: `www`
- Domain: `sigmablox.com`
- Path: (leave blank)
- Type: `HTTP`
- URL: `localhost:80`

**Hostname 2:**
- Subdomain: (leave blank for root)
- Domain: `sigmablox.com`
- Path: (leave blank)
- Type: `HTTP`
- URL: `localhost:80`

**Hostname 3:**
- Subdomain: `staging`
- Domain: `sigmablox.com`
- Path: (leave blank)
- Type: `HTTP`
- URL: `localhost:80`

5. Click **Save**

#### 12. Update DNS to Use Tunnel
**Cloudflare Dashboard → DNS → Records:**

The tunnel should auto-create CNAME records. Verify:

- **www** → CNAME → `<TUNNEL_ID>.cfargotunnel.com`, Orange ON
- **@** → CNAME → `<TUNNEL_ID>.cfargotunnel.com`, Orange ON

If not auto-created, manually create CNAMEs.

#### 13. Configure Cloudflare SSL/TLS
**Cloudflare Dashboard → SSL/TLS:**

- **Overview → SSL/TLS encryption mode:** Set to **Full**
- **Edge Certificates → Always Use HTTPS:** OFF (prevents loops)
- **Edge Certificates → HSTS:** OFF (unless you specifically need it)

### Phase 5: Testing & Validation

#### 14. Clear Cache and Test
```bash
# From local machine
curl -I https://www.sigmablox.com
# Should return 200 OK

# Check DNS resolution
dig www.sigmablox.com +short
# Should show Cloudflare IPs
```

**In Browser (Incognito):**
1. Visit https://www.sigmablox.com
2. Site should load correctly
3. Click **Login** button → Portal should appear
4. Test navigation, pages load correctly

#### 15. Test Ghost Admin
1. Visit https://www.sigmablox.com/ghost
2. Login to admin panel
3. Check **Settings → Portal**
4. Portal preview should load without errors
5. Test creating a test post
6. Verify all admin functions work

#### 16. Monitor Logs
```bash
# Watch for errors over 10 minutes
sudo docker compose logs -f

# Check tunnel health
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f

# Monitor system resources
htop
```

### Phase 6: Decommission Old Production

#### 17. Stop Old Production VM
```bash
# From local machine
gcloud compute instances stop ghost-vm --zone=us-central1-a
```

#### 18. Keep as Backup
Don't delete the old VM immediately. Keep it for:
- Emergency rollback (1 week)
- Data recovery if needed
- Reference for configuration

**After 1-2 weeks of stable operation:**
```bash
# Create snapshot before deleting
gcloud compute disks snapshot ghost-vm-disk \
    --snapshot-names=ghost-vm-backup-$(date +%Y%m%d) \
    --zone=us-central1-a

# Then stop VM (keep disk)
gcloud compute instances delete ghost-vm --zone=us-central1-a --keep-disks=all
```

---

## Post-Migration Fixes

### Fix 1: Theme Webhook URLs
If your theme has hardcoded staging URLs:

```bash
cd ~/ghost/content/themes/YOUR_THEME_NAME

# Find all staging references
grep -r "staging\.sigmablox" . --exclude-dir=node_modules

# Replace with www
find ./assets/js -type f -name "*.js" -exec sed -i 's|staging\.sigmablox\.com|www.sigmablox.com|g' {} +

# Restart Ghost
cd ~/ghost
sudo docker compose restart ghost
```

### Fix 2: Webhook Service CORS
Update your webhook service to allow www.sigmablox.com:

```javascript
// In webhook service code
const allowedOrigins = [
    'https://www.sigmablox.com',
    'https://sigmablox.com',
    'https://staging.sigmablox.com'  // Keep for when you rebuild staging
];
```

Deploy updated webhook:
```bash
gcloud run deploy webhook-service \
    --source . \
    --region us-central1 \
    --set-env-vars "ALLOWED_ORIGINS=https://www.sigmablox.com,https://sigmablox.com"
```

### Fix 3: Browser Cache Issues
Users may experience redirect issues due to cached staging.sigmablox.com redirects:

**Chrome HSTS Clear:**
1. Visit: `chrome://net-internals/#hsts`
2. Query domain: `sigmablox.com` → Delete
3. Query domain: `staging.sigmablox.com` → Delete
4. Clear browsing data → Cookies and cached images

---

## Lessons Learned

### Technical Lessons

1. **Always Right-Size Your VMs First**
   - Don't assume 1GB is enough for Ghost + Database
   - Monitor memory usage: `free -h` and `htop`
   - Upgrade BEFORE attempting major changes
   - Cost increase (e2-micro → e2-medium) is ~$20/month, but saves hours of troubleshooting

2. **Cloudflare Tunnel vs Direct IP**
   - Tunnels add complexity but provide better security
   - No need to expose VM IPs publicly
   - Built-in DDoS protection
   - Zero-downtime swaps between environments (once properly configured)

3. **Ghost URL Configuration is Critical**
   - Must be `https://` for Portal to work
   - Even when origin serves HTTP
   - Use `X-Forwarded-Proto` header to prevent loops
   - Changing URL requires full container restart, not just `docker restart`

4. **SSL/TLS Termination Architecture**
   ```
   Client → [HTTPS] → Cloudflare → [HTTP] → Caddy → [HTTP] → Ghost
   
   Ghost thinks: "I'm on HTTPS" (due to X-Forwarded-Proto header)
   Caddy sees: HTTP request from Cloudflare
   Cloudflare handles: SSL certificate, HTTPS termination
   ```

5. **Docker Networking with External Services**
   - Services outside Docker can't use container names
   - Use `localhost:PORT` when service is on host
   - Use `container-name:PORT` only within Docker network
   - Port mapping (`ports:`) exposes to host
   - Expose (`expose:`) only exposes within Docker network

6. **Configuration Precedence**
   - Cloudflare Dashboard > Local config files
   - For tunnels, always configure in dashboard
   - Local config.yml can get out of sync
   - Docker cached environment variables require `docker compose down` to clear

### Process Lessons

1. **Staging Should Mirror Production**
   - Same VM size (4GB)
   - Same stack (Caddy, not Nginx if that's what you're using in prod)
   - Same domain configuration approach
   - Only difference: subdomain and database

2. **Test in Incognito Always**
   - Browser caching causes false negatives
   - HSTS settings persist even after cache clear
   - Incognito = clean slate for testing

3. **One Change at a Time**
   - Don't change DNS + URL + Tunnel simultaneously
   - If something breaks, you won't know what caused it
   - Make change → Test → Next change

4. **Keep Old Infrastructure Running**
   - Don't delete old VMs immediately
   - Snapshots are cheap insurance
   - Keep for 1-2 weeks minimum
   - Allows quick rollback if issues arise later

5. **Documentation is Essential**
   - Screenshot DNS settings before changes
   - Save backup copies of all config files
   - Document every change made
   - Include timestamps and reasoning

### Common Pitfalls to Avoid

❌ **Don't:**
- Change Ghost URL without updating Caddy headers
- Use `auto_https on` in Caddy with Cloudflare proxy
- Delete old infrastructure immediately after migration
- Forget to purge Cloudflare cache after DNS changes
- Edit tunnel config.yml manually - use dashboard
- Test only in regular browser with cache

✅ **Do:**
- Verify VM has adequate resources (4GB+ RAM)
- Use `X-Forwarded-Proto: https` header in reverse proxy
- Keep backups of all configs before changes
- Purge Cloudflare cache after every major change
- Test in incognito mode
- Monitor logs during and after migration
- Keep old infrastructure for 1-2 weeks

---


**Deploy Script:**
```bash
#!/bin/bash
# deploy-theme.sh

THEME_NAME="your-theme"
VM_HOST="ghost-staging"  # or ghost-prod

echo "🚀 Deploying theme to $VM_HOST..."

# Pull latest changes on VM
ssh $VM_HOST "cd ~/ghost/content/themes/$THEME_NAME && git pull"

# Restart Ghost
ssh $VM_HOST "cd ~/ghost && sudo docker compose restart ghost"

echo "✅ Theme deployed!"
```

#### 2. Automated Backups
**Create backup script:**
```bash
#!/bin/bash
# /home/paulgarcia/backup-ghost.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/paulgarcia/backups"
mkdir -p $BACKUP_DIR

# Backup Ghost content
tar -czf $BACKUP_DIR/ghost-content-$DATE.tar.gz ~/ghost/content

# Backup database (if SQLite)
sudo docker cp ghost:/var/lib/ghost/content/data/ghost.db \
    $BACKUP_DIR/ghost-db-$DATE.db

# Upload to Google Cloud Storage
gsutil cp $BACKUP_DIR/ghost-content-$DATE.tar.gz \
    gs://sigmablox-backups/ghost/

gsutil cp $BACKUP_DIR/ghost-db-$DATE.db \
    gs://sigmablox-backups/ghost/

# Keep only last 7 days locally
find $BACKUP_DIR -name "ghost-*" -mtime +7 -delete

echo "✅ Backup complete: $DATE"
```

**Add to crontab:**
```bash
crontab -e
# Add: 0 2 * * * /home/paulgarcia/backup-ghost.sh
```

#### 3. Infrastructure as Code
**Document current setup:**
```yaml
# infrastructure.yml
production:
  vm:
    name: ghost-staging
    machine_type: e2-medium
    region: us-central1-a
    disk_size: 20GB
  
  services:
    - ghost:5-alpine
    - caddy:2
  
  domains:
    - www.sigmablox.com
    - sigmablox.com
  
  tunnel:
    id: <TUNNEL_ID>
    name: sigmablox-prod
```

### Medium-Term Improvements (1-2 months)

#### 4. Proper Staging Environment
**Rebuild old prod VM as staging:**

```bash
# Start the VM
gcloud compute instances start ghost-vm --zone=us-central1-a

# SSH in
gcloud compute ssh ghost-vm --zone=us-central1-a

# Update configuration
cd ~/ghost
nano docker-compose.yml
# Change url to: https://staging.sigmablox.com

# Add staging tunnel
sudo cloudflared service install <STAGING_TUNNEL_TOKEN>

# Configure in Cloudflare Dashboard:
# staging.sigmablox.com → http://localhost:80
```

**Staging Workflow:**
1. Make changes locally
2. Test locally with `ghost-cli`
3. Deploy to staging
4. Test staging thoroughly
5. Deploy to production

#### 5. Blue-Green Deployment via Tunnels
**Setup:**
- Blue environment: Current production
- Green environment: New staging with updates

**Deployment Process:**
```
1. Update Green environment
2. Test Green thoroughly
3. Cloudflare Dashboard → Switch tunnel for www
4. Monitor for issues
5. If problems: Switch back to Blue immediately
6. If stable: Green becomes new Blue
```

**Cloudflare Configuration:**
```
Tunnel A (Blue - Stable):  ghost-staging VM
Tunnel B (Green - Testing): ghost-vm VM

Production traffic: www → Tunnel A

To deploy:
1. Update Tunnel B environment
2. Test thoroughly
3. Edit www hostname → Point to Tunnel B
4. Traffic instantly switches
5. Rollback = Point back to Tunnel A
```

### Long-Term Improvements (3-6 months)

#### 6. Containerize Everything
**Full Docker Compose setup:**
```yaml
version: '3.8'

services:
  ghost:
    image: ghost:5-alpine
    environment:
      url: https://www.sigmablox.com
    volumes:
      - ./content:/var/lib/ghost/content
    networks:
      - ghost-net

  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
    networks:
      - ghost-net

  webhook-service:
    build: ./webhook-service
    environment:
      - GHOST_URL=https://www.sigmablox.com
    networks:
      - ghost-net

networks:
  ghost-net:
```

#### 7. Monitoring and Alerting
**Setup Uptime Monitoring:**
- Uptime Robot (free tier)
- Cloudflare Health Checks
- Google Cloud Monitoring

**Alert on:**
- Site down (5xx errors)
- High memory usage (>80%)
- Disk space low (<10%)
- Slow response times (>3s)

#### 8. Automated Testing
**Pre-deployment tests:**
```bash
#!/bin/bash
# test-before-deploy.sh

echo "Running pre-deployment tests..."

# Test 1: Homepage loads
if ! curl -f https://staging.sigmablox.com > /dev/null 2>&1; then
    echo "❌ Homepage failed to load"
    exit 1
fi

# Test 2: Admin accessible
if ! curl -f https://staging.sigmablox.com/ghost/ > /dev/null 2>&1; then
    echo "❌ Admin panel failed to load"
    exit 1
fi

# Test 3: Portal works
if ! curl -f https://staging.sigmablox.com/members/api/site/ > /dev/null 2>&1; then
    echo "❌ Ghost Portal API failed"
    exit 1
fi

echo "✅ All tests passed!"
```

#### 9. CI/CD Pipeline (GitHub Actions)
**Example workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy theme
        run: |
          # Install gcloud CLI
          # Authenticate
          # rsync theme to VM
          # Restart Ghost
      
      - name: Run smoke tests
        run: ./test-before-deploy.sh
      
      - name: Notify on Slack
        if: always()
        run: |
          # Send deployment notification
```

---

## Quick Reference Commands

### Health Checks
```bash
# Check all containers
sudo docker compose ps

# Check system resources
free -h
df -h

# Check tunnel status
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 20

# Test site locally
curl -I http://localhost:80

# Check Ghost logs
sudo docker compose logs ghost --tail 50
```

### Common Operations
```bash
# Restart Ghost only
sudo docker compose restart ghost

# Restart all services
sudo docker compose restart

# Full restart (clears cached env vars)
sudo docker compose down && sudo docker compose up -d

# View logs in real-time
sudo docker compose logs -f

# Check specific container
sudo docker compose logs caddy --tail 30
```

### Troubleshooting
```bash
# Site not loading - check tunnel
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50

# 502 errors - check if containers running
sudo docker compose ps
curl -I http://localhost:80

# Too many redirects - check headers
sudo docker exec ghost-caddy cat /etc/caddy/Caddyfile
# Verify X-Forwarded-Proto: https

# Login not working - check Ghost URL
sudo docker compose logs ghost | grep "Your site is now available"
# Should say https://www.sigmablox.com

# Out of memory - check usage
free -h
# If <500MB available, upgrade VM
```

### Emergency Rollback
```bash
# Option 1: Point DNS back to old VM
# Cloudflare Dashboard → DNS → Records
# www: Change A record back to old IP

# Option 2: Switch tunnel
# Zero Trust → Tunnels → Configure
# Change www hostname to old tunnel

# Option 3: Restore from backup
cd ~/ghost
sudo docker compose down
tar -xzf backups/ghost-content-YYYYMMDD.tar.gz
sudo docker compose up -d
```

---

## Success Metrics

### Migration Success Indicators
✅ Site loads at www.sigmablox.com  
✅ Login button opens Portal  
✅ Admin dashboard accessible and functional  
✅ No console errors in browser  
✅ Cloudflare tunnel shows 4 active connections  
✅ Memory usage <70% on VM  
✅ Response times <500ms  
✅ No 502, 503, or redirect loop errors  

### Post-Migration Monitoring (First 24 Hours)
- Check logs every 2 hours
- Monitor memory usage
- Verify no spike in errors
- Test all critical user flows
- Check webhook service logs

### Week 1 Checklist
- [ ] Site stable for 7 days
- [ ] No critical errors in logs
- [ ] Backups running successfully
- [ ] Old VM still available (don't delete yet)
- [ ] User feedback collected
- [ ] Performance metrics within acceptable range

---

## Support and Maintenance

### Regular Maintenance Tasks
**Daily:**
- Monitor uptime (automated)
- Check critical user flows

**Weekly:**
- Review logs for errors
- Check disk space: `df -h`
- Verify backups completed
- Test staging environment

**Monthly:**
- Update Ghost: `docker pull ghost:5-alpine`
- Update Caddy: `docker pull caddy:2`
- Review and optimize database
- Security updates: `sudo apt update && sudo apt upgrade`

### Useful Resources
- **Ghost Documentation:** https://ghost.org/docs/
- **Cloudflare Tunnel Docs:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Caddy Documentation:** https://caddyserver.com/docs/
- **Docker Compose Reference:** https://docs.docker.com/compose/

---

## Conclusion

This migration successfully moved SigmaBlox's Ghost CMS from a staging environment to production using Cloudflare Tunnels. While the process encountered several technical challenges, each issue provided valuable lessons that will streamline future deployments.

**Key Takeaways:**
1. Adequate resources (4GB RAM minimum) prevent 90% of infrastructure issues
2. Cloudflare Tunnel + proper header configuration enables secure, zero-downtime deployments
3. Ghost's URL configuration must be HTTPS even when origin serves HTTP
4. Always configure tunnels via Cloudflare Dashboard, not manual config files
5. Test in incognito, monitor logs, and keep rollback options available

**Next Steps:**
1. Implement Git-based deployment workflow
2. Set up automated backups to Google Cloud Storage
3. Rebuild old production VM as proper staging environment
4. Configure monitoring and alerting
5. Document and test blue-green deployment process

**Time Investment vs. Future Benefit:**
- Initial migration: 4 hours
- Setup CI/CD infrastructure: 8-12 hours
- Future deployments: <15 minutes
- ROI: Achieved after 3-4 deployments

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Maintained By:** PG / Merge Combinator  
**Status:** Production-Ready ✅