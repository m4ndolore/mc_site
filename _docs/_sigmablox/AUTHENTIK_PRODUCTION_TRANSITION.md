# Authentik Production Transition Guide
**SigmaBlox ICAM Platform - Staging to Production Migration**

Last Updated: 2025-11-26

---

## Overview

This guide outlines the steps to transition Authentik from staging (`auth-staging.sigmablox.com`) to production (`auth.sigmablox.com`), including usability improvements, security hardening, and operational procedures.

---

## Current Status

### ✅ Completed - Staging Environment

| Component | Status | Details |
|-----------|--------|---------|
| Authentik Deployment | ✅ Running | GCP VM `authentik-staging` |
| SMTP Configuration | ✅ Working | Gmail SMTP with app password |
| OAuth2 Provider | ✅ Configured | Ghost CMS integration |
| User Groups | ✅ Created | 5-tier hierarchy (admin, trusted, industry, guest, restricted) |
| SSL/TLS | ✅ Working | Cloudflare Tunnel |
| Test Users | ✅ Created | All role levels tested |
| Email Notifications | ✅ Working | Password reset, invitations |

### 🚧 In Progress

| Task | Status | Priority |
|------|--------|----------|
| Production VM Setup | Pending | High |
| User Migration Script | Complete | High |
| Monitoring & Alerts | Pending | High |
| Backup Strategy | Pending | High |
| MFA Enforcement | Pending | Medium |
| Custom Branding | Partial | Low |

---

## Production Environment Requirements

### Infrastructure

**GCP Configuration**:
```yaml
VM Name: authentik-production
Project: sigmablox
Region/Zone: us-central1-a
Machine Type: e2-standard-2 (2 vCPU, 8 GB RAM)
Disk: 30 GB SSD (pd-balanced)
Domain: auth.sigmablox.com
Access: Internal IP only (via Cloudflare Tunnel)
```

**Networking**:
- Internal IP only (no external IP for security)
- Cloudflare Tunnel for external access
- Ports: 9000 (HTTP), 9443 (HTTPS) - internal only

### Security Requirements

- [ ] Production secrets generated (different from staging)
- [ ] Gmail app password for production email account
- [ ] MFA enabled for all admin accounts
- [ ] Database backups configured (daily snapshots)
- [ ] Secrets stored in GCP Secret Manager
- [ ] Access logs enabled
- [ ] SSL/TLS certificates configured
- [ ] Cloudflare WAF rules configured

---

## Pre-Production Usability Improvements

### 1. Enhanced Error Messages

**Current**: Generic "Authentication failed" errors
**Improvement**: Specific error messages for common scenarios

```python
# Authentik Custom Error Messages
- "Invalid email or password. Please try again."
- "Your account has been locked. Contact support."
- "Email not verified. Check your inbox."
- "Two-factor authentication failed. Try again or use backup code."
```

### 2. Improved Login Flow

**Changes**:
- Add "Remember me" checkbox (7-day session)
- Show last login timestamp
- Add "Forgot password?" link prominently
- Display loading indicator during authentication
- Add account status indicators

### 3. Better Onboarding Experience

**New User Flow**:
1. User receives invitation email
2. Clicks setup link → lands on branded setup page
3. Sets password with strength indicator
4. Optional: Configure MFA
5. Redirected to Ghost CMS automatically

**Invitation Email Template**:
```
Subject: Welcome to SigmaBlox - Set Up Your Account

Hi [Name],

You've been invited to join the SigmaBlox Defense Tech Platform.

Click below to set up your account:
[Set Up Account Button]

This link expires in 7 days.

Questions? Reply to this email or visit docs.sigmablox.com

--
The SigmaBlox Team
```

### 4. Self-Service Features

**Enable for Users**:
- Password reset without admin intervention
- Profile updates (name, avatar)
- MFA management (add/remove methods)
- View login history
- Manage active sessions

### 5. Admin Dashboard Improvements

**Additions**:
- User activity analytics
- Failed login attempt monitoring
- Group membership overview
- Quick user search/filter
- Bulk user operations (CSV import/export)

---

## Production Deployment Steps

### Phase 1: Infrastructure Setup (Week 1)

#### Step 1: Create Production VM

