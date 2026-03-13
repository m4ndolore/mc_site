---
name: via-configuration
description: Configure and troubleshoot VIA (Verified Identity Access) - the Authentik-based authentication system for SigmaBlox. Use this skill when working with authentication flows, 2FA setup, policies, stages, or debugging auth issues.
---

# VIA Configuration Skill

VIA (Verified Identity Access) is the authentication system built on Authentik for SigmaBlox and related properties. This skill provides the knowledge needed to configure, debug, and extend VIA.

## Quick Reference

### API Authentication
```bash
# Use the admin token for API calls
TOKEN="$AUTHENTIK_ADMIN_TOKEN"  # From .env.local

# All API calls follow this pattern
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:9000/api/v3/..."
```

### Key Endpoints
| Resource | Endpoint |
|----------|----------|
| Flows | `/api/v3/flows/instances/` |
| Flow Bindings | `/api/v3/flows/bindings/` |
| Stages (all) | `/api/v3/stages/all/` |
| Prompt Stages | `/api/v3/stages/prompt/` |
| Redirect Stages | `/api/v3/stages/redirect/` |
| Policies | `/api/v3/policies/all/` |
| Expression Policies | `/api/v3/policies/expression/` |
| Policy Bindings | `/api/v3/policies/bindings/` |
| Users | `/api/v3/core/users/` |
| Current User | `/api/v3/core/users/me/` |
| Applications | `/api/v3/core/applications/` |
| OAuth Providers | `/api/v3/providers/oauth2/` |
| Brands | `/api/v3/core/brands/` |

---

## Architecture Overview

### Flow Structure
```
Flow
├── Stage Binding (order: 10)
│   ├── Stage (e.g., identification)
│   └── Policy Bindings (evaluate to allow/skip)
├── Stage Binding (order: 20)
│   ├── Stage (e.g., password)
│   └── Policy Bindings
└── Stage Binding (order: 30)
    └── Stage (e.g., user-login)
```

### Key Flows
| Flow Slug | Purpose | Designation |
|-----------|---------|-------------|
| `via-auth` | Main authentication | `authentication` |
| `via-enrollment` | Self-registration | `enrollment` |
| `via-2fa-setup` | 2FA configuration | `authentication` |
| `via-recovery` | Password recovery | `recovery` |

---

## Stage Types Reference

### Common Stage Types
| Component | Purpose | API Endpoint |
|-----------|---------|--------------|
| `ak-stage-identification-form` | Email/username input | `/api/v3/stages/identification/` |
| `ak-stage-password-form` | Password input | `/api/v3/stages/password/` |
| `ak-stage-user-login-form` | Create session | `/api/v3/stages/user_login/` |
| `ak-stage-prompt-form` | Custom prompts/forms | `/api/v3/stages/prompt/` |
| `ak-stage-authenticator-webauthn-form` | Passkey setup | `/api/v3/stages/authenticator/webauthn/` |
| `ak-stage-authenticator-totp-form` | TOTP setup | `/api/v3/stages/authenticator/totp/` |
| `ak-stage-authenticator-validate-form` | MFA validation | `/api/v3/stages/authenticator/validate/` |
| `ak-stage-email-form` | Send email | `/api/v3/stages/email/` |
| `ak-stage-redirect-form` | Redirect to URL/flow | `/api/v3/stages/redirect/` |
| `ak-stage-user-write-form` | Write user attributes | `/api/v3/stages/user_write/` |
| `ak-stage-deny-form` | Deny access | `/api/v3/stages/deny/` |

### Redirect Stage (Critical for External Redirects)
Use this to redirect to external URLs after flow completion:
```bash
# Create redirect stage
curl -X POST "$AUTHENTIK_URL/api/v3/stages/redirect/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-redirect-stage",
    "mode": "static",
    "target_static": "http://localhost:2000/my-endpoint",
    "keep_context": true
  }'
```

**Important:** The `next` URL parameter in flow URLs is validated and rejects external URLs. Use Redirect Stage for controlled external redirects.

---

## Policy Expression Patterns

### Context Variables Available
```python
# In expression policies, these are available:
request          # HTTP request object
request.user     # Current user (if authenticated)
request.context  # Flow context dict
context          # Alias for request.context
plan            # Flow execution plan (when available)
plan.context    # Plan's context dict
ak_is_sso_flow  # Boolean for SSO flows
```

### Setting Pending User (for UserLogin stage)
```python
# The UserLogin stage looks for pending_user in BOTH contexts
# Set both to ensure it works regardless of timing
user = User.objects.get(email=email)
context["pending_user"] = user
if plan:
    plan.context["pending_user"] = user
return True
```

### HTTP Requests in Policies
```python
import requests

# Use full container name on Docker networks
webhook_url = "http://sigmablox-webhook-1:2000/api/my-endpoint"

response = requests.post(webhook_url, json={"data": "value"}, timeout=5)
if response.status_code == 200:
    data = response.json()
    # Use data...
    return True
return False
```

