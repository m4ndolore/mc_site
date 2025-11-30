# Cloud Run Migration Guide
## From VM-Based to Serverless Continuous Deployment

**Created:** October 26, 2025
**Status:** Ready for Implementation
**Impact:** High - Full infrastructure migration

---

## Executive Summary

This guide migrates Ghost CMS from VM-based deployment to Cloud Run with:
- ✅ **Continuous Deployment**: Git push → automatic deployment
- ✅ **Blue/Green Deployment**: Zero-downtime with gradual traffic migration (10% → 50% → 100%)
- ✅ **Automatic Rollback**: Reverts on health check or error rate failures
- ✅ **Cost Optimization**: Pay only for actual usage (vs always-on VM)
- ✅ **Auto-scaling**: Handles traffic spikes automatically

**Deployment Flow:**
```
Git Push → Cloud Build Trigger → Build Image → Deploy to Cloud Run →
Smoke Tests → 10% Traffic → Monitor → 50% Traffic → Monitor →
100% Traffic → Success! (or auto-rollback on failure)
```

---

## Current vs Future Architecture

### Current (VM-Based)
```
GitHub → Manual SCP or Git Pull → ghost-staging VM →
Caddy → Ghost (Docker) → Cloudflare Tunnel → Users
```

**Limitations:**
- Manual or semi-automated deployment
- Single point of failure (one VM)
- Fixed resource allocation (4GB RAM always on)
- Complex rollback procedure

### Future (Cloud Run)
```
GitHub → Cloud Build (automated) → Container Registry →
Cloud Run (multi-region, auto-scale) → Cloud Load Balancer →
Cloudflare → Users
```

**Benefits:**
- **Fully Automated**: Git push = deploy
- **Highly Available**: Multi-instance, auto-healing
- **Cost Efficient**: Pay per request, scale to zero
- **Instant Rollback**: One command to revert
- **Blue/Green**: Zero-downtime deployments

---

## Prerequisites

### 1. Enable Google Cloud APIs
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com
```

### 2. Grant Cloud Build Permissions
```bash
PROJECT_NUMBER=$(gcloud projects describe sigmablox --format='value(projectNumber)')

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding sigmablox \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding sigmablox \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Grant Storage Admin role (for Container Registry)
gcloud projects add-iam-policy-binding sigmablox \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### 3. Create Cloud Storage Bucket for Ghost Content
```bash
# Create bucket for persistent Ghost content
gcloud storage buckets create gs://sigmablox-ghost-content \
    --location=us-central1 \
    --uniform-bucket-level-access

# Create bucket for database backups
gcloud storage buckets create gs://sigmablox-ghost-db \
    --location=us-central1 \
    --uniform-bucket-level-access
```

---

## Implementation Steps

### Phase 1: Test Locally (30 minutes)

#### Build and Test Container
```bash
cd ghost-cloudrun

# Build Docker image
docker build -f Dockerfile.cloudrun -t ghost-cms:local .

# Run locally
docker run -p 8080:8080 \
    -e url=http://localhost:8080 \
    -e MAIL_USER=your-email@gmail.com \
    -e MAIL_PASSWORD=your-app-password \
    ghost-cms:local

# Test in browser
open http://localhost:8080
```

#### Verify Health Checks
```bash
# Homepage
curl -I http://localhost:8080

# Admin
curl -I http://localhost:8080/ghost/

# Health check endpoint (if added)
curl http://localhost:8080/-/healthz
```

---

### Phase 2: Set Up Cloud Build Trigger (15 minutes)

#### Option 1: Via Console (Recommended for First Setup)
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **"Create Trigger"**
3. Configure:
   - **Name:** `ghost-cms-deploy`
   - **Event:** Push to branch
   - **Source:** Connect your GitHub repository
   - **Branch:** `^main$` (regex for main branch)
   - **Configuration:** Cloud Build configuration file (YAML)
   - **Location:** `cloudbuild.yaml`
4. Click **"Create"**

#### Option 2: Via CLI
```bash
# Connect GitHub repository (first time only)
gcloud builds triggers create github \
    --repo-name=sigmablox \
    --repo-owner=yourusername \
    --branch-pattern=^main$ \
    --build-config=cloudbuild.yaml \
    --name=ghost-cms-deploy \
    --description="Automated Ghost CMS deployment to Cloud Run"
```