```bash
# Use the deployment script
cd /Users/paulgarcia/Dev/sigmablox/authentik
./authentik-deploy-internal.sh production

# Or manual deployment
gcloud compute instances create authentik-production \
  --project=sigmablox \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-balanced \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --no-address \
  --metadata=startup-script='#!/bin/bash
set -e
apt-get update
apt-get upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
mkdir -p /opt/authentik
' \
  --scopes=https://www.googleapis.com/auth/cloud-platform
```

#### Step 2: Configure Production Environment

```bash
# SSH to production VM
gcloud compute ssh authentik-production \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap

# Create .env file with production secrets
cd /opt/authentik
cat > .env << 'EOF'
# PostgreSQL Configuration
PG_DB=authentik
PG_USER=authentik
PG_PASS=$(openssl rand -base64 36 | tr -d '\n')

# Authentik Secret Key (DIFFERENT from staging!)
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n')

# Authentik Image
AUTHENTIK_IMAGE=ghcr.io/goauthentik/server
AUTHENTIK_TAG=2025.2.0

# Ports
COMPOSE_PORT_HTTP=9000
COMPOSE_PORT_HTTPS=9443

# Production SMTP (use dedicated production Gmail or SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@sigmablox.com
SMTP_PASS=<PRODUCTION_APP_PASSWORD>
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=noreply@sigmablox.com

# Authentik Configuration
AUTHENTIK_ERROR_REPORTING=false
AUTHENTIK_LOG_LEVEL=info
AUTHENTIK_DISABLE_EMBEDDED_OUTPOST=false

# Session configuration
AUTHENTIK_SESSION_COOKIE_AGE=86400
AUTHENTIK_SESSION_SAVE_EVERY_REQUEST=true
AUTHENTIK_SESSION_EXPIRE_AT_BROWSER_CLOSE=false
AUTHENTIK_REMEMBER_ME_DURATION=604800
EOF
```

#### Step 3: Deploy Authentik

```bash
# Copy docker-compose.yml to VM (if not already there)
# Start containers
cd /opt/authentik
docker-compose up -d

# Verify all containers are healthy
docker-compose ps

# Check logs
docker-compose logs -f
```

### Phase 2: Configuration (Week 1-2)

#### Step 1: Initial Authentik Setup

```bash
# Create SSH tunnel for initial setup
gcloud compute ssh authentik-production \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap \
  -- -L 9000:localhost:9000

# Open in browser
open http://localhost:9000/if/flow/initial-setup/
```

**Create Admin Account**:
- Email: Use your admin email
- Username: `prod-admin`
- Password: Strong password (stored in password manager)
- **Enable MFA immediately**

#### Step 2: Configure Branding

1. Navigate to **System** → **Settings**
2. Update:
   - **Title**: SigmaBlox
   - **Logo**: Upload production logo
   - **Favicon**: Upload favicon

3. Navigate to **System** → **Appearance**
4. Set:
   - **Primary color**: `#FF1A75`
   - **Background**: Dark theme

#### Step 3: Create OAuth2 Provider

Follow [AUTHENTIK_SETUP.md](../authentik/AUTHENTIK_SETUP.md) Section 4:

1. Create OAuth2/OIDC provider
2. Configure scopes and mappings
3. Create Ghost CMS application
4. Copy client credentials

**Production Redirect URIs**:
```
https://api.sigmablox.com/auth/callback
https://www.sigmablox.com/auth/callback
```

#### Step 4: Create User Groups

Follow [AUTHENTIK_SETUP.md](../authentik/AUTHENTIK_SETUP.md) Section 5:

Create all role groups:
- `sigmablox-admins`
- `sigmablox-trusted`
- `sigmablox-industry`
- `sigmablox-guests`
- `sigmablox-restricted`

#### Step 5: Configure Email Transport

1. Navigate to **Events** → **Transports**
2. Create **Email** transport
3. Test email delivery
4. Configure notification rules

### Phase 3: User Migration (Week 2)

#### Step 1: Export Ghost Users

```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook

# Export current Ghost members
node migrate-ghost-users-to-authentik.js --dry-run --export
```

#### Step 2: Create Users in Authentik

```bash
# Review the migration plan
node migrate-ghost-users-to-authentik.js --dry-run

# Execute migration (creates users in Authentik)
node migrate-ghost-users-to-authentik.js --execute

# Monitor progress
tail -f migration.log
```

