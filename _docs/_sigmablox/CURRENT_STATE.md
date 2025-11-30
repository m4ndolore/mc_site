# SigmaBlox Platform - Current State (November 2025)

**Status:** ✅ Fully Operational in Production

---

## Production Environment

### Architecture
```
Cloudflare (SSL/DDoS)
    ↓
Cloudflare Tunnel (sigmablox-prod)
    ↓
Ghost VM (ghost-staging - e2-medium, 4GB RAM)
    ├─ Caddy (reverse proxy, port 80)
    └─ Ghost CMS (Docker, ghost:5-alpine)
        └─ SQLite database

Separate Services:
    ├─ Webhook Service (Cloud Run, us-central1)
    │   URL: https://webhook-service-uk2xdq4wjq-uc.a.run.app
    │   Domain: https://api.sigmablox.com (via Cloudflare Tunnel)
    └─ MongoDB Atlas (cohorts, coaches, access requests)
```

### Domains
- **Production:** https://www.sigmablox.com
- **Staging:** https://staging.sigmablox.com
- **API:** https://api.sigmablox.com (Cloudflare Tunnel → Cloud Run)

---

## Key Features (Live)

### Content Management
- ✅ Ghost CMS with custom "ease" theme
- ✅ Member authentication (magic links)
- ✅ Role-based access control
- ✅ Responsive design (mobile + desktop)

### Company Discovery
- ✅ Browse companies by cohort
- ✅ Company profiles with TRL levels, use cases, team info
- ✅ Real-time sync with Airtable
- ✅ Company modals with full details
- ✅ Self-service profile management

### Coach Network
- ✅ Email-based coach lookup
- ✅ Profile management with SME areas
- ✅ Domain expertise filtering
- ✅ Availability tracking

### Search
- ✅ Global unified search (companies + coaches)
- ✅ Keyboard shortcut (Cmd/Ctrl + K)
- ✅ Real-time filtering
- ✅ Modal previews with "View Full Details"

### My Favorites
- ✅ Save/unsave companies
- ✅ Dedicated favorites page
- ✅ Persistent across sessions
- ✅ Member-specific favorites list

### My Company
- ✅ Company claim workflow
- ✅ Email/name auto-matching
- ✅ Admin approval system
- ✅ Status tracking page

---

## Technology Stack

### Frontend
- Ghost CMS 5.x (Alpine)
- Custom Handlebars theme ("ease")
- Vanilla JavaScript (no framework)
- Tailwind CSS (via CDN)

### Backend Services
- **Webhook Service** (Node.js + Express)
  - Deployed on Cloud Run
  - Functions: getCohorts, getCoaches, search, accessRequest, etc.
  - Auth: Ghost member JWT validation
- **MongoDB Atlas**
  - Collections: cohorts, coaches, access_requests, favorites
  - Connection pooling
  - Secret Manager for credentials

### Infrastructure
- **GCP:** Cloud Run, Secret Manager, Cloud Storage
- **Cloudflare:** DNS, SSL, DDoS protection, Tunnel
- **Airtable:** Source of truth for company/coach data
- **Caddy:** Reverse proxy on VM

---

## Deployment Workflow

### Ghost Theme Deployment
```bash
# Staging
./ghost-cloudrun/deploy-ease-theme-staging.sh

# Production
./ghost-cloudrun/deploy-theme-to-vm.sh
```

### Webhook Service Deployment
```bash
# Staging
cd webhook && ./deploy-staging-cloudrun.sh

# Production
cd webhook && ./deploy-to-prod.sh
```

### Unified Deployment (Recommended)
```bash
# Deploy everything to staging
./deploy.sh staging

# Deploy everything to production
./deploy.sh production

# Deploy only Ghost theme
./deploy.sh production --ghost-only

# Deploy only webhook service
./deploy.sh staging --webhook-only
```

---

## Data Flow

### Company Data
1. Source: Airtable "Companies" base
2. Sync: Manual trigger via `/syncCohortFromAirtable` (admin dashboard)
3. Storage: MongoDB `cohorts` collection
4. Display: Ghost theme queries webhook service → MongoDB

### Coach Data
1. Source: Airtable "Coaches" base
2. Sync: Same trigger as companies
3. Storage: MongoDB `coaches` collection
4. Display: Ghost theme queries webhook service → MongoDB

### Favorites
1. Save: Frontend → `/api/member/favorites` (POST)
2. Storage: MongoDB `favorites` collection (memberId + companyIds)
3. Retrieve: Frontend → `/api/member/favorites` (GET)