---

### Phase 3: Initial Deployment (1 hour)

#### Deploy Manually First (Recommended)
```bash
# Build and push image
cd ghost-cloudrun
docker build -f Dockerfile.cloudrun -t gcr.io/sigmablox/ghost-cms:v1 .
docker push gcr.io/sigmablox/ghost-cms:v1

# Deploy to Cloud Run
gcloud run deploy ghost-cms \
    --image=gcr.io/sigmablox/ghost-cms:v1 \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --min-instances=1 \
    --max-instances=10 \
    --memory=2Gi \
    --cpu=2 \
    --port=8080 \
    --timeout=300 \
    --set-env-vars="NODE_ENV=production,GHOST_VERSION=v1"

# Get service URL
gcloud run services describe ghost-cms \
    --region=us-central1 \
    --format='value(status.url)'
```

#### Test Cloud Run Deployment
```bash
SERVICE_URL=$(gcloud run services describe ghost-cms --region=us-central1 --format='value(status.url)')

# Test endpoints
curl -I $SERVICE_URL
curl -I $SERVICE_URL/ghost/

# Test from different locations
curl -I $SERVICE_URL --resolve www.sigmablox.com:443:$(dig +short $SERVICE_URL | head -1)
```

---

### Phase 4: Migrate Data (2-3 hours)

#### Export from Current VM
```bash
# SSH into current production VM
gcloud compute ssh ghost-staging --zone=us-central1-a

# Backup Ghost content
cd ~/ghost
tar -czf ghost-content-$(date +%Y%m%d).tar.gz content/

# Copy database
sudo docker cp ghost:/var/lib/ghost/content/data/ghost.db ./ghost-db-$(date +%Y%m%d).db

# Exit VM
exit

# Copy to local machine
gcloud compute scp ghost-staging:~/ghost/ghost-content-*.tar.gz . --zone=us-central1-a
gcloud compute scp ghost-staging:~/ghost/ghost-db-*.db . --zone=us-central1-a
```

#### Import to Cloud Storage
```bash
# Upload content to GCS
gsutil -m cp -r ghost-content-*.tar.gz gs://sigmablox-ghost-content/
gsutil -m cp ghost-db-*.db gs://sigmablox-ghost-db/

# Verify upload
gsutil ls -lh gs://sigmablox-ghost-content/
gsutil ls -lh gs://sigmablox-ghost-db/
```

#### Mount in Cloud Run (Using gcsfuse or init container)
**Note:** Cloud Run doesn't support direct GCS mounting. Options:

**Option A: Use Cloud SQL for Database** (Recommended for Production)
```bash
# Create Cloud SQL instance
gcloud sql instances create ghost-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create ghost --instance=ghost-db

# Update config.production.json to use Cloud SQL
# (See database configuration section below)
```

**Option B: Use SQLite with Persistent Disk** (Simpler, less scalable)
```bash
# Note: Cloud Run doesn't support persistent disks
# Best to use Cloud SQL for production or accept ephemeral storage
# (Database resets on each deployment - only for testing!)
```

**Option C: Use Cloud Filestore** (NFS for content)
```bash
# Create Filestore instance
gcloud filestore instances create ghost-content \
    --zone=us-central1-a \
    --tier=BASIC_HDD \
    --file-share=name="ghostcontent",capacity=100GB \
    --network=name="default"

# Mount in Cloud Run (requires VPC connector)
```

---

### Phase 5: DNS & Load Balancer Setup (1 hour)

#### Create Load Balancer (for custom domain)
```bash
# Reserve static IP
gcloud compute addresses create ghost-cms-ip \
    --global

# Get the IP
gcloud compute addresses describe ghost-cms-ip \
    --global \
    --format='value(address)'

# Create serverless NEG (Network Endpoint Group)
gcloud compute network-endpoint-groups create ghost-cms-neg \
    --region=us-central1 \
    --network-endpoint-type=serverless \
    --cloud-run-service=ghost-cms

# Create backend service
gcloud compute backend-services create ghost-cms-backend \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED

# Add NEG to backend
gcloud compute backend-services add-backend ghost-cms-backend \
    --global \
    --network-endpoint-group=ghost-cms-neg \
    --network-endpoint-group-region=us-central1

# Create URL map
gcloud compute url-maps create ghost-cms-lb \
    --default-service=ghost-cms-backend

# Create HTTP(S) target proxy
gcloud compute target-https-proxies create ghost-cms-https-proxy \
    --url-map=ghost-cms-lb \
    --ssl-certificates=YOUR_SSL_CERT  # Create SSL cert first

# Create forwarding rule
gcloud compute forwarding-rules create ghost-cms-https-rule \
    --global \
    --target-https-proxy=ghost-cms-https-proxy \
    --address=ghost-cms-ip \
    --ports=443
```

