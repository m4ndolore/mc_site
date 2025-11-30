# SigmaBlox Platform Documentation

**Status:** ✅ Production Stable | **Last Updated:** November 13, 2025

---

## Quick Start

- **[📊 Current State](CURRENT_STATE.md)** ⭐ - Platform overview, architecture, and operational status
- **[🚀 Migration Guide](MIGRATION_GUIDE.md)** - Complete production deployment process
- **[⚙️ Deployment Automation](DEPLOYMENT_AUTOMATION.md)** - GitHub Actions pipeline
- **[💾 Data Safety Strategy](DATA_SAFETY_STRATEGY.md)** - Backup and recovery procedures

---

## Documentation Index

### Production Operations
- **[CURRENT_STATE.md](CURRENT_STATE.md)** - Current platform status, architecture, and recent changes
- **[DEPLOY_TO_PRODUCTION.md](DEPLOY_TO_PRODUCTION.md)** - Theme deployment process
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Initial production setup and migration
- **[PROD_LESSONS.md](PROD_LESSONS.md)** - Lessons learned from production deployments

### Feature Documentation
- **[FAVORITES_DESIGN.md](FAVORITES_DESIGN.md)** - My Favorites feature design
- **[FAVORITES_SETUP.md](FAVORITES_SETUP.md)** - Favorites implementation guide
- **[FEATURE_DIFFERENCES.md](FEATURE_DIFFERENCES.md)** - Documented vs actual features

### Infrastructure & DevOps
- **[DEPLOYMENT_AUTOMATION.md](DEPLOYMENT_AUTOMATION.md)** - GitHub Actions pipeline
- **[DATA_SAFETY_STRATEGY.md](DATA_SAFETY_STRATEGY.md)** - Backup and data protection
- **[CLOUD_BUILD_VM_SETUP.md](CLOUD_BUILD_VM_SETUP.md)** - VM configuration via Cloud Build
- **[CLOUDFLARE_BLUE_GREEN_PLAN.md](CLOUDFLARE_BLUE_GREEN_PLAN.md)** - Blue-green deployment strategy

### Cloud Services
- **[CLOUD_RUN_FIX.md](CLOUD_RUN_FIX.md)** - Cloud Run troubleshooting
- **[CLOUD_RUN_MIGRATION.md](CLOUD_RUN_MIGRATION.md)** - Migration to Cloud Run

### Authentication & Security
- **[AUTHENTIK_RESTORATION_PLAN.md](AUTHENTIK_RESTORATION_PLAN.md)** - Authentik ICAM integration plan

### Reference & Troubleshooting
- **[FAQ_and_Issues.md](FAQ_and_Issues.md)** - Common questions and solutions
- **[project-overview.md](project-overview.md)** - Historical project overview
- **[quickstart.md](quickstart.md)** - Quick start guide

---

## For New Team Members

Start with these docs in order:

1. **[CURRENT_STATE.md](CURRENT_STATE.md)** - Understand what's running
2. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - How it was deployed
3. **[DEPLOYMENT_AUTOMATION.md](DEPLOYMENT_AUTOMATION.md)** - How to deploy changes
4. **[DATA_SAFETY_STRATEGY.md](DATA_SAFETY_STRATEGY.md)** - Backup procedures

Then explore feature-specific docs as needed.

---

## Essential Scripts

Located in project root:

```bash
# Deployment
./deploy.sh [staging|production]         # Unified deployment
./ghost-cloudrun/deploy-theme-to-vm.sh   # Theme-only to production
./webhook/deploy-to-prod.sh              # Webhook-only to production

# Local Development
./start-local.sh                         # Start Ghost locally
./stop-local.sh                          # Stop local Ghost
./sync-ghost-data.sh                     # Sync from production

# Maintenance
./restart-webhook.sh                     # Restart Cloud Run service
./rotate-credentials.sh                  # Rotate MongoDB credentials
./validate-production.sh                 # Health check
```

---

## Support

For issues or questions:

1. Check **[FAQ_and_Issues.md](FAQ_and_Issues.md)**
2. Review **[CURRENT_STATE.md](CURRENT_STATE.md)** for known issues
3. Check application logs:
   - Ghost: `gcloud compute ssh ghost-staging --command="sudo docker logs ghost-staging -f"`
   - Webhook: `gcloud run logs tail --service=webhook-service --region=us-central1`

---

**Platform:** Ghost CMS + Cloud Run + MongoDB Atlas
**Production:** https://www.sigmablox.com
**Status:** ✅ Fully Operational
**Last Updated:** November 13, 2025
