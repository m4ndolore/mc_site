# Cloud Run Deployment Fix

## Problem Identified

Ghost CMS is failing to start on Cloud Run with the error:
```
The user-provided container failed to start and listen on the port defined
provided by the PORT=8080 environment variable within the allocated timeout.
```

## Root Causes

### 1. SQLite + Cloud Run = Bad Match
**Issue:** Cloud Run containers are ephemeral (stateless). Using SQLite means:
- Database resets on every deployment
- No persistent data storage
- Startup timeout issues with database initialization

**Solution:** Use Cloud SQL (MySQL or PostgreSQL) for persistent storage.

### 2. Ghost Startup Time
Ghost takes 15-30 seconds to:
- Initialize database
- Load themes
- Set up content directories
- Start HTTP server

Cloud Run default timeout might be too short.

---

## Quick Fix Options

### Option A: Use Cloud SQL (Recommended for Production)

**1. Create Cloud SQL Instance:**
```bash
# Create MySQL instance
gcloud sql instances create ghost-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create ghost --instance=ghost-db

# Create user
gcloud sql users create ghost \
    --instance=ghost-db \
    --password=YOUR_SECURE_PASSWORD
```

**2. Update config.production.json:**
```json
{
  "url": "https://www.sigmablox.com",
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "database": {
    "client": "mysql",
    "connection": {
      "host": "/cloudsql/sigmablox:us-central1:ghost-db",
      "user": "ghost",
      "password": "YOUR_SECURE_PASSWORD",
      "database": "ghost"
    }
  }
}
```

**3. Deploy with Cloud SQL connection:**
```bash
gcloud run deploy ghost-cms \
    --image=gcr.io/sigmablox/ghost-cms:v2-fixed \
    --region=us-central1 \
    --add-cloudsql-instances=sigmablox:us-central1:ghost-db \
    --set-env-vars="NODE_ENV=production,database__client=mysql" \
    --min-instances=1 \
    --memory=1Gi
```

**Cost:** ~$9.50/month for db-f1-micro

---

### Option B: Stay on VM with Git Deployment (Recommended for Now)

Since you already have a working VM setup, the best intermediate solution is:

**Use the git-based deployment scripts we created earlier:**
```bash
# Deploy theme changes via git (2 minutes)
./scripts/deploy-theme-git.sh production

# Automated backups already configured
# (daily backups to GCS)
```

**Benefits:**
- Works with existing infrastructure
- No database migration needed
- Fast deployments (git pull)
- Automated backups
- Zero additional cost

**Cloud Run can wait until you need:**
- Auto-scaling for traffic spikes
- Multi-region deployment
- Truly serverless architecture

---

### Option C: Use Cloud Filestore (Complex, Expensive)

Mount persistent NFS storage to Cloud Run for SQLite database.

**Cost:** ~$204/month for basic Filestore (not recommended)

---

## Recommended Path Forward

### Immediate (Today):
1. **Keep using the VM** with git-based deployment
2. Use `./scripts/deploy-theme-git.sh` for fast deploys
3. Automated backups already configured

###Week 1-2 (When Ready for Cloud Run):
1. Set up Cloud SQL MySQL instance
2. Migrate database from SQLite to MySQL
3. Test Cloud Run deployment with Cloud SQL
4. Gradual cutover with traffic splitting

### Alternative (Hybrid Approach):
1. **Keep Ghost on VM** (working, stable, cost-effective)
2. **Use Cloud Run for webhook service** (already serverless)
3. Get benefits of serverless where it makes sense
4. VM costs $28/month (predictable, acceptable)

---

## Updated Dockerfile for Cloud SQL

If you decide to go with Cloud SQL, use this Dockerfile:

```dockerfile
FROM ghost:5-alpine

# Install mysql client and curl
RUN apk add --no-cache \
    mysql-client \
    curl

# Create directories
USER root
RUN mkdir -p /var/lib/ghost/content && \
    chown -R node:node /var/lib/ghost/content

# Copy config (will use env vars for DB connection)
COPY --chown=node:node config.production.json /var/lib/ghost/config.production.json

USER node

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "current/index.js"]
```

**config.production.json with Cloud SQL:**
```json
{
  "url": "https://www.sigmablox.com",
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "database": {
    "client": "mysql",
    "connection": {
      "socketPath": "/cloudsql/sigmablox:us-central1:ghost-db",
      "user": "ghost",
      "password": "${DB_PASSWORD}",
      "database": "ghost"
    },
    "pool": {
      "min": 0,
      "max": 5
    }
  },
  "mail": {
    "transport": "Direct"
  },
  "logging": {
    "transports": ["stdout"],
    "level": "info"
  }
}
```

**Deploy command:**
```bash
gcloud run deploy ghost-cms \
    --image=gcr.io/sigmablox/ghost-cms:mysql \
    --region=us-central1 \
    --add-cloudsql-instances=sigmablox:us-central1:ghost-db \
    --set-env-vars="NODE_ENV=production,DB_PASSWORD=your-password" \
    --min-instances=1 \
    --max-instances=10 \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --allow-unauthenticated
```

---

## My Recommendation

**For SigmaBlox right now:**

1. ✅ **Keep using the VM with git deployment** (see [DEPLOYMENT_AUTOMATION.md](DEPLOYMENT_AUTOMATION.md))
   - It's working
   - Fast deploys (2 min with git pull)
   - Automated backups
   - Cost-effective ($28/month)
   - No migration needed

2. 🔄 **Plan Cloud Run migration for later** when you need:
   - Auto-scaling for traffic spikes
   - Multi-region deployment
   - True serverless benefits

3. 📊 **Current benefits you already have:**
   - Git-based theme deployment ✅
   - Automated daily backups ✅
   - Clear rollback procedure ✅
   - Production-ready setup ✅

**Cloud Run makes sense when:**
- Traffic is highly variable (spikes and valleys)
- You need multi-region deployment
- You want to scale to zero (save costs)
- Current VM can't handle traffic

**VM makes sense when (your current situation):**
- Predictable, moderate traffic
- Simple SQLite database works fine
- Already working and stable
- Cost is acceptable

---

## Action Items

**Immediate:**
- [ ] Continue using VM deployment
- [ ] Use `./scripts/deploy-theme-git.sh production` for deploys
- [ ] Verify automated backups are working

**Future (when ready for Cloud Run):**
- [ ] Create Cloud SQL instance
- [ ] Migrate SQLite → MySQL
- [ ] Update Dockerfile for Cloud SQL
- [ ] Test Cloud Run deployment
- [ ] Gradual traffic migration

---

**Bottom Line:** The VM setup with git deployment is production-ready and cost-effective. Cloud Run is great but requires Cloud SQL setup first, which is a bigger migration effort.