#### Step 3: Send Onboarding Emails

```bash
# Trigger invitation emails for all new users
# This is done automatically during migration
# Users will receive setup links
```

#### Step 4: Verify Migration

```bash
# Check user count
docker exec authentik-server \
  python -c "from authentik.core.models import User; print(User.objects.count())"

# Verify group assignments
# Check in Authentik UI: Directory → Users
```

### Phase 4: Cloudflare Tunnel Setup (Week 2)

#### Step 1: Install Cloudflared

```bash
# SSH to production VM
gcloud compute ssh authentik-production \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap

# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflared.asc | sudo tee /etc/apt/trusted.gpg.d/cloudflared.asc
echo "deb https://pkg.cloudflare.com/$(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update
sudo apt-get install cloudflared -y
```

#### Step 2: Create Tunnel

```bash
# Authenticate with Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create authentik-production

# Note the tunnel ID from output
```

#### Step 3: Configure Tunnel

```bash
# Create tunnel config
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: auth.sigmablox.com
    service: http://localhost:9000
  - service: http_status:404
```

#### Step 4: Route DNS

```bash
# Route DNS to tunnel
cloudflared tunnel route dns authentik-production auth.sigmablox.com
```

#### Step 5: Start Tunnel as Service

```bash
# Install as systemd service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Verify
sudo systemctl status cloudflared
```

### Phase 5: Ghost Integration Update (Week 3)

#### Step 1: Update Webhook Environment

```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook

# Update .env.prod.yaml with production OAuth credentials
nano .env.prod.yaml
```

```yaml
# Update these values
AUTHENTIK_BASE_URL: "https://auth.sigmablox.com"
OAUTH_CLIENT_ID: "<production-client-id>"
OAUTH_CLIENT_SECRET: "<production-client-secret>"
OAUTH_AUTHORIZE_URL: "https://auth.sigmablox.com/application/o/authorize/"
OAUTH_TOKEN_URL: "https://auth.sigmablox.com/application/o/token/"
OAUTH_USERINFO_URL: "https://auth.sigmablox.com/application/o/userinfo/"
OAUTH_REDIRECT_URI: "https://api.sigmablox.com/auth/callback"
```

#### Step 2: Deploy Updated Webhook

```bash
# Deploy to Cloud Run
gcloud run deploy webhook-service \
  --source . \
  --env-vars-file .env.prod.yaml \
  --region us-central1 \
  --project sigmablox
```

#### Step 3: Update Ghost Theme

```bash
cd /Users/paulgarcia/Dev/sigmablox/ghost-cloudrun/ghost-data/themes/ease

# Update auth-service.js with production endpoints
# Deploy updated theme
```

### Phase 6: Monitoring & Backup (Week 3)

#### Step 1: Configure Database Backups

```bash
# Create backup script
cat > /opt/authentik/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/authentik/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec authentik-postgres pg_dump -U authentik authentik | gzip > $BACKUP_DIR/authentik_db_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/authentik_media_$DATE.tar.gz /opt/authentik/media

# Upload to GCS
gsutil cp $BACKUP_DIR/authentik_*.gz gs://sigmablox-backups/authentik/

# Cleanup old local backups (keep last 7 days)
find $BACKUP_DIR -name "authentik_*" -mtime +7 -delete
EOF

chmod +x /opt/authentik/backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/authentik/backup.sh") | crontab -
```

#### Step 2: Configure Monitoring

**GCP Monitoring**:
```bash
# Install monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Configure alerts in GCP Console:
# - CPU > 80% for 5 minutes
# - Memory > 90% for 5 minutes
# - Disk > 85%
# - Container unhealthy
```

**Uptime Monitoring**:
```bash
# Configure GCP Uptime Check
# URL: https://auth.sigmablox.com/if/flow/default-authentication-flow/
# Frequency: 1 minute
# Regions: Multiple
# Alert on: 2 consecutive failures
```

#### Step 3: Log Aggregation

```bash
# Configure Cloud Logging
gcloud logging sinks create authentik-logs \
  storage.googleapis.com/sigmablox-logs-authentik \
  --log-filter='resource.type="gce_instance" AND resource.labels.instance_id="<INSTANCE_ID>"'
```

