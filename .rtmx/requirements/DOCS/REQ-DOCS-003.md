# REQ-DOCS-003: Contributor Access Workflow for Docs Editors

## Description
Implement approval workflow for users who want to contribute to the knowledge base. Uses VIA groups to manage permissions.

## Target
**Metric**: Approved users can edit knowledge base via VIA group membership

## Reference
- SigmaBlox access request workflow
- VIA group management
- Outline API for group membership

## Acceptance Criteria
- [x] Request form on mc_site to apply for contributor access
- [ ] VIA group created: `mc-docs-contributors`
- [ ] Outline group created: `mc-docs-contributors`
- [ ] Admin can approve/deny requests
- [ ] Approved users added to VIA group
- [ ] Approved users added to Outline group
- [ ] Docs platform respects group membership for edit permissions
- [ ] Contributors can create/edit documentation
- [ ] Non-contributors have read-only access

## Implementation

### Phase 1: Frontend (COMPLETE)

**Contributor Request Page**: `/contribute.html`
- Split layout: context left, form right
- Auth-gated form (requires VIA login)
- Fields: expertise area, reason, sample contribution
- Posts to `api.sigmablox.com/api/contributor-request`
- Success/error states

**Navigation Updates**:
- Link from `/knowledge` page to `/contribute`
- "Become a Contributor" secondary CTA

### Phase 2: Infrastructure (MANUAL SETUP REQUIRED)

See `REQ-INFRA-002.md` for detailed group setup instructions.

**VIA Group Setup** (Authentik Admin):
```bash
# Via Authentik Admin UI or API
curl -X POST -H "Authorization: Bearer $AUTHENTIK_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "https://via.mergecombinator.com/api/v3/core/groups/" \
  -d '{"name": "mc-docs-contributors", "is_superuser": false}'
```

**Outline Group Setup** (Outline Admin):
```bash
# Via Outline Admin UI or API
curl -X POST "$OUTLINE_URL/api/groups.create" \
  -H "Authorization: Bearer $OUTLINE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "mc-docs-contributors"}'
```

### Phase 3: API Endpoint (PENDING)

**Endpoint**: `POST /api/contributor-request` at api.sigmablox.com

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "expertise": "acquisition|operations|technology|...",
  "reason": "Why I want to contribute...",
  "sample": "Optional writing sample or link",
  "requestType": "docs-contributor",
  "requestedAt": "2026-01-30T00:00:00Z",
  "source": "https://www.mergecombinator.com/contribute"
}
```

**Storage**: Reuse `AccessRequest` model with `requestType: 'docs-contributor'`

### Phase 4: Admin Approval (PENDING)

**Dashboard Location**: Via existing access-requests dashboard
**Approval Action**:
1. Add user to VIA `mc-docs-contributors` group
2. Add user to Outline `mc-docs-contributors` group via Outline API
3. Send notification email

**Outline API Integration**:
```javascript
// Add user to Outline group
const outlineUserId = await findOutlineUserByEmail(email);
await fetch(`${OUTLINE_URL}/api/groups.add_user`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OUTLINE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: CONTRIBUTOR_GROUP_ID,
    userId: outlineUserId
  })
});
```

## Status
- **Status**: PARTIAL
- **Phase**: 3
- **Priority**: LOW

## Validation
- **Method**: Manual Test
1. Navigate to /contribute (unauthenticated) - should show auth required
2. Authenticate via VIA
3. Submit contributor request
4. Admin approves in dashboard
5. Verify user added to VIA group
6. Verify user added to Outline group
7. Verify user can create/edit docs in Outline

## Dependencies
- REQ-DOCS-001 (SSO must work first) - COMPLETE
- REQ-AUTH-001 (VIA must be configured) - COMPLETE
- REQ-INFRA-002 (Group infrastructure) - PENDING

## Technical Notes

### Why Dual Group Sync?
Outline does NOT natively support OIDC group-to-permission mapping. OIDC groups from VIA are not automatically synced to Outline groups. The approval workflow must explicitly call both APIs:
1. Authentik API to add user to VIA group (for identity tracking)
2. Outline API to add user to Outline group (for permission)

### Outline API Reference
- Base URL: https://docs.mergecombinator.com/api
- Auth: Bearer token (API key from Settings → API Keys)
- Docs: https://www.getoutline.com/developers

Key endpoints:
- `POST /groups.create` - Create group
- `POST /groups.add_user` - Add user to group
- `POST /groups.remove_user` - Remove user from group
- `POST /groups.memberships` - List group members

## Sitrep - 2026-01-30

**Session**: claude-2026-01-30
**Status**: PARTIAL

### Completed
- Contributor request page created at /contribute.html
- Auth-gated form with expertise/reason/sample fields
- JavaScript for auth checking and form submission
- Link added from /knowledge page
- Vite config updated to include contribute.html in build
- Build verified passing
- Visual verification via Playwright - page renders correctly

### Remaining
- VIA group mc-docs-contributors (manual setup)
- Outline group mc-docs-contributors (manual setup)
- API endpoint at api.sigmablox.com/api/contributor-request
- Admin approval interface integration
- Outline API integration for group sync

### Blockers
- None blocking current phase

### Next Steps
1. Human to create VIA group via Authentik admin
2. Human to create Outline group via Outline admin
3. Add API endpoint to sigmablox webhook server
4. Wire admin approval to call both VIA and Outline APIs
