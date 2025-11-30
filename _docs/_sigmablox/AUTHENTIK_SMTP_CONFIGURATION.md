# Authentik SMTP Email Configuration
**SigmaBlox ICAM Platform - Email Setup Guide**

Last Updated: 2025-11-26

---

## Overview

This guide documents the proper configuration of SMTP email for Authentik deployed on GCP. Email is critical for:
- Password reset flows
- User invitations
- MFA setup
- Event notifications
- Test emails from the admin interface

---

## The Problem We Solved

### Initial Issue
When testing email from Authentik UI (`Events` → `Transports` → `Test`), we encountered:
```
ResponseError: Response returned an error code
Internal Server Error: /api/v3/events/transports/.../test/
```

### Root Causes Identified

1. **Missing Environment Variables**
   - Docker Compose expects `SMTP_USER` and `SMTP_PASS` variables
   - These were not present in the `.env` file on the GCP VM

2. **Conflicting Configuration**
   - Direct `AUTHENTIK_EMAIL__*` variables in `.env` were overriding the mapped values
   - This caused empty username/password to be passed to the containers

3. **Restart vs. Recreation**
   - `docker-compose restart` does NOT reload environment variables
   - Containers must be fully recreated with `docker-compose down && up -d`

---

## Correct Configuration

### Environment Variable Structure

The `docker-compose.authentik.yml` expects these variables in `.env`:

```bash
# SMTP Configuration (used by docker-compose to populate AUTHENTIK_EMAIL__* vars)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gus@mergecombinator.com          # Your Gmail address
SMTP_PASS=xiugoqyweapfxijr                  # Gmail App Password (16 chars)
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=gus@mergecombinator.com
```

### How docker-compose Maps Variables

```yaml
# docker-compose.authentik.yml
environment:
  AUTHENTIK_EMAIL__HOST: ${SMTP_HOST:-smtp.gmail.com}
  AUTHENTIK_EMAIL__PORT: ${SMTP_PORT:-587}
  AUTHENTIK_EMAIL__USERNAME: ${SMTP_USER}
  AUTHENTIK_EMAIL__PASSWORD: ${SMTP_PASS}
  AUTHENTIK_EMAIL__USE_TLS: ${SMTP_USE_TLS:-true}
  AUTHENTIK_EMAIL__FROM: ${AUTHENTIK_EMAIL_FROM:-noreply@sigmablox.com}
```

Docker Compose reads `SMTP_*` from `.env` and maps them to `AUTHENTIK_EMAIL__*` environment variables inside the containers.

### ⚠️ Critical: Do NOT Mix Configuration Methods

**WRONG** ❌ - Direct variables override mapped values:
```bash
# .env file
SMTP_USER=gus@mergecombinator.com
SMTP_PASS=secret123

# These will OVERRIDE the above!
AUTHENTIK_EMAIL__USERNAME=
AUTHENTIK_EMAIL__PASSWORD=
```

**CORRECT** ✅ - Use ONLY the SMTP_* variables:
```bash
# .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gus@mergecombinator.com
SMTP_PASS=secret123
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=gus@mergecombinator.com
```

---

## Gmail App Password Setup

### Step 1: Enable 2-Step Verification