### Common Policy Patterns
```python
# Skip stage if user has passkey
if request.user.has_usable_password():
    return False  # Don't skip
return True  # Skip this stage

# Check for URL parameter
token = request.context.get("flow_params", {}).get("via_token")
if not token:
    return False  # Deny/skip

# Check user group membership
if ak_is_group_member(request.user, name="admins"):
    return True
```

---

## Stage Binding Configuration

### Critical Settings
```json
{
  "target": "<flow-pk>",
  "stage": "<stage-pk>",
  "order": 10,
  "evaluate_on_plan": false,
  "re_evaluate_policies": true,
  "invalid_response_action": "retry"
}
```

| Setting | Purpose |
|---------|---------|
| `evaluate_on_plan: true` | Policy runs during flow planning (before execution) |
| `evaluate_on_plan: false` | Policy runs during stage execution |
| `re_evaluate_policies: true` | Re-run policies on each request to this stage |

**Key Learning:** If a policy sets `context["pending_user"]` for a UserLogin stage, use `evaluate_on_plan: false` so the context is available during execution, not just planning.

---

## Prompt Stage Configuration

### Prompt Field Types
| Type | Purpose |
|------|---------|
| `text` | Single-line text input |
| `text_area` | Multi-line text input |
| `text_read_only` | Read-only text display |
| `email` | Email input with validation |
| `password` | Password input (masked) |
| `number` | Numeric input |
| `checkbox` | Boolean toggle |
| `radio-button-group` | Single selection from options |
| `dropdown` | Dropdown selection |
| `static` | Static text display |
| `hidden` | Hidden field |

### Radio Button Group (Important)
The `placeholder` field must return a **list of strings**, not tuples:
```python
# CORRECT - Simple string list
return ["Passkey (recommended)", "Authenticator App", "Skip for now"]

# WRONG - Tuples cause display issues
return [("passkey", "Passkey (recommended)"), ...]
```

### Expression Placeholders
```python
# Dynamic placeholder based on context
email = request.context.get("prompt_data", {}).get("email", "")
return f"Welcome back, {email}!"
```

---

## Debugging Techniques

### Check Flow Bindings
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/v3/flows/bindings/?target__slug=via-2fa-setup&ordering=order" \
  | jq '.results[] | {order, stage: .stage_obj.name}'
```

### Check Policy Bindings
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/v3/policies/bindings/?target=<stage-binding-pk>" \
  | jq '.results[] | {policy: .policy_obj.name, enabled}'
```

### Test Policy Expression
```bash
# Policies have a test endpoint
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/v3/policies/expression/<pk>/test/" \
  -d '{"user": "<user-pk>", "context": {}}'
```

### View Authentik Logs
```bash
docker logs sigmablox-authentik-server-1 -f 2>&1 | grep -E "(error|warn|action)"
```

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid next URL" | External URL in `next` param | Use Redirect Stage instead |
| Policy sets context but stage doesn't see it | `evaluate_on_plan: true` | Set to `false`, enable `re_evaluate_policies` |
| Container can't reach webhook | Wrong hostname | Use `sigmablox-webhook-1` not `webhook` |
| Token consumed before use | Authentik calls validation twice | Don't clear token immediately, use expiry |
| Radio buttons show tuples | Wrong placeholder format | Return list of strings, not tuples |

---

## Docker Network Communication

### Container Names
When services are on shared Docker networks, use full container names:
```python
# CORRECT
webhook_url = "http://sigmablox-webhook-1:2000/api/endpoint"

# WRONG (service name doesn't work across compose projects)
webhook_url = "http://webhook:2000/api/endpoint"
```

### Finding Container Names
```bash
docker network inspect sigmablox_shared-network | jq '.[0].Containers | to_entries[] | {name: .value.Name, ip: .value.IPv4Address}'
```

---

## Session and Token Handling

### Authentik Session Cookie
- Cookie name: `authentik_session`
- Format: JWT
- Contains: `sid` (session ID), `sub` (hashed user ID), `authenticated` (boolean)
- Does NOT contain email directly

### Getting User from Session
```javascript
// Call Authentik API with session cookie
const response = await fetch(`${AUTHENTIK_URL}/api/v3/core/users/me/`, {
  headers: {
    'Cookie': `authentik_session=${sessionCookie}`,
    'Accept': 'application/json'
  }
});
const userData = await response.json();
const email = userData?.user?.email;
```

### Auto-Login Tokens
For flows that need to auto-login users (e.g., from email links):
1. Generate token in webhook, store hash in database
2. Pass token in flow URL: `/if/flow/via-2fa-setup/?via_token=<token>&email=<email>`
3. Policy validates token via webhook API
4. Policy sets `pending_user` in context
5. UserLogin stage creates session

**Important:** Authentik flow executor calls validation endpoints twice (planning + execution). Handle gracefully by not clearing tokens immediately.

---

## Blueprint Reference

### Location
```
../via/../via/authentik/custom-templates/blueprints/
├── via-flow.yaml           # Main auth flow
├── via-enrollment.yaml     # Registration flow
├── via-recovery.yaml       # Password recovery
├── via-policies.yaml       # Expression policies
├── via-policy-bindings.yaml # Policy-to-stage bindings
└── mc-*.yaml               # Merge Combinator specific
```

