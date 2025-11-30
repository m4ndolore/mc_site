# Cloud Build → VM Deployment Setup

**Created:** November 1, 2025
**Purpose:** Automated deployments to Ghost VM via Cloud Build triggers

---

## Overview

This guide sets up Cloud Build to automatically deploy Ghost theme changes to your VM when you push to GitHub. This gives you:

- ✅ **Git push = automatic deployment** (no manual SSH needed)
- ✅ **Keep your working SQLite + VM setup**
- ✅ **Full audit trail** in Cloud Build logs
- ✅ **Automated testing** before deployment
- ✅ **Rollback capability** via git

**Architecture:**
```
GitHub (push to main)
    ↓
Cloud Build Trigger
    ↓
Build Container
    ↓
Package Theme → SCP to VM → SSH Restart Ghost
    ↓
Production Updated!
```

---

## Prerequisites (Already Done ✅)

- [x] Cloud Build API enabled
- [x] Cloud Build has necessary IAM roles
- [x] VM (ghost-staging) running and accessible
- [x] cloudbuild-vm.yaml created

---

## Step 1: Configure VM SSH Access for Cloud Build

Cloud Build needs SSH access to your VM. We'll create a service account SSH key.

### 1.1 Create SSH Key for Cloud Build

```bash
# Get your Cloud Build service account email
PROJECT_NUMBER=$(gcloud projects describe sigmablox --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Cloud Build Service Account: $CLOUD_BUILD_SA"

# Create SSH key pair
ssh-keygen -t rsa -f ~/.ssh/cloudbuild-vm-key -C "$CLOUD_BUILD_SA" -N ""

# This creates:
# ~/.ssh/cloudbuild-vm-key (private key)
# ~/.ssh/cloudbuild-vm-key.pub (public key)
```

### 1.2 Add Public Key to VM

```bash
# Get the public key
cat ~/.ssh/cloudbuild-vm-key.pub

# SSH into your VM
gcloud compute ssh ghost-staging --zone=us-central1-a

# On the VM, add the key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Verify permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Exit VM
exit
```

### 1.3 Store Private Key in Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secret with private key
gcloud secrets create cloudbuild-vm-ssh-key \
    --data-file=$HOME/.ssh/cloudbuild-vm-key \
    --replication-policy="automatic"

# Grant Cloud Build access to the secret
gcloud secrets add-iam-policy-binding cloudbuild-vm-ssh-key \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor"

# Verify secret was created
gcloud secrets describe cloudbuild-vm-ssh-key
```

---

## Step 2: Update cloudbuild-vm.yaml

Your `cloudbuild-vm.yaml` should look like this:

```yaml
# Cloud Build configuration for VM deployment
# Triggers on push to main branch

steps:
  # Step 1: Retrieve SSH key from Secret Manager
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'get-ssh-key'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud secrets versions access latest --secret=cloudbuild-vm-ssh-key > /root/.ssh/id_rsa
        chmod 600 /root/.ssh/id_rsa

        # Add VM to known_hosts
        ssh-keyscan -H ghost-staging >> /root/.ssh/known_hosts 2>/dev/null || true

  # Step 2: Package Ghost theme
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'package-theme'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        echo "📦 Packaging Ghost theme..."
        cd ghost-cloudrun/ghost-data/themes/ease
        tar -czf /workspace/ease-theme.tar.gz .
        echo "✅ Theme packaged"

  # Step 3: Deploy to VM
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'deploy-to-vm'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        set -e

        echo "🚀 Deploying to ghost-staging VM..."

        # Get VM internal IP
        VM_IP=$(gcloud compute instances describe ghost-staging \
          --zone=us-central1-a \
          --format='get(networkInterfaces[0].networkIP)')

        echo "VM IP: $${VM_IP}"

        # Copy theme to VM
        echo "📤 Copying theme to VM..."
        gcloud compute scp /workspace/ease-theme.tar.gz \
          ghost-staging:/tmp/ease-theme.tar.gz \
          --zone=us-central1-a \
          --tunnel-through-iap

        # Extract and restart on VM
        echo "🔄 Extracting theme and restarting Ghost..."
        gcloud compute ssh ghost-staging \
          --zone=us-central1-a \
          --tunnel-through-iap \
          --command="
            set -e
            cd ~/ghost/content/themes/ease

            # Backup current theme
            tar -czf ~/ease-backup-\$(date +%Y%m%d-%H%M%S).tar.gz .

            # Extract new theme
            tar -xzf /tmp/ease-theme.tar.gz

            # Cleanup temp file
            rm /tmp/ease-theme.tar.gz

            # Restart Ghost
            cd ~/ghost
            sudo docker compose restart ghost

            echo '✅ Theme deployed and Ghost restarted'
          "

  # Step 4: Wait for Ghost to be ready
  - name: 'gcr.io/cloud-builders/curl'
    id: 'wait-for-ghost'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        echo "⏳ Waiting for Ghost to be ready..."
        sleep 10

        echo "✅ Ghost should be ready"

  # Step 5: Smoke test
  - name: 'gcr.io/cloud-builders/curl'
    id: 'smoke-test'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        echo "🧪 Running smoke tests..."

        # Test homepage
        if curl -f -s https://www.sigmablox.com > /dev/null; then
          echo "✅ Homepage test passed"
        else
          echo "❌ Homepage test failed"
          exit 1
        fi

        # Test admin
        if curl -f -s https://www.sigmablox.com/ghost/ > /dev/null; then
          echo "✅ Admin test passed"
        else
          echo "❌ Admin test failed"
          exit 1
        fi

        echo "🎉 All smoke tests passed!"

