# SigmaBlox FAQ & Known Issues

Compiled notes on recurring issues, fixes, and troubleshooting steps for the Ghost + webhook stack.

---

## CORS Credentials Error - Local Development

**Symptom**
```
Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'
```

**Root Cause**
Port conflict - webhook service must run on port 2000 to avoid conflicts with other projects on port 3000.

**Fix**
Ensure `webhook/.env.dev.yaml` has:
```yaml
PORT: 2000
```

And verify frontend files use port 2000:
- `ghost-cloudrun/ghost-data/themes/ease/assets/js/dev-override.js` → line 23
- `ghost-cloudrun/ghost-data/themes/ease/assets/js/auth-service.js` → line 35
- `ghost-cloudrun/ghost-data/themes/ease/assets/js/company-onboarding.js` → line 17

Start webhook: `cd webhook && node local-server.js`

**Verify CORS**
```bash
curl -i -X OPTIONS http://localhost:2000/getRequests \
  -H 'Origin: http://localhost:2368' \
  -H 'Access-Control-Request-Method: GET'
```

Must return: `Access-Control-Allow-Credentials: true`

---

## Local Admin Dashboard Authentication

**Symptom**
401 errors when accessing admin dashboard endpoints.

**Root Cause**
Missing or invalid Ghost Admin API key in development config.

**Fix**
1. Get local Ghost admin API key: `http://localhost:2368/ghost` → Settings → Integrations → Create custom integration
2. Update `webhook/.env.dev.yaml`:
   ```yaml
   GHOST_ADMIN_API_KEY: "<your-local-key>"
   ```
3. Sign into Ghost locally before accessing admin dashboard

---

## IAP Tunnel Failure When Syncing Ghost Data

**Symptom** – `sync-ghost-data.sh` fails with:
```
ConnectionCreationError: failed to connect to backend (Failed to connect to port 22)
```

**Fix**
1. Ensure you’re authenticated and targeting the right project:
   ```bash
   gcloud auth login
   gcloud config set project sigmablox
   ```
2. Run the built-in troubleshooter:
   ```bash
   gcloud compute ssh ghost-staging \
     --zone=us-central1-a \
     --troubleshoot --tunnel-through-iap
   ```
   Follow the remediation steps (usually re-enabling the IAP TCP forwarding firewall rule).
3. Once SSH succeeds, re-run `./sync-ghost-data.sh` (now defaults to `ghost-staging`).

---

## Quick Checklist After Syncing Production to Local

1. `./sync-ghost-data.sh` (copies DB, images, theme from `ghost-staging`).
2. Restart local services (`./start-local.sh`).
3. Sign into local Ghost → verify admin navigation loads.
4. Check webhook health and CORS (commands above).
5. Confirm admin dashboard calls reach the webhook (monitor `webhook/logs/webhook.log`).

Keep this page updated with new findings so future debugging is faster.