#### Update Cloudflare DNS
```bash
# In Cloudflare Dashboard:
# 1. Update www.sigmablox.com A record to point to Cloud Load Balancer IP
# 2. Or keep Cloudflare Tunnel pointing to Cloud Run URL
# 3. Update SSL/TLS mode to Full (strict)
```

---

### Phase 6: Test Automated Deployment (30 minutes)

#### Trigger Deployment via Git Push
```bash
# Make a small change to theme
cd ghost-cloudrun/ghost-data/themes/ease/
echo "<!-- Build test -->" >> default.hbs

# Commit and push
git add .
git commit -m "test(deploy): trigger Cloud Build deployment"
git push origin main

# Watch Cloud Build
gcloud builds list --ongoing
gcloud builds log $(gcloud builds list --ongoing --format='value(id)' | head -1) --stream
```

#### Monitor Deployment Progress
```bash
# Watch Cloud Build in console
open https://console.cloud.google.com/cloud-build/builds

# Monitor Cloud Run revisions
gcloud run revisions list --service=ghost-cms --region=us-central1

# Check traffic split
gcloud run services describe ghost-cms --region=us-central1 --format='value(status.traffic)'
```

#### Verify Blue/Green Deployment
```bash
# Should see gradual migration:
# 1. New revision deployed with --no-traffic
# 2. Smoke tests run
# 3. Traffic migrates: 10% → 50% → 100%
# 4. Old revision kept for rollback

# Check current traffic split
gcloud run services describe ghost-cms \
    --region=us-central1 \
    --format='table(status.traffic.revisionName,status.traffic.percent)'
```

---

### Phase 7: Configure Monitoring & Alerts (1 hour)

#### Set Up Cloud Monitoring
```bash
# Create uptime check
gcloud monitoring uptime-checks create ghost-cms-uptime \
    --display-name="Ghost CMS Uptime" \
    --resource-type=uptime-url \
    --monitored-resource=SERVICE_URL \
    --http-check-path=/

# Create alert policy for high error rate
gcloud alpha monitoring policies create \
    --notification-channels=CHANNEL_ID \
    --display-name="Ghost CMS High Error Rate" \
    --condition-display-name="Error rate > 5%" \
    --condition-threshold-value=0.05 \
    --condition-duration=60s
```

#### Set Up Log-Based Metrics
```bash
# Create metric for 5xx errors
gcloud logging metrics create ghost_5xx_errors \
    --description="Count of 5xx errors from Ghost CMS" \
    --log-filter='resource.type="cloud_run_revision"
        resource.labels.service_name="ghost-cms"
        httpRequest.status>=500'
```

---

## Database Configuration Options

### Option 1: Cloud SQL (MySQL) - Recommended
```json
{
  "database": {
    "client": "mysql2",
    "connection": {
      "host": "/cloudsql/sigmablox:us-central1:ghost-db",
      "user": "ghost",
      "password": "${DB_PASSWORD}",
      "database": "ghost"
    }
  }
}
```

**Cloud Run Configuration:**
```bash
gcloud run services update ghost-cms \
    --add-cloudsql-instances=sigmablox:us-central1:ghost-db \
    --update-env-vars=DB_PASSWORD=your-password
```

### Option 2: Cloud SQL (PostgreSQL)
```json
{
  "database": {
    "client": "pg",
    "connection": {
      "host": "/cloudsql/sigmablox:us-central1:ghost-db",
      "user": "ghost",
      "password": "${DB_PASSWORD}",
      "database": "ghost"
    }
  }
}
```

### Option 3: SQLite (Not Recommended for Production)
```json
{
  "database": {
    "client": "sqlite3",
    "connection": {
      "filename": "/var/lib/ghost/content/data/ghost.db"
    }
  }
}
```