### Applying Blueprints
```bash
# Via Authentik container
docker exec sigmablox-authentik-server-1 ak apply_blueprint /blueprints/my-blueprint.yaml

# Or via API
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/v3/managed/blueprints/" \
  -d '{"path": "/blueprints/my-blueprint.yaml"}'
```

---

## Custom Templates

### Location
```
../via/authentik/custom-templates/
├── flows/           # Flow page templates (HTML)
├── email/           # Email templates
├── css/             # Custom CSS
└── pages/           # Static pages
```

### Template Variables
In Django templates (`{{ variable }}`):
- `request.user` - Current user
- `flow` - Current flow object
- `api_base` - API base URL (needs to be passed in context)

---

## Production Considerations

### Environment-Specific URLs
```bash
# Update redirect stage for production
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/v3/stages/redirect/<pk>/" \
  -d '{"target_static": "https://api.sigmablox.com/auth/post-2fa"}'
```

### Security Checklist
- [ ] Admin token rotated and secured
- [ ] HTTPS enforced in production
- [ ] SMTP configured for emails
- [ ] Branding/favicon configured
- [ ] Recovery flow tested
- [ ] Backup/restore procedure documented

---

## NextAuth OAuth Integration

### Critical Configuration for Session Handoff

When integrating Next.js apps with Authentik via NextAuth, the session handoff on callback is critical. The OAuth flow must properly verify state/PKCE tokens stored in cookies.

**Required auth.ts settings:**
```typescript
export const authOptions: NextAuthOptions = {
  providers: [{
    id: "authentik",
    type: "oauth",

    // CRITICAL: Use both state AND pkce checks together
    checks: ["state", "pkce"],

    // Enable id_token validation
    idToken: true,
    issuer: `${AUTHENTIK_URL}/application/o/${APP_SLUG}/`,
    jwks_endpoint: `${AUTHENTIK_URL}/application/o/${APP_SLUG}/jwks/`,

    // Public URL for browser, internal for server-side
    authorization: {
      url: `${AUTHENTIK_PUBLIC_URL}/application/o/authorize/`,
      params: { scope: "openid email profile groups" },
    },
    token: `${AUTHENTIK_URL}/application/o/token/`,
    userinfo: `${AUTHENTIK_URL}/application/o/userinfo/`,
  }],

  // CRITICAL: For localhost HTTP development
  useSecureCookies: false,  // Set true in production

  session: { strategy: "jwt" },
};
```

### Why Both Checks Are Required

| Configuration | Result |
|--------------|--------|
| `checks: ["state"]` | Fails if state cookie not sent |
| `checks: ["pkce"]` | Fails with "state mismatch" (Authentik returns empty state) |
| `checks: []` | Fails with "checks.state argument is missing" |
| `checks: ["state", "pkce"]` | **Works** - proper verification |

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `State cookie was missing` | Cookies not set/sent | Add `useSecureCookies: false` for localhost |
| `state mismatch, expected undefined, got:` | PKCE-only mode | Use `checks: ["state", "pkce"]` |
| `id_token detected in the response` | Missing id_token config | Add `idToken: true`, `issuer`, `jwks_endpoint` |

### Docker Network Setup

The Next.js container must reach Authentik server for token/userinfo calls:

```yaml
# docker-compose.yml
services:
  my-app:
    networks:
      - app-network
      - authentik-network  # Add this!
    environment:
      AUTHENTIK_PUBLIC_URL: http://localhost:9000    # Browser
      AUTHENTIK_URL: http://authentik-server:9000    # Server-side
```

### Full Documentation

See `../via/authentik/docs/nextauth-oauth-integration.md` for complete guide including:
- Debugging techniques
- Cookie behavior details
- Production checklist
- Callback diagnostics

---

## Related Documentation

- `../via/authentik/README.md` - Quick start guide
- `../via/authentik/SETUP.md` - Full setup guide
- `../via/authentik/docs/flows.md` - Flow architecture
- `../via/authentik/docs/nextauth-oauth-integration.md` - NextAuth OAuth guide
- `docs/SITREP-*.md` - Session notes with fixes
- `docs/plans/*.md` - Architecture designs

---

## API Cheat Sheet

```bash
# List all flows
curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v3/flows/instances/" | jq '.results[].slug'

# Get flow by slug
curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v3/flows/instances/?slug=via-auth" | jq '.results[0]'

# Get stage bindings for a flow
curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v3/flows/bindings/?target__slug=via-auth&ordering=order" | jq '.results[] | {order, stage: .stage_obj.name}'

# List all policies
curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v3/policies/all/" | jq '.results[] | {name, pk}'

# Get policy expression
curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v3/policies/expression/<pk>/" | jq '.expression'

# Update policy expression
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$URL/api/v3/policies/expression/<pk>/" \
  -d @policy.json

# Create stage binding
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$URL/api/v3/flows/bindings/" \
  -d '{"target": "<flow-pk>", "stage": "<stage-pk>", "order": 100}'

# Create policy binding
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$URL/api/v3/policies/bindings/" \
  -d '{"target": "<stage-binding-pk>", "policy": "<policy-pk>", "order": 0, "enabled": true}'
```
