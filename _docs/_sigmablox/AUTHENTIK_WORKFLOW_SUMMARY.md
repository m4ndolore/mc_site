# Authentik Workflow Summary
**SigmaBlox ICAM Platform - Quick Reference Guide**

Last Updated: 2025-11-26

---

## Current Status

### ✅ Staging Environment (READY)

| Component | Status | Details |
|-----------|--------|---------|
| **Infrastructure** | ✅ Deployed | GCP VM `authentik-staging` (us-central1-a) |
| **Authentik Version** | ✅ 2025.2.0 | Latest stable release |
| **SMTP Email** | ✅ Working | Gmail SMTP - tested successfully |
| **OAuth2/OIDC** | ✅ Configured | Ghost CMS integration active |
| **SSL/TLS** | ✅ Active | Cloudflare Tunnel (auth.sigmablox.com) |
| **User Groups** | ✅ Created | 5-tier RBAC hierarchy |
| **Test Users** | ✅ Verified | All role levels tested |

### 🎯 Next: Production Deployment

Ready to deploy to production following [Production Transition Guide](./AUTHENTIK_PRODUCTION_TRANSITION.md).

---

## Authentication Flow

### User Login Journey

```
┌─────────────┐
│ User visits │
│ Ghost CMS   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Clicks "Log In" │
│ on Ghost        │
└──────┬──────────┘
       │
       ▼
┌────────────────────┐
│ Redirected to      │
│ Authentik Login    │
│ (auth.sigmablox.   │
│  com)              │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ User enters email/ │
│ password (+ MFA if │
│ enabled)           │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Authentik validates│
│ & creates session  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ OAuth callback to  │
│ webhook service    │
│ with auth code     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Webhook exchanges  │
│ code for tokens    │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Webhook fetches    │
│ user info + groups │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Webhook syncs user │
│ to Ghost (create/  │
│ update member)     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ User logged into   │
│ Ghost with hybrid  │
│ session (Authentik │
│ JWT + Ghost cookie)│
└────────────────────┘
```

---

## User Role Hierarchy

### Role Levels & Access

| Level | Role | Authentik Group | Ghost Label | Permissions |
|-------|------|----------------|-------------|-------------|
| 4 | **Admin** | `sigmablox-admins` | `admin` | Full platform access, user management, content editing |
| 3 | **Trusted** | `sigmablox-trusted` | `trusted` | View all companies, access contact info, business details |
| 2.5 | **Industry** | `sigmablox-industry` | `industry` | Limited company view, no contact/business details |
| 2 | **Guest** | `sigmablox-guests` | `guest` | View-only access, company listings |
| 1 | **Restricted** | `sigmablox-restricted` | `restricted` | Minimal access, list view only |

### Role Assignment Process

1. **Admin creates user** in Authentik (`Directory` → `Users` → `Create`)
2. **Assign to group** based on access needs
3. **Send invitation** email with setup link
4. **User sets password** and optionally configures MFA
5. **User logs into Ghost** → Group automatically synced to Ghost label
6. **Frontend enforces** role-based UI permissions

---

## Key Workflows

### 1. Adding a New User

**Admin Steps**:
```bash
# Via Authentik UI
1. Go to Directory → Users → Create
2. Enter: Email, Name, Username
3. Set Group: Select appropriate role group
4. Check "Send notification" to email invitation
5. Click Create

# Via Migration Script
cd /Users/paulgarcia/Dev/sigmablox/webhook
node migrate-ghost-users-to-authentik.js --execute
```

**User Experience**:
1. Receives invitation email
2. Clicks "Set Up Account" link
3. Creates password
4. Optionally sets up MFA
5. Redirected to Ghost, auto-logged in

### 2. Password Reset

**User Steps**:
```
1. Visit: https://auth.sigmablox.com/if/flow/default-recovery-flow/
2. Enter email address
3. Click "Reset Password"
4. Check email for reset link
5. Click link, set new password
6. Log in with new password
```

