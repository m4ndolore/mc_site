# REQ-DOCS-003: Contributor Access Workflow for Docs Editors

## Description
Implement approval workflow for users who want to contribute to the knowledge base. Uses VIA groups to manage permissions.

## Target
**Metric**: Approved users can edit knowledge base via VIA group membership

## Reference
- SigmaBlox access request workflow
- VIA group management

## Acceptance Criteria
- [ ] VIA group created: `mc-docs-contributors`
- [ ] Request form on docs site to apply for contributor access
- [ ] Admin can approve/deny requests
- [ ] Approved users added to VIA group
- [ ] Docs platform respects group membership for edit permissions
- [ ] Contributors can create/edit documentation
- [ ] Non-contributors have read-only access

## Implementation

### VIA Group Setup
```bash
# Create contributor group in Authentik
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "$AUTHENTIK_URL/api/v3/core/groups/" \
  -d '{
    "name": "mc-docs-contributors",
    "is_superuser": false
  }'
```

### Access Request Flow
1. User clicks "Become a Contributor" on docs
2. Form collects: reason, area of expertise, sample contribution
3. Request stored in database (reuse SigmaBlox AccessRequest model?)
4. Admin reviews in dashboard
5. Approved → user added to `mc-docs-contributors` group
6. User notified via email

### Docs Platform Permission Check
Platform must check VIA group membership:
```javascript
async function canEditDocs(user) {
  const groups = user.groups || [];
  return groups.includes('mc-docs-contributors');
}
```

## Implementation
- **Status**: PENDING
- **Phase**: 3
- **Priority**: LOW

## Validation
- **Method**: Manual Test
- Submit contributor request
- Approve as admin
- Verify edit access granted

## Dependencies
- REQ-DOCS-001 (SSO must work first)
- REQ-AUTH-001 (VIA must be configured)
