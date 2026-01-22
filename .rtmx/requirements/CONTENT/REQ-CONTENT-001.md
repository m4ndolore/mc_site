# REQ-CONTENT-001: Builder Modals with Restricted Fields

## Description
Update builder modal component to gate private fields (videoUrl, pitchUrl, contact info) behind authentication. Unauthenticated users see placeholder prompting login.

## Target
**Metric**: Private fields (videoUrl, pitchUrl) only visible to authenticated users

## Reference
- SigmaBlox company modal auth gating pattern
- Existing MC_Site `js/builders/modal.js`
- C2UX doctrine: `docs/theme/ux.md`

## Acceptance Criteria
- [ ] Modal checks auth state before rendering private fields
- [ ] Unauthenticated users see "Authenticate to access" for restricted content
- [ ] Authenticated users see full content
- [ ] No private data exposed in HTML/JS source (fetched on demand)
- [ ] C2UX compliant language (not "Login to see more!")

## Implementation

### Current Modal Structure
```javascript
// js/builders/modal.js
function renderModalContent(company) {
  return `
    <h2>${company.name}</h2>
    <p>${company.description}</p>
    <!-- Private fields currently shown to all -->
    <a href="${company.videoUrl}">Demo Video</a>
    <a href="${company.pitchUrl}">Pitch Deck</a>
  `;
}
```

### Updated Structure
```javascript
import { isAuthenticated } from '../auth/via-service.js';

async function renderModalContent(company) {
  const authenticated = await isAuthenticated();

  return `
    <h2>${company.name}</h2>
    <p>${company.description}</p>

    ${authenticated ? `
      <div class="modal__restricted">
        <a href="${company.videoUrl}">Demo Video</a>
        <a href="${company.pitchUrl}">Pitch Deck</a>
      </div>
    ` : `
      <div class="modal__restricted modal__restricted--locked">
        <span class="modal__lock-icon">🔒</span>
        <p>Restricted Access</p>
        <button onclick="login()">Authenticate</button>
      </div>
    `}
  `;
}
```

### Private Data Fetching
For extra security, private fields should be fetched separately:
```javascript
async function fetchPrivateFields(companyId) {
  if (!await isAuthenticated()) return null;

  const response = await fetch(`/api/builders/${companyId}/private`, {
    credentials: 'include'
  });

  if (!response.ok) return null;
  return response.json();
}
```

## Implementation
- **Status**: PENDING
- **Phase**: 2
- **Priority**: HIGH

## Validation
- **Method**: Manual Test + Visual Test
- Open modal while logged out → see restricted message
- Login → modal shows private fields
- Verify no private data in page source

## Dependencies
- REQ-AUTH-002 (auth service needed)