---

## Important URLs & Endpoints

### Public URLs
- Production: https://www.sigmablox.com
- Cohorts: https://www.sigmablox.com/cohorts/
- Coaches: https://www.sigmablox.com/coaches/
- My Favorites: https://www.sigmablox.com/my-favorites/

### API Endpoints (https://api.sigmablox.com)
- `GET /getCohorts` - All cohorts with companies
- `GET /getCoaches` - All coaches
- `GET /api/search?q=term` - Unified search
- `GET /api/member/favorites` - User's favorites
- `POST /api/member/favorites` - Add/remove favorite
- `POST /syncCohortFromAirtable` - Sync from Airtable

### Admin URLs
- Ghost Admin: https://www.sigmablox.com/ghost
- Admin Dashboard: https://www.sigmablox.com/admin-dashboard/ (role: admin)
- Admin Claims: https://www.sigmablox.com/admin-claims/ (role: admin)

---

## Known Configuration

### Search API URL
**Current:** Direct Cloud Run URL
**Location:** `ghost-cloudrun/ghost-data/themes/ease/assets/js/unified-search.js:20`
```javascript
return 'https://webhook-service-uk2xdq4wjq-uc.a.run.app';
```

**Note:** This bypasses `api.sigmablox.com` which had routing issues. To use the cleaner domain:
1. Verify Cloudflare Tunnel routes `api.sigmablox.com` → Cloud Run webhook service
2. Update unified-search.js to use `https://api.sigmablox.com`
3. Redeploy theme

### Environment Variables (Cloud Run)
Set via Secret Manager:
- `MONGODB_PASSWORD` (Secret Manager: mongodb-password)
- `GHOST_ADMIN_API_KEY`
- `AIRTABLE_API_KEY`
- Database: `sigmablox-production`

---

## Operational Notes

### Daily Operations
- No manual sync needed (Airtable data is relatively static)
- Monitor Ghost logs: `gcloud compute ssh ghost-staging --command="sudo docker logs ghost-staging -f"`
- Monitor webhook logs: `gcloud run logs tail --service=webhook-service --region=us-central1`

### Performance
- Response times: <500ms for most requests
- Memory: <70% on VM
- Cloudflare Tunnel: 4 active connections expected

### Backups
- Ghost content: SQLite database in `/var/lib/ghost/content/data/`
- MongoDB: Atlas automatic backups
- Theme files: Version controlled in git

---

## Recent Fixes (November 2025)

1. **Search Functionality** - Updated to use direct Cloud Run URL
2. **Favorites Feature** - Added save/unsave with dedicated page
3. **Navigation Highlighting** - Fixed active state for My Favorites
4. **Modal Heart Icons** - Fixed favorites hearts in company modals

---

## Future Improvements

### High Priority
- [ ] Fix `api.sigmablox.com` domain routing via Cloudflare Tunnel
- [ ] Implement automated Airtable sync (webhook or scheduled job)
- [ ] Add search analytics/tracking

### Medium Priority
- [ ] Implement blue-green deployments
- [ ] Add automated backups to Cloud Storage
- [ ] Improve error handling in frontend

### Low Priority
- [ ] Add Ghost content search to unified search
- [ ] Implement user activity tracking
- [ ] Add A/B testing framework

---

## Support & Troubleshooting

### Common Issues

**Search not working:**
- Check if `api.sigmablox.com` is accessible
- Verify Cloud Run service is running
- Check browser console for API errors

**Theme not updating:**
1. Clear Ghost cache: Settings → Labs → Clear cache
2. Restart Ghost: `sudo docker restart ghost-staging`
3. Hard refresh browser: Cmd+Shift+R

**Favorites not saving:**
- Verify user is logged in
- Check MongoDB connection
- Review webhook service logs

---

## Contacts & Resources

- **Production URL:** https://www.sigmablox.com
- **Documentation:** `/Users/paulgarcia/Dev/sigmablox/_docs/`
- **Essential Docs:**
  - [Migration Guide](_docs/MIGRATION_GUIDE.md) - Full deployment process
  - [Deployment Automation](_docs/DEPLOYMENT_AUTOMATION.md) - GitHub Actions pipeline
  - [Data Safety](_docs/DATA_SAFETY_STRATEGY.md) - Backup strategy

---

**Last Updated:** November 13, 2025
**Version:** 1.0 (Production Stable)
