# GitHub Actions Deployment Fixes

## Issue Summary

GitHub Actions was failing to deploy the Ghost theme to production with the error:
```
permission denied while trying to connect to the Docker daemon socket
```

## Root Causes

1. **Missing SSH Keys in VM Metadata** - The VM had NO SSH keys configured, preventing GitHub Actions from connecting
2. **Docker Group Permissions** - Docker commands were failing due to group membership not being recognized in SSH sessions
3. **Error Visibility** - The `--quiet` flag was hiding actual error messages

## Fixes Applied

### 1. SSH Authentication (`.github/workflows/deploy.yml`)

**Before:**
- Keys were written but not properly configured
- No SSH config file
- No connection testing

**After:**
```yaml
- name: Configure SSH key for VM access
  run: |
    mkdir -p ~/.ssh

    # Strip Windows line endings
    echo "$GHOST_SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/google_compute_engine
    echo "$GHOST_SSH_PUBLIC_KEY" | tr -d '\r' > ~/.ssh/google_compute_engine.pub
    chmod 600 ~/.ssh/google_compute_engine
    chmod 644 ~/.ssh/google_compute_engine.pub

    # Create SSH config
    cat >> ~/.ssh/config <<EOF
    Host *
      StrictHostKeyChecking no
      UserKnownHostsFile /dev/null
      IdentityFile ~/.ssh/google_compute_engine
      LogLevel ERROR
    EOF

    # Validate keys
    ssh-keygen -lf ~/.ssh/google_compute_engine || exit 1
    ssh-keygen -lf ~/.ssh/google_compute_engine.pub || exit 1

    # Test connection
    gcloud compute ssh $PROD_VM --zone=$PROD_ZONE --command="echo 'SSH connection successful'"
```

**Benefits:**
- ✅ Validates key format before attempting deployment
- ✅ Tests SSH connection before uploading files
- ✅ Clear error messages if authentication fails
- ✅ Strips problematic line endings

### 2. Docker Permissions (`deploy-to-production.sh`)

**Before:**
```bash
docker cp ease $CONTAINER_NAME:/tmp/
docker exec $CONTAINER_NAME sh -c '...'
docker restart $CONTAINER_NAME
```

**After:**
```bash
sudo docker cp ease $CONTAINER_NAME:/tmp/
sudo docker exec $CONTAINER_NAME sh -c '...'
sudo docker restart $CONTAINER_NAME
```

**Why This Works:**
- The VM user is in the `google-sudoers` group which allows passwordless sudo
- SSH sessions from GitHub Actions don't inherit docker group membership
- Using `sudo` ensures Docker daemon access without password prompts
- This is the standard approach for GCP VMs with service accounts

### 3. Error Visibility

**Before:**
```bash
gcloud compute scp theme-deploy.tar.gz $PROD_VM:/tmp/ --zone=$PROD_ZONE --quiet
gcloud compute ssh $PROD_VM --zone=$PROD_ZONE --command="..." 2>/dev/null
```

**After:**
```bash
# Removed --quiet to see actual errors
if ! gcloud compute scp theme-deploy.tar.gz $PROD_VM:/tmp/ --zone=$PROD_ZONE; then
    echo "❌ Failed to upload theme package"
    echo "This usually means SSH authentication failed."
    exit 1
fi

# Removed 2>/dev/null to see actual errors
if ! gcloud compute ssh $PROD_VM --zone=$PROD_ZONE --command="..."; then
    echo "❌ Failed to deploy theme to container"
    exit 1
fi
```

**Benefits:**
- ✅ See actual error messages in GitHub Actions logs
- ✅ Fail fast with helpful error messages
- ✅ Easier to debug deployment issues

## VM Configuration

Added SSH public key to VM metadata:

```bash
gcloud compute instances add-metadata ghost-staging \
  --zone=us-central1-a \
  --metadata=ssh-keys="paulgarcia:$(cat ~/.ssh/google_compute_engine.pub)"
```

**Verification:**
```bash
# Check keys are in VM
gcloud compute instances describe ghost-staging \
  --zone=us-central1-a \
  --format="value(metadata.items.ssh-keys)"

# Test SSH connection
gcloud compute ssh ghost-staging \
  --zone=us-central1-a \
  --command="echo 'Connection successful'"
```

## GitHub Secrets Configuration

Required secrets in GitHub repository settings:

| Secret Name | Source | Format |
|------------|--------|--------|
| `GHOST_SSH_PRIVATE_KEY` | `~/.ssh/google_compute_engine` | Include BEGIN/END lines, preserve line breaks |
| `GHOST_SSH_PUBLIC_KEY` | `~/.ssh/google_compute_engine.pub` | Single line starting with `ssh-rsa` |
| `GHOST_PROD_VM` | Manual | VM name (e.g., `ghost-staging`) |
| `GHOST_PROD_ZONE` | Manual | Zone (e.g., `us-central1-a`) |
| `GHOST_CONTAINER_NAME` | Manual | Docker container name (e.g., `ghost-staging`) |
| `GCP_PROJECT_ID` | Manual | GCP project ID (e.g., `sigmablox`) |
| `GCP_REGION` | Manual | Region (e.g., `us-central1`) |
| `GCP_SA_KEY` | GCP IAM | Service account JSON key |

## Testing Tools

Created `test-ssh-keys.sh` to verify setup before pushing:

```bash
chmod +x test-ssh-keys.sh
./test-ssh-keys.sh
```

This script:
- ✅ Verifies SSH key files exist
- ✅ Validates key format
- ✅ Checks public key is in VM metadata
- ✅ Tests SSH connection
- ✅ Shows exactly what to copy to GitHub secrets

## Deployment Flow

1. **GitHub Actions Triggered** (push to `main`)
2. **Authentication** - Service account authenticates with GCP
3. **SSH Setup** - Configures SSH keys and tests connection
4. **Theme Package** - Creates tar.gz of Ghost theme
5. **Upload** - SCP copies package to VM
6. **Deploy** - Uses `sg docker` to copy files into container
7. **Restart** - Restarts Ghost container with `sg docker`
8. **Validation** - Verifies deployment succeeded

## Troubleshooting

If deployment still fails:

1. **Check GitHub Actions logs** - Now shows actual errors
2. **Verify SSH keys match** - Run `./test-ssh-keys.sh` locally
3. **Test manually** - Run `./deploy-to-production.sh --ghost-only --skip-confirmation`
4. **Check VM logs** - `gcloud compute ssh ghost-staging --command="docker logs ghost-staging"`

## Security Notes

- SSH keys are stored as GitHub secrets (encrypted at rest)
- Keys are only exposed during GitHub Actions execution
- VM uses SSH key authentication (no passwords)
- Docker commands run with minimum required group permissions
- Service account has least-privilege IAM roles

## Related Documentation

- `_docs/GITHUB_SECRETS_SETUP.md` - Detailed setup guide
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `deploy-to-production.sh` - Main deployment script
- `test-ssh-keys.sh` - Local testing script