---

## Production Cutover Plan

### Pre-Cutover Checklist

- [ ] Production VM healthy and accessible
- [ ] All containers running and healthy
- [ ] SMTP working (test email sent)
- [ ] OAuth2 provider configured
- [ ] User groups created
- [ ] Test users created and verified
- [ ] Cloudflare Tunnel active
- [ ] DNS pointing to tunnel
- [ ] SSL/TLS certificate valid
- [ ] Backups configured and tested
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented

### Cutover Steps (2-hour window)

**Preparation** (T-30 minutes):
1. Announce maintenance window to users
2. Take final backup of staging
3. Verify production is ready
4. Prepare rollback scripts

**Cutover** (T=0):
1. **Stop staging traffic** (if applicable)
2. **Update webhook env vars** to point to production
3. **Deploy webhook** with new configuration
4. **Test OAuth flow** with test user
5. **Verify user can login** to Ghost via Authentik
6. **Check logs** for errors
7. **Test all role levels**

**Verification** (T+30):
1. Admin user can login ✅
2. Trusted user can login ✅
3. Industry user can login ✅
4. Guest user can login ✅
5. Restricted user can login ✅
6. Password reset works ✅
7. MFA works (if enabled) ✅
8. Group sync works ✅

**Completion** (T+60):
1. Monitor for 1 hour
2. Verify no errors in logs
3. Announce completion
4. Update documentation

### Rollback Plan

If critical issues occur during cutover:

```bash
# Revert webhook to staging
gcloud run deploy webhook-service \
  --source . \
  --env-vars-file .env.staging.yaml \
  --region us-central1 \
  --project sigmablox

# Verify staging still works
curl https://api-staging.sigmablox.com/health

# Communicate issue to users
# Investigate root cause
# Schedule new cutover window
```

---

## Post-Production Tasks

### Week 1 After Launch

- [ ] Monitor error rates daily
- [ ] Review failed login attempts
- [ ] Check email delivery rates
- [ ] Verify backup completion
- [ ] Test disaster recovery procedure
- [ ] Collect user feedback
- [ ] Document any issues encountered

### Week 2-4 After Launch

- [ ] Analyze authentication metrics
- [ ] Optimize slow queries
- [ ] Fine-tune group permissions
- [ ] Enable MFA for all admins
- [ ] Plan user training sessions
- [ ] Create user documentation
- [ ] Implement additional monitoring

---

## Usability Enhancements Backlog

### Priority 1 (MVP for Production)

- [x] SMTP configuration working
- [ ] Clear error messages
- [ ] Password strength indicator
- [ ] Email templates branded
- [ ] "Remember me" functionality
- [ ] Mobile-responsive login page

### Priority 2 (Post-Launch Week 1-2)

- [ ] User profile page
- [ ] Login history view
- [ ] MFA setup wizard
- [ ] Account recovery options
- [ ] Session management UI
- [ ] Admin analytics dashboard

### Priority 3 (Future Enhancements)

- [ ] Social login (Google, GitHub)
- [ ] WebAuthn/Passkeys support
- [ ] Advanced audit logging
- [ ] Automated compliance reports
- [ ] Integration with Slack/Teams
- [ ] SCIM provisioning for enterprise

---

## Security Hardening

### Access Control

```bash
# Restrict SSH access
gcloud compute firewall-rules create allow-iap-ssh \
  --allow tcp:22 \
  --source-ranges 35.235.240.0/20 \
  --target-tags authentik-production

# Remove default SSH rule
gcloud compute firewall-rules delete default-allow-ssh
```

### Secrets Management

```bash
# Store secrets in GCP Secret Manager
echo -n "$SMTP_PASS" | gcloud secrets create authentik-smtp-pass --data-file=-
echo -n "$PG_PASS" | gcloud secrets create authentik-pg-pass --data-file=-
echo -n "$AUTHENTIK_SECRET_KEY" | gcloud secrets create authentik-secret-key --data-file=-

# Grant VM access to secrets
gcloud secrets add-iam-policy-binding authentik-smtp-pass \
  --member="serviceAccount:$(gcloud compute instances describe authentik-production --zone=us-central1-a --format='get(serviceAccounts[0].email)')" \
  --role="roles/secretmanager.secretAccessor"
```