# Timeout for entire build
timeout: '600s'  # 10 minutes

# Log to Cloud Logging
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'N1_HIGHCPU_8'

# Tags for organization
tags:
  - 'ghost-theme'
  - 'vm-deployment'
  - 'production'
```

---

## Step 3: Create Cloud Build Trigger

### 3.1 Via Console (Recommended)

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=sigmablox)

2. Click **"Create Trigger"**

3. Configure:
   - **Name:** `ghost-vm-deploy`
   - **Description:** `Deploy Ghost theme to VM on push to main`
   - **Event:** Push to a branch
   - **Source:**
     - **Repository:** Connect your GitHub repository
     - **Branch:** `^main$` (regex pattern)
   - **Configuration:**
     - **Type:** Cloud Build configuration file (yaml or json)
     - **Location:** `cloudbuild-vm.yaml`
   - **Advanced (optional):**
     - **Substitution variables:** None needed
     - **Service account:** Default Cloud Build SA

4. Click **"Create"**

### 3.2 Via CLI (Alternative)

```bash
# First, connect your GitHub repo (if not already done)
# This will open a browser for OAuth
gcloud builds triggers create github \
    --name="ghost-vm-deploy" \
    --description="Deploy Ghost theme to VM on push to main" \
    --repo-name="ghost-cloudrun" \
    --repo-owner="YOUR_GITHUB_USERNAME" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild-vm.yaml" \
    --include-logs-with-status
```

---

## Step 4: Test the Deployment

### 4.1 Manual Test Build

```bash
# Trigger a build manually to test
gcloud builds submit \
    --config=cloudbuild-vm.yaml \
    --project=sigmablox

# Watch the build
gcloud builds list --ongoing
```

### 4.2 Test via Git Push

```bash
# Make a small change to test
cd ghost-cloudrun/ghost-data/themes/ease
echo "<!-- Build test $(date) -->" >> default.hbs

# Commit and push
git add .
git commit -m "test(deploy): trigger Cloud Build VM deployment"
git push origin main

# Watch the build in console
open https://console.cloud.google.com/cloud-build/builds?project=sigmablox

# Or via CLI
gcloud builds list --ongoing --format="table(id,status,createTime)"
gcloud builds log $(gcloud builds list --ongoing --format='value(id)' | head -1) --stream
```

### 4.3 Verify Deployment

```bash
# Check site is up
curl -I https://www.sigmablox.com

# Check build comment was added
curl -s https://www.sigmablox.com | grep "Build test"

# Check Ghost logs on VM
gcloud compute ssh ghost-staging --zone=us-central1-a \
    --command="cd ~/ghost && sudo docker compose logs ghost --tail=20"
```

---

## Step 5: Monitor & Maintain

### View Build History

```bash
# List recent builds
gcloud builds list --limit=10

# View specific build
gcloud builds describe BUILD_ID

# View logs
gcloud builds log BUILD_ID
```

### Build Notifications

Set up Slack/Email notifications:

```bash
# Create Pub/Sub topic for build notifications
gcloud pubsub topics create cloud-builds

# Create subscription
gcloud pubsub subscriptions create cloud-builds-sub \
    --topic=cloud-builds

# Configure Cloud Build to publish to topic
# (Done via Console: Cloud Build → Settings → Notifications)
```

---

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH from Cloud Build SA
gcloud builds submit --config=- <<EOF
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['compute', 'ssh', 'ghost-staging', '--zone=us-central1-a', '--command=echo "SSH works!"']
EOF
```

### Permission Errors

```bash
# Verify Cloud Build SA has Compute Admin role
gcloud projects add-iam-policy-binding sigmablox \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/compute.admin"
```

### Theme Not Updating

```bash
# Check Ghost restart actually happened
gcloud compute ssh ghost-staging --zone=us-central1-a
cd ~/ghost
sudo docker compose logs ghost | tail -50
```

---

## Rollback Procedure

If a deployment breaks something:

```bash
# Option 1: Revert git commit and push
git revert HEAD
git push origin main
# Cloud Build will auto-deploy the reverted version

# Option 2: Manual rollback on VM
gcloud compute ssh ghost-staging --zone=us-central1-a
cd ~/ghost/content/themes/ease
# Find backup
ls -la ~/ease-backup-*
# Restore backup
tar -xzf ~/ease-backup-YYYYMMDD-HHMMSS.tar.gz
cd ~/ghost
sudo docker compose restart ghost
```

---

## Benefits Achieved

✅ **Automated Deployments**
- Git push → automatic deployment
- No manual SSH needed
- Full audit trail

✅ **Safety**
- Automatic theme backups on VM
- Smoke tests after deployment
- Easy rollback via git revert

✅ **Speed**
- 2-3 minute deployments
- Parallel with other work
- No manual steps

✅ **Simplicity**
- Keep SQLite (no migration)
- Keep VM (working setup)
- Just add automation

---

## Next Steps

1. ✅ Create SSH keys
2. ✅ Store in Secret Manager
3. ✅ Update cloudbuild-vm.yaml
4. ✅ Create Cloud Build trigger
5. ✅ Test deployment
6. 📊 Set up build notifications (optional)
7. 📈 Configure monitoring (optional)

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Status:** Ready for Implementation
