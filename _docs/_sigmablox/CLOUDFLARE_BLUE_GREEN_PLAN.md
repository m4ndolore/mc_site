# Cloudflare Blue/Green Deployment Plan (Webhook Service)

**Updated:** October 31, 2025  
**Scope:** `webhook-service` on Google Cloud Run using Cloudflare Zero Trust/Tunnels

---

## 1. Goal

Deploy a new webhook revision (`green`) alongside the live service (`blue`) and steer traffic via Cloudflare. Switching back is instant if issues appear.

---

## 2. Service Layout

| Role  | Cloud Run Service          | Notes                                                  |
|-------|----------------------------|--------------------------------------------------------|
| Blue  | `webhook-service`          | Current production (keep running)                      |
| Green | `webhook-service-green`    | New revision, same codebase / Dockerfile               |
| Staging | `webhook-service-staging` | Existing staging service (unchanged)                   |

Both production services use the existing Cloudflare tunnel hostname (`api.sigmablox.com`, the URL consumed by the Ghost themes).

---

## 3. Environment & Secrets

1. Create mirror secrets for the green service (or reuse the same secrets if identical):
   ```bash
   gcloud secrets versions add webhook-ghost-api-key --data-file=-
   # Repeat for each secret (AUTHENTIK token, SMTP pass, Airtable API, etc.)
   ```
2. Grant the green service account access:
   ```bash
   gcloud run services describe webhook-service-green --region=us-central1 \
     --format="value(spec.template.spec.serviceAccountName)"
   gcloud secrets add-iam-policy-binding <secret-name> \
     --member="serviceAccount:<service-account>" \
     --role="roles/secretmanager.secretAccessor"
   ```
3. Set environment variables / secret references on both services:
   ```bash
   gcloud run services update webhook-service \
     --region=us-central1 \
     --set-env-vars=AUTHENTIK_BASE_URL=http://34.122.2.37 \
     --set-secrets=AUTHENTIK_ADMIN_TOKEN=webhook-authentik-admin-token:latest

   gcloud run services update webhook-service-green \
     --region=us-central1 \
     --set-env-vars=AUTHENTIK_BASE_URL=http://34.122.2.37 \
     --set-secrets=AUTHENTIK_ADMIN_TOKEN=webhook-authentik-admin-token:latest
   ```

Keep env/secrets **identical** unless you need to test a new value.

---

## 4. Deploy Flow

1. **Build & deploy green**
   ```bash
   cd webhook
   gcloud run deploy webhook-service-green \
     --source . \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --min-instances 1 --max-instances 10 --memory 512Mi --cpu 1
   ```
2. **Smoke test** green directly using the Cloud Run URL (e.g. `https://webhook-service-green-<id>.a.run.app`):
   - `/health`
   - `/debug/authentik` (requires `x-debug-token` header with `AUTHENTIK_WEBHOOK_SERVICE_TOKEN`)
   - Approve a request in staging (`webhook-service-staging`) if needed.
3. **Cloudflare routing**
   - Zero Trust → Access → Tunnels → `sigma-prod`.
   - Ensure there are two Public Hostname entries for `api.sigmablox.com`: one targeting **blue** (`https://webhook-service-...run.app`) and one pointing to **green** (`https://webhook-service-green-...run.app`). Keep only the blue mapping enabled until the cutover.
   - For canary testing, add a [Cloudflare Rule](https://developers.cloudflare.com/rules/) to route requests with header `X-Sigmablox-Canary: true` to the green origin while everyone else continues hitting blue.

---

## 5. Cutover Procedure

1. Enable the rule/hostname for the green service and disable the blue mapping.
2. Monitor:
   ```bash
   gcloud run services logs tail --service=webhook-service-green --region=us-central1
   ```
3. Validate production flows (login, approvals, Authentik sync).
4. Once stable, leave green live for 24h. Keep blue idle (1 instance) for rollback.

Rollback = re-enable the blue mapping and disable green in Cloudflare. No redeploy needed.

---

## 6. Post-Cutover Cleanup

1. When satisfied, scale blue to zero:
   ```bash
   gcloud run services update webhook-service --region=us-central1 --no-min-instances
   ```
2. Future deploys:
   - Alternate service names (`webhook-service` ↔ `webhook-service-green`) each release.
   - Or keep green as the new primary and rebuild blue for the next cycle.

3. Update documentation (CI/CD steps) so the team follows the blue/green schedule.

---

## 7. Additional Considerations

- **Cache:** If Cache Rules exist in Cloudflare, purge cache after switching.
- **Telemetry:** Compare error rates between services. Use Stackdriver filters `resource.labels.service_name=webhook-service-green`.
- **Automation:** Later, wrap these steps in a GitHub Actions workflow to deploy, smoke test, and request Cloudflare cutover approval.

---

## 8. Checklist

1. [ ] Secrets created / updated and shared with both services
2. [ ] `webhook-service-green` deployed and smoke tested
3. [ ] Cloudflare canary rule in place (optional)
4. [ ] Production traffic flipped to green
5. [ ] Logs/metrics healthy for ≥24h
6. [ ] Decision to keep or flip services for next release documented