### Rate Limiting

Configure in Authentik:
- **Login attempts**: 5 per 15 minutes
- **Password reset**: 3 per hour
- **Account lockout**: 10 failed attempts

### Audit Logging

Enable all event logging:
- Login attempts (success/failure)
- Group changes
- OAuth authorizations
- Admin actions
- Configuration changes

---

## Operational Procedures

### Daily Operations

**Morning Checks** (automated):
```bash
#!/bin/bash
# Check container health
docker-compose ps | grep -v "Up (healthy)" && echo "ALERT: Unhealthy containers"

# Check disk space
df -h | awk '$5 > 80 {print "ALERT: Disk usage at "$5}'

# Check last backup
find /opt/authentik/backups -name "authentik_db_*" -mtime +1 && echo "ALERT: Backup older than 24h"
```

### Weekly Maintenance

- Review authentication logs
- Check failed login patterns
- Verify backup integrity
- Review group memberships
- Update OS packages
- Check for Authentik updates

### Monthly Tasks

- Rotate Gmail app password
- Review user access levels
- Audit admin accounts
- Test disaster recovery
- Update documentation
- Performance optimization review

---

## Key Performance Indicators

### Authentication Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Login Success Rate | > 95% | < 90% |
| Average Login Time | < 2s | > 5s |
| Password Reset Time | < 3s | > 10s |
| Email Delivery Rate | > 98% | < 95% |
| OAuth Flow Success | > 99% | < 95% |

### System Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| CPU Usage | < 50% | > 80% |
| Memory Usage | < 70% | > 85% |
| Disk Usage | < 60% | > 75% |
| Container Uptime | > 99.9% | < 99% |
| Response Time | < 200ms | > 1s |

---

## Disaster Recovery

### Scenario 1: VM Failure

**Recovery Steps**:
```bash
# 1. Deploy new VM
./authentik-deploy-internal.sh production

# 2. Restore from backup
gsutil cp gs://sigmablox-backups/authentik/latest.sql.gz /tmp/
gunzip /tmp/latest.sql.gz
docker exec -i authentik-postgres psql -U authentik < /tmp/latest.sql

# 3. Verify and resume service
```

**RTO**: 30 minutes
**RPO**: 24 hours (daily backups)

### Scenario 2: Database Corruption

**Recovery Steps**:
```bash
# 1. Stop authentik services
docker-compose stop authentik-server authentik-worker

# 2. Restore database
docker exec -i authentik-postgres psql -U authentik < /backup/latest.sql

# 3. Restart services
docker-compose start authentik-server authentik-worker
```

### Scenario 3: Cloudflare Tunnel Down

**Recovery Steps**:
```bash
# 1. Check tunnel status
sudo systemctl status cloudflared

# 2. Restart tunnel
sudo systemctl restart cloudflared

# 3. If failed, create emergency external IP
gcloud compute instances add-access-config authentik-production \
  --zone=us-central1-a

# 4. Update DNS temporarily
```

---

## Success Criteria

Production is considered successful when:

- ✅ All users can authenticate successfully
- ✅ No critical errors in logs for 48 hours
- ✅ Email notifications delivered consistently
- ✅ OAuth flow works for all user types
- ✅ Backup and restore tested successfully
- ✅ Monitoring alerts configured and tested
- ✅ Performance meets SLA targets
- ✅ Security audit completed
- ✅ User feedback is positive
- ✅ Rollback tested and documented

---

## Related Documentation

- [AUTHENTIK_SETUP.md](../authentik/AUTHENTIK_SETUP.md) - Initial setup guide
- [AUTHENTIK_SMTP_CONFIGURATION.md](./AUTHENTIK_SMTP_CONFIGURATION.md) - SMTP troubleshooting
- [Authentik Official Docs](https://docs.goauthentik.io/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

## Contact & Support

**Emergency Contacts**:
- **On-Call Engineer**: [Add contact]
- **GCP Support**: Via Cloud Console
- **Cloudflare Support**: Via dashboard

**Documentation Updates**:
- This guide should be updated after each production deployment
- All changes must be reviewed and approved

---

**Document Version**: 1.0
**Last Updated**: 2025-11-26
**Next Review**: 2025-12-26
**Status**: Ready for Production Deployment