1. Go to [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Enable if not already enabled

### Step 2: Generate App Password

1. In **Security**, go to **2-Step Verification** → **App passwords**
2. Click **Generate**
3. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → "Authentik SMTP"
4. Click **Generate**
5. Copy the 16-character password (no spaces)
6. Use this as your `SMTP_PASS` value

**Important**: The app password is different from your regular Gmail password!

---

## Deployment Procedure

### For GCP VM Deployment

#### Step 1: SSH to VM
```bash
gcloud compute ssh authentik-staging \
  --zone=us-central1-a \
  --project=sigmablox \
  --tunnel-through-iap
```

#### Step 2: Update Environment File
```bash
cd /opt/authentik

# Edit .env file
nano .env

# Add/update these lines:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=your-email@gmail.com
```

#### Step 3: Remove Any Conflicting Variables
```bash
# Remove any direct AUTHENTIK_EMAIL__* variables
sed -i.bak '/^AUTHENTIK_EMAIL__/d' .env

# Verify the clean configuration
cat .env | grep -E '^(SMTP_|AUTHENTIK_EMAIL)'
```

#### Step 4: Recreate Containers
```bash
# Stop and remove containers (this is required!)
docker-compose down

# Recreate with new environment variables
docker-compose up -d

# Wait for containers to be healthy
docker-compose ps
```

#### Step 5: Verify Configuration
```bash
# Check environment variables inside container
docker exec authentik-server env | grep AUTHENTIK_EMAIL

# Should show:
# AUTHENTIK_EMAIL__USERNAME=your-email@gmail.com
# AUTHENTIK_EMAIL__PASSWORD=your-app-password
# AUTHENTIK_EMAIL__HOST=smtp.gmail.com
# AUTHENTIK_EMAIL__PORT=587
# AUTHENTIK_EMAIL__USE_TLS=true
# AUTHENTIK_EMAIL__FROM=your-email@gmail.com
```

---

## Testing Email Configuration

### Method 1: Authentik Admin UI

1. Navigate to: `https://auth.sigmablox.com/if/admin/`
2. Go to **Events** → **Transports**
3. Find or create an email notification transport
4. Click **Test** button
5. Check your email inbox

**Expected Result**: ✅ Test email received
**On Error**: Check logs (see Troubleshooting section)

### Method 2: Password Reset Flow

1. Go to Authentik login page
2. Click **Forgot Password**
3. Enter a test user email
4. Check inbox for reset email

### Method 3: User Invitation

1. Create a new user in Authentik
2. Check **Send notification** when creating
3. User should receive invitation email

---

## Troubleshooting

### Issue: Test Email Fails with "Internal Server Error"

**Symptoms**:
```
ResponseError: Response returned an error code
```

**Diagnosis**:
```bash
# Check worker logs (email is sent by worker)
docker-compose logs authentik-worker | grep -i email

# Check for authentication errors
docker-compose logs authentik-worker | grep -i "auth\|smtp"
```

**Solution**:
1. Verify `SMTP_USER` and `SMTP_PASS` are set in `.env`
2. Remove any `AUTHENTIK_EMAIL__*` variables from `.env`
3. Recreate containers: `docker-compose down && docker-compose up -d`

### Issue: "Authentication failed" in Logs

**Symptoms**:
```
SMTPAuthenticationError: (535, b'5.7.8 Username and Password not accepted')
```

**Solutions**:
1. **Verify Gmail App Password**: Must be 16-character app password, not regular password
2. **Check 2-Step Verification**: Must be enabled on Gmail account
3. **Regenerate App Password**: Delete old one, create new one
4. **Check for typos**: Ensure no extra spaces in `SMTP_PASS`

### Issue: "SMTP_USER variable is not set"

**Symptoms**:
```
level=warning msg="The \"SMTP_USER\" variable is not set. Defaulting to a blank string."
```

**Solution**:
1. Add `SMTP_USER` to `/opt/authentik/.env`
2. Recreate containers: `docker-compose down && docker-compose up -d`

### Issue: Changes Not Applied After Restart

**Symptom**: Updated `.env` but emails still fail

**Cause**: `docker-compose restart` doesn't reload environment variables

**Solution**:
```bash
# MUST use down/up to reload .env
docker-compose down
docker-compose up -d

# Verify new variables are loaded
docker exec authentik-server env | grep AUTHENTIK_EMAIL
```

### Issue: Port 587 Blocked

**Symptoms**:
```
ConnectionRefusedError: [Errno 111] Connection refused
```

**Solution**:
1. Check GCP firewall rules allow outbound SMTP
2. Try alternative port: `SMTP_PORT=465` with `SMTP_USE_SSL=true`
3. Contact GCP support if port 587 is blocked

---

## Production Checklist

Before deploying SMTP to production:

- [ ] Gmail App Password generated and securely stored
- [ ] 2-Step Verification enabled on Gmail account
- [ ] `.env` file contains SMTP_* variables (no AUTHENTIK_EMAIL__* overrides)
- [ ] Containers recreated with `docker-compose down && up -d`
- [ ] Environment variables verified inside container
- [ ] Test email sent successfully from Authentik UI
- [ ] Password reset flow tested
- [ ] User invitation email tested
- [ ] SMTP credentials stored in GCP Secret Manager (recommended)
- [ ] Monitoring configured for email delivery failures

---

## Security Best Practices

### 1. Use Dedicated Email Account

Create a dedicated Gmail account for Authentik:
- `noreply@sigmablox.com` or `auth@sigmablox.com`
- Don't use personal email accounts
- Enable 2FA on the dedicated account

### 2. Secure Credentials Storage

**Development**:
```bash
# Store in .env (gitignored)
/opt/authentik/.env
```

**Production**:
```bash
# Use GCP Secret Manager
gcloud secrets create authentik-smtp-user --data-file=- <<< "email@gmail.com"
gcloud secrets create authentik-smtp-pass --data-file=- <<< "app-password"

# Update deployment script to pull from Secret Manager
```

### 3. Rotate App Passwords Regularly

- Rotate every 90 days
- Delete old app passwords after rotation
- Update `.env` and recreate containers

### 4. Monitor Email Activity

- Enable Gmail activity logging
- Set up alerts for unusual sending patterns
- Monitor Authentik worker logs for email failures

---

## Alternative SMTP Providers

### SendGrid (Recommended for Production)

```bash
# .env configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=noreply@sigmablox.com
```

**Advantages**:
- Higher deliverability rates
- Better analytics and monitoring
- No 2FA complexity
- API key management

### AWS SES (For AWS-hosted infrastructure)

```bash
# .env configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_SES_SMTP_USERNAME
SMTP_PASS=YOUR_SES_SMTP_PASSWORD
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=noreply@sigmablox.com
```

### Mailgun (Good alternative)

```bash
# .env configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.sigmablox.com
SMTP_PASS=YOUR_MAILGUN_PASSWORD
SMTP_USE_TLS=true
AUTHENTIK_EMAIL_FROM=noreply@sigmablox.com
```

---

## Common Deployment Patterns

### Pattern 1: Local Development
```bash
# Use Gmail for quick testing
SMTP_HOST=smtp.gmail.com
SMTP_USER=dev@example.com
SMTP_PASS=dev-app-password
```

### Pattern 2: Staging Environment
```bash
# Use separate Gmail or SendGrid sandbox
SMTP_HOST=smtp.gmail.com
SMTP_USER=staging@sigmablox.com
SMTP_PASS=staging-app-password
AUTHENTIK_EMAIL_FROM=staging@sigmablox.com
```

### Pattern 3: Production Environment
```bash
# Use enterprise SMTP provider
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<stored-in-secret-manager>
AUTHENTIK_EMAIL_FROM=noreply@sigmablox.com
```

---

## Quick Reference

### Essential Commands

```bash
# View current SMTP configuration
docker exec authentik-server env | grep AUTHENTIK_EMAIL

# Test SMTP from container
docker exec -it authentik-worker python -c "
from django.core.mail import send_mail
send_mail('Test', 'Test email from Authentik',
          'noreply@sigmablox.com', ['test@example.com'])
"

# Check email logs
docker-compose logs authentik-worker | grep -i email

# Reload configuration
docker-compose down && docker-compose up -d
```

### Configuration File Locations

| Environment | Path |
|-------------|------|
| Local Dev | `/Users/paulgarcia/Dev/sigmablox/authentik/.env` |
| GCP Staging | `/opt/authentik/.env` |
| GCP Production | `/opt/authentik/.env` |

---

## Related Documentation

- [AUTHENTIK_SETUP.md](../authentik/AUTHENTIK_SETUP.md) - Full setup guide
- [DEPLOYMENT_SUMMARY.md](../authentik/DEPLOYMENT_SUMMARY.md) - Deployment overview
- [Authentik Email Docs](https://docs.goauthentik.io/docs/installation/configuration#email-configuration)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## Changelog

### 2025-11-26 - Initial Documentation
- Documented SMTP configuration fix
- Added troubleshooting guide
- Created production checklist
- Added alternative SMTP providers

---

**Status**: ✅ SMTP Working - Tested on GCP Staging
**Environment**: authentik-staging VM (GCP us-central1-a)
**Last Tested**: 2025-11-26