**Admin Reset (if user can't access email)**:
```
1. Authentik Admin → Directory → Users
2. Find user, click name
3. Click "Reset password"
4. Choose: Email link OR Set password directly
5. Notify user of change
```

### 3. Changing User Roles

**Process**:
```bash
# Via Authentik UI
1. Directory → Users → [User Name]
2. Go to "Groups" tab
3. Remove from current group
4. Add to new role group
5. Sync triggers automatically via webhook

# User's Ghost session updates on next login
# Or run manual sync:
cd /Users/paulgarcia/Dev/sigmablox/webhook
curl -X POST http://localhost:3000/sync-user \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 4. Bulk User Import

**From CSV**:
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook

# Create CSV: email,name,role
# admin@example.com,Admin User,admin
# user@example.com,Regular User,trusted

# Run import
node import-users-from-csv.js users.csv --dry-run
node import-users-from-csv.js users.csv --execute
```

### 5. Migrating Existing Ghost Users

**One-time migration**:
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook

# Preview migration
node migrate-ghost-users-to-authentik.js --dry-run

# Execute migration
node migrate-ghost-users-to-authentik.js --execute

# Check migration log
tail -f migration.log
```

### 6. Enabling MFA for a User

**User Self-Service**:
```
1. Log into Ghost
2. Click profile icon → Account
3. Scroll to "Two-Factor Authentication"
4. Click "Enable MFA"
5. Scan QR code with authenticator app
6. Enter verification code
7. Save backup codes
```

**Admin Enforcement**:
```
1. Authentik Admin → Policies → Policies
2. Create "Require MFA" policy
3. Bind to "Ghost CMS" application
4. All users must set up MFA on next login
```

---

## Common Operations

### Monitoring Authentication

**Check Login Activity**:
```bash
# Authentik UI
Events → Events → Filter by "Login"

# Via logs
gcloud compute ssh authentik-staging \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap \
  --command="cd /opt/authentik && docker-compose logs --tail=100 authentik-server | grep 'authentication_success\|authentication_failed'"
```

**Failed Login Alerts**:
```bash
# Check recent failures
Events → Events → Filter: action="authentication_failed"

# Export for analysis
Events → Events → Actions → Export
```

### Database Backup & Restore

**Backup**:
```bash
# SSH to VM
gcloud compute ssh authentik-staging \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap

# Backup database
cd /opt/authentik
docker exec authentik-postgres pg_dump -U authentik authentik | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to GCS
gsutil cp backup_*.sql.gz gs://sigmablox-backups/authentik/
```

**Restore**:
```bash
# Download backup
gsutil cp gs://sigmablox-backups/authentik/backup_20251126.sql.gz /tmp/

# Restore
gunzip /tmp/backup_20251126.sql.gz
docker exec -i authentik-postgres psql -U authentik < /tmp/backup_20251126.sql

# Restart services
docker-compose restart
```

### Updating Authentik

**Version Update**:
```bash
# SSH to VM
gcloud compute ssh authentik-staging \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap

cd /opt/authentik

# Backup first!
docker exec authentik-postgres pg_dump -U authentik authentik | gzip > backup_pre_update.sql.gz

# Update version in .env
nano .env
# Change: AUTHENTIK_TAG=2025.3.0

# Pull new images
docker-compose pull

# Recreate containers
docker-compose down
docker-compose up -d

# Check logs for migration
docker-compose logs -f
```

### Email Template Customization

**Edit Templates**:
```bash
# SSH to VM
cd /opt/authentik

# Create custom templates directory
mkdir -p custom-templates/email

# Copy base template
docker cp authentik-server:/templates/email/password_reset.html \
  custom-templates/email/

# Edit template
nano custom-templates/email/password_reset.html

# Mount in docker-compose (already configured)
# Templates in: /opt/authentik/custom-templates
```

### SSL Certificate Renewal

**Cloudflare Tunnel** (automatic):
- Certificates managed by Cloudflare
- No manual renewal needed

**Manual Certificate** (if not using tunnel):
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d auth.sigmablox.com

# Copy to Authentik
sudo cp /etc/letsencrypt/live/auth.sigmablox.com/fullchain.pem \
  /opt/authentik/certs/
sudo cp /etc/letsencrypt/live/auth.sigmablox.com/privkey.pem \
  /opt/authentik/certs/

# Restart Authentik
cd /opt/authentik
docker-compose restart
```

---

## Troubleshooting Quick Reference

| Issue | Quick Fix | Documentation |
|-------|-----------|---------------|
| Email not sending | Check `.env` SMTP vars, recreate containers | [SMTP Config](./AUTHENTIK_SMTP_CONFIGURATION.md) |
| User can't login | Verify group assignment, check password | [Setup Guide](../authentik/AUTHENTIK_SETUP.md#troubleshooting) |
| OAuth callback fails | Check redirect URI matches exactly | [Setup Guide](../authentik/AUTHENTIK_SETUP.md#troubleshooting) |
| Container unhealthy | Check logs: `docker-compose logs` | [README](../authentik/README.md#troubleshooting) |
| Database connection error | Verify PG_PASS, restart postgres | [README](../authentik/README.md#troubleshooting) |
| Groups not in JWT | Verify groups scope mapping | [Setup Guide](../authentik/AUTHENTIK_SETUP.md#troubleshooting) |

---

## Operational Checklists

### Daily Health Check

- [ ] Check container status: `docker-compose ps`
- [ ] Review failed logins: Authentik UI → Events
- [ ] Verify backup completed: `ls -lh /opt/authentik/backups/`
- [ ] Check disk space: `df -h`
- [ ] Monitor CPU/Memory: `docker stats`

### Weekly Maintenance

- [ ] Review authentication metrics
- [ ] Audit new user accounts
- [ ] Check for Authentik updates
- [ ] Verify email delivery working
- [ ] Test password reset flow
- [ ] Review access policies

### Monthly Tasks

- [ ] Rotate Gmail app password
- [ ] Full backup verification (restore test)
- [ ] Security audit (failed logins, unusual patterns)
- [ ] Update OS packages: `sudo apt update && sudo apt upgrade`
- [ ] Review and update documentation

---

## Emergency Procedures

### Authentik Down - Recovery

```bash
# 1. Check container status
docker-compose ps

# 2. Restart all services
docker-compose restart

# 3. If still down, check logs
docker-compose logs --tail=100

# 4. Nuclear option: Full restart
docker-compose down
docker-compose up -d

# 5. If database corrupted, restore from backup
# See "Database Backup & Restore" section above
```

### Locked Out of Authentik Admin

```bash
# SSH to VM
gcloud compute ssh authentik-staging \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap

# Create recovery link
cd /opt/authentik
docker exec -it authentik-server ak create_recovery_key 10 akadmin

# Use the generated link in browser
```

### Mass User Lockout (Attack Response)

```bash
# 1. Check Events for patterns
Events → Events → Filter: action="authentication_failed"

# 2. If attack detected, temporarily disable OAuth
# Edit application, disable temporarily

# 3. Review and block IPs if necessary
# Configure rate limiting in Cloudflare

# 4. Force password reset for affected users
# Bulk operation via API or UI

# 5. Re-enable after securing
```

---

## Performance Optimization

### Database Tuning

```sql
-- Connect to database
docker exec -it authentik-postgres psql -U authentik

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check slow queries
SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Cache Optimization

**Redis Configuration**:
```bash
# Check Redis memory usage
docker exec authentik-redis redis-cli INFO memory

# Set max memory (if needed)
docker exec authentik-redis redis-cli CONFIG SET maxmemory 512mb
docker exec authentik-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Container Resource Limits

```yaml
# Update docker-compose.yml
services:
  authentik-server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

---

## Integration Points

### Ghost CMS

**Endpoints**:
```
Authorization: https://auth.sigmablox.com/application/o/authorize/
Token:        https://auth.sigmablox.com/application/o/token/
User Info:    https://auth.sigmablox.com/application/o/userinfo/
JWKS:         https://auth.sigmablox.com/application/o/ghost-cms/jwks/
Logout:       https://auth.sigmablox.com/application/o/ghost-cms/end-session/
```

**Webhook Service**:
- Handles OAuth callback
- Syncs user groups to Ghost labels
- Manages session state

### Airtable Integration

User metadata sync:
- Company affiliations
- Industry tags
- Custom attributes

### Discourse Forum (Future)

Options:
1. SAML SSO directly from Authentik
2. Chain through Ghost → DoG → Discourse

---

## Metrics & KPIs

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Login Success Rate | > 95% | < 90% |
| Average Login Time | < 2s | > 5s |
| Email Delivery Rate | > 98% | < 95% |
| OAuth Callback Success | > 99% | < 95% |
| System Uptime | > 99.9% | < 99% |
| Active Sessions | - | Monitor trends |
| Failed Login Attempts | < 1% | > 5% |

---

## Documentation Index

### Setup Guides
1. **[AUTHENTIK_SETUP.md](../authentik/AUTHENTIK_SETUP.md)** - Initial setup and OAuth configuration
2. **[AUTHENTIK_SMTP_CONFIGURATION.md](./AUTHENTIK_SMTP_CONFIGURATION.md)** - Email setup and troubleshooting
3. **[AUTHENTIK_PRODUCTION_TRANSITION.md](./AUTHENTIK_PRODUCTION_TRANSITION.md)** - Staging to production migration

### Reference Documentation
- **[README.md](../authentik/README.md)** - Quick start and overview
- **[DEPLOYMENT_SUMMARY.md](../authentik/DEPLOYMENT_SUMMARY.md)** - Architecture and deployment details
- **[Authentik Official Docs](https://docs.goauthentik.io/)** - Upstream documentation

### Operational Guides
- **This Document** - Daily workflows and procedures
- **[Production Checklist](./AUTHENTIK_PRODUCTION_TRANSITION.md#production-checklist)** - Pre-deployment verification

---

## Quick Commands Reference

```bash
# SSH to VM
gcloud compute ssh authentik-staging --zone=us-central1-a --project=sigmablox --tunnel-through-iap

# Container operations
docker-compose ps                    # Status
docker-compose logs -f               # Tail logs
docker-compose restart               # Restart all
docker-compose down && up -d         # Full restart

# Database operations
docker exec authentik-postgres pg_dump -U authentik authentik > backup.sql
docker exec -i authentik-postgres psql -U authentik < backup.sql

# Email verification
docker exec authentik-server env | grep AUTHENTIK_EMAIL
docker-compose logs authentik-worker | grep -i email

# User management
# (Use Authentik UI: Directory → Users)

# Monitoring
docker stats                         # Resource usage
df -h                               # Disk space
systemctl status cloudflared         # Tunnel status
```

---

## Success Criteria

Authentik deployment is considered successful when:

- ✅ All users can authenticate via Ghost
- ✅ Email notifications delivered reliably
- ✅ Group sync working (Authentik → Ghost labels)
- ✅ Password reset flow functional
- ✅ MFA available for high-privilege users
- ✅ Monitoring and alerts configured
- ✅ Backups tested and verified
- ✅ Performance meets targets (< 2s login)
- ✅ Documentation complete and accurate
- ✅ Team trained on operations

---

## Support & Escalation

**For Issues**:
1. Check [Troubleshooting](#troubleshooting-quick-reference)
2. Review logs: `docker-compose logs`
3. Consult [Documentation Index](#documentation-index)
4. Contact: [Add contact info]

**Emergency Contact**:
- On-call engineer: [Add contact]
- GCP Support: Via Cloud Console
- Authentik Community: https://github.com/goauthentik/authentik/discussions

---

**Document Version**: 1.0
**Last Updated**: 2025-11-26
**Next Review**: 2025-12-26
**Status**: ✅ Staging Complete - Ready for Production
