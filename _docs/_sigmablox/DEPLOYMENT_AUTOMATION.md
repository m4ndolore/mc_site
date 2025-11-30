# Deployment Automation (GitHub Actions)

**Status:** Active  
**Last Updated:** November 13, 2025

This document describes the production deployment pipeline powered by GitHub Actions. The workflow builds and tests the webhook service, deploys the Ghost theme to the production VM, deploys the webhook to Cloud Run, and runs basic smoke tests.

---

## 1. Workflow Overview

File: `.github/workflows/deploy.yml`

Triggers:
- Pushes to `main`
- Manual `workflow_dispatch`

Jobs:
1. **`test`**
   - Installs webhook dependencies (`npm ci`)
   - Runs Jest tests (`npm test -- --runInBand`)

2. **`deploy`**
   - Configures the Google Cloud SDK
   - Installs deployment prerequisites (`jq`)
   - Writes the dedicated SSH key used for VM access
   - Runs `./deploy-to-production.sh --ghost-only --skip-confirmation` to push the theme to the Ghost VM
   - Uses `google-github-actions/deploy-cloudrun@v2` to deploy the webhook service from `./webhook`
   - Executes HTTP smoke tests against production URLs

The workflow favors Cloudflare (SSH tunnel ready), GitHub (orchestration), and Google Cloud (deployment targets), matching the desired priority order.

---

## 2. Required GitHub Secrets

| Secret | Description |
| ------ | ----------- |
| `GCP_PROJECT_ID` | Google Cloud project ID (e.g., `sigmablox`) |
| `GCP_REGION` | Cloud Run region (e.g., `us-central1`) |
| `GCP_SA_KEY` | Base64-encoded JSON key for a service account with `roles/run.admin`, `roles/compute.admin`, `roles/iam.serviceAccountUser`, and `roles/storage.admin` (for SCP/SSH) |
| `GHOST_PROD_VM` | Compute Engine instance name hosting Ghost (e.g., `ghost-staging`) |
| `GHOST_PROD_ZONE` | Zone of the Ghost VM (e.g., `us-central1-a`) |
| `GHOST_CONTAINER_NAME` | Name of the Ghost Docker container on the VM (e.g., `ghost-staging`) |
| `WEBHOOK_SERVICE_NAME` | Cloud Run service name for the webhook (e.g., `webhook-service`) |
| `GHOST_SSH_PRIVATE_KEY` | Private key that already has its public half added to the VM/project metadata |
| `GHOST_SSH_PUBLIC_KEY` | Matching public key (used by `gcloud compute ssh`) |
| `SMOKE_WEB_URL` | URL of the production site (e.g., `https://www.sigmablox.com`) |
| `SMOKE_API_HEALTH_URL` | Webhook health endpoint (e.g., `https://api.sigmablox.com/health`) |
| `SMOKE_ASSISTANT_URL` | Assistant status endpoint (e.g., `https://api.sigmablox.com/api/assistant/status`) |

> **Note:** Add the SSH public key to either the project-wide metadata or the VM’s metadata so that Compute Engine grants access when the workflow connects.

---

## 3. Smoke Tests

The workflow performs three HTTP checks after deployment:
1. `SMOKE_WEB_URL` – ensures the public site loads (expect HTTP 200).
2. `SMOKE_API_HEALTH_URL` – ensures the webhook/Cloud Run service responds (expect HTTP 200).
3. `SMOKE_ASSISTANT_URL` – ensures the assistant API remains enabled and healthy.

All requests run with `curl -fsSL`, which will fail the workflow if any endpoint returns a non-2xx status or times out.

---

## 4. Operational Notes

- **Velocity over strict gating:** This pipeline accepts moderate risk (no canary / blue-green) to keep iteration fast. Broken smoke tests will halt the workflow, but there is no automated rollback.
- **Ghost VM access:** `deploy-to-production.sh` still orchestrates SCP/SSH work; the action simply supplies the necessary SSH key and env vars.
- **Cloud Run deploys:** The official GitHub Action builds the container from `./webhook`, pushes it, and keeps min/max instances aligned with current settings.
- **Manual fallback:** `./deploy-to-production.sh` and `webhook/deploy-to-prod.sh` remain usable locally if GitHub Actions is unavailable.

---

## 5. Future Enhancements

1. Replace SSH-based VM deploys with a lightweight API exposed via Cloudflare Tunnel to remove direct SSH from CI.
2. Add preview/staging deployments triggered from feature branches.
3. Expand smoke tests with scripted interactions (e.g., check `/favorites`, assistant chat round-trip).

Until then, this workflow provides a single command deploy path with basic validation, matching the current appetite for rapid iteration.