**Warning:** Database resets on each deployment! Only use for testing.

---

## Rollback Procedures

### Automatic Rollback (Built into cloudbuild.yaml)
- Triggers on: Smoke test failure, high error rate, high latency
- Action: Reverts to previous revision immediately
- No manual intervention needed

### Manual Rollback (< 2 minutes)
```bash
# List revisions
gcloud run revisions list --service=ghost-cms --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic ghost-cms \
    --region=us-central1 \
    --to-revisions=ghost-cms-abc123=100

# Or rollback to previous
PREVIOUS_REVISION=$(gcloud run revisions list \
    --service=ghost-cms \
    --region=us-central1 \
    --format='value(name)' \
    --sort-by='~metadata.creationTimestamp' \
    --limit=2 | tail -n 1)

gcloud run services update-traffic ghost-cms \
    --region=us-central1 \
    --to-revisions=$PREVIOUS_REVISION=100
```

---

## Cost Comparison

### Current (VM-Based)
- e2-medium (4GB): **$28/month** (always on)
- Total: **~$28/month**

### Future (Cloud Run)
**Low Traffic (10,000 requests/month):**
- Requests: 10,000 × $0.40/million = **$0.004**
- CPU time: ~100 vCPU-seconds = **$2.40**
- Memory: ~200 GiB-seconds = **$0.25**
- **Total: ~$2.65/month** (91% savings!)

**Medium Traffic (100,000 requests/month):**
- Requests: $0.04
- CPU time: ~1,000 vCPU-seconds = **$24**
- Memory: ~2,000 GiB-seconds = **$2.50**
- **Total: ~$26.54/month** (similar to VM)

**High Traffic (1,000,000 requests/month):**
- Requests: $0.40
- CPU time: ~10,000 vCPU-seconds = **$240**
- Memory: ~20,000 GiB-seconds = **$25**
- **Total: ~$265/month** (scales with traffic)

**With Cloud SQL MySQL (db-f1-micro):**
- Add ~$9.50/month for database

---

## Production Checklist

### Before Migration
- [ ] Backup current VM data (content + database)
- [ ] Test Dockerfile builds locally
- [ ] Test Cloud Run deployment in staging project
- [ ] Configure Cloud SQL database
- [ ] Set up load balancer and SSL certificates
- [ ] Update DNS to point to new infrastructure
- [ ] Configure monitoring and alerts
- [ ] Test rollback procedure

### During Migration
- [ ] Deploy to Cloud Run with --no-traffic first
- [ ] Run smoke tests on new revision
- [ ] Gradually migrate traffic (10% → 50% → 100%)
- [ ] Monitor error rates and latency
- [ ] Keep old VM running for emergency rollback

### After Migration
- [ ] Monitor for 24 hours
- [ ] Verify all features work (admin, portal, webhooks)
- [ ] Test email sending
- [ ] Verify Authentik integration (if applicable)
- [ ] Update documentation
- [ ] Keep old VM for 1 week before decommissioning

---

## Troubleshooting

### Build Failures
```bash
# Check Cloud Build logs
gcloud builds list
gcloud builds log BUILD_ID

# Test Dockerfile locally
cd ghost-cloudrun
docker build -f Dockerfile.cloudrun -t test .
```

### Deployment Failures
```bash
# Check Cloud Run logs
gcloud run services logs read ghost-cms --region=us-central1 --limit=50

# Check revision status
gcloud run revisions describe REVISION_NAME --region=us-central1
```

### Database Connection Issues
```bash
# Test Cloud SQL connection
gcloud sql connect ghost-db --user=ghost

# Check Cloud SQL proxy
gcloud sql instances describe ghost-db
```

### Traffic Not Routing
```bash
# Check traffic split
gcloud run services describe ghost-cms --region=us-central1

# Verify load balancer
gcloud compute backend-services get-health ghost-cms-backend --global
```

---

## Next Steps

1. **Week 1:** Test locally and deploy to staging
2. **Week 2:** Configure Cloud SQL and migrate data
3. **Week 3:** Set up load balancer and DNS
4. **Week 4:** Production migration with gradual rollout

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Estimated Migration Time:** 6-8 hours total
**Risk Level:** Medium-High (full infrastructure change)
**Recommended Approach:** Stage deployment, test thoroughly, keep VM running for 1 week
