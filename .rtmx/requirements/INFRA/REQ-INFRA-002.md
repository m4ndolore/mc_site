# REQ-INFRA-002: mc-docs-contributors Group Infrastructure

## Description
Create and configure the VIA group and Outline group required for contributor access control.

## Target
**Metric**: mc-docs-contributors group exists in VIA and Outline, linked via OIDC claims

## Implementation

### 1. VIA Group Setup (Authentik Admin)

Access: https://via.mergecombinator.com/if/admin/

```bash
# Via Authentik Admin UI:
# 1. Navigate to Directory → Groups
# 2. Create Group:
#    - Name: mc-docs-contributors
#    - Is Superuser: No
# 3. Note the group ID (UUID) for API reference

# Or via API:
curl -X POST -H "Authorization: Bearer $AUTHENTIK_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "https://via.mergecombinator.com/api/v3/core/groups/" \
  -d '{
    "name": "mc-docs-contributors",
    "is_superuser": false
  }'
```

### 2. OAuth2 Provider Scope Update

The `outline-docs` OAuth2 provider must include the `groups` scope:

1. Navigate to Applications → Providers → outline-docs
2. Verify scopes include: `openid email profile groups`
3. If missing, add `groups` to the scope list

### 3. Outline Group Setup

Access: Outline homelab at `100.66.200.39:3100` or via https://docs.mergecombinator.com

```bash
# Via Outline Admin UI (as admin user):
# 1. Navigate to Settings → Groups
# 2. Create Group:
#    - Name: mc-docs-contributors
#    - Description: "Knowledge base contributors with edit access"
# 3. Set collection permissions:
#    - Grant "Edit" on public collections
#    - Grant "View" on sensitive/internal collections

# Or via Outline API (requires admin API key):
OUTLINE_API_KEY="your-api-key"
OUTLINE_URL="https://docs.mergecombinator.com"

# Create the group
curl -X POST "$OUTLINE_URL/api/groups.create" \
  -H "Authorization: Bearer $OUTLINE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "mc-docs-contributors"}'
```

### 4. Collection Permission Configuration

After creating the group in Outline:

1. Navigate to each collection requiring contributor access
2. Click Settings → Permissions
3. Add "mc-docs-contributors" group with "Edit" permission
4. Keep default "View" for all other authenticated users

### 5. Sync Mechanism

The approval workflow triggers both:
1. Authentik API: Add user to `mc-docs-contributors` group
2. Outline API: Add user to `mc-docs-contributors` group

This dual-sync ensures:
- VIA identity has correct group claims in tokens
- Outline has correct group membership for permission checks

## Status
- **Status**: PENDING
- **Phase**: 3
- **Priority**: HIGH (blocks REQ-DOCS-003)

## Validation
- User in VIA group has `mc-docs-contributors` in userinfo response
- User in Outline group can create/edit documents
- User NOT in groups has read-only access

## Dependencies
- REQ-AUTH-001 (VIA configured)
- REQ-DOCS-001 (Outline SSO working)

## Notes
Outline does NOT natively sync groups from OIDC claims. The approval workflow must explicitly call both APIs.
