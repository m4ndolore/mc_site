# Authentik ICAM Integration Architecture
**SigmaBlox Defense Tech Platform**

## Executive Summary

This document outlines the architecture for integrating Authentik (enterprise ICAM solution) with the SigmaBlox platform, replacing Ghost's built-in email-based authentication with OAuth2/OIDC single sign-on.

**Key Challenge**: Ghost CMS does not support OAuth2 natively, requiring a custom middleware bridge.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SigmaBlox Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     OAuth2/OIDC      ┌──────────────┐           │
│  │  User    │────────────────────>│   Authentik   │           │
│  │ Browser  │<────────────────────│  Identity     │           │
│  └──────────┘    JWT + Groups      │  Provider     │           │
│       │                             └──────────────┘           │
│       │                                     │                   │
│       │                                     │ Groups Claims     │
│       │ Ghost Session                       │ (OIDC)           │
│       │                                     ↓                   │
│       ↓                             ┌──────────────┐           │
│  ┌──────────┐                       │ Authentik    │           │
│  │  Ghost   │<─────────────────────│ Sync Service │           │
│  │   CMS    │   Create/Update       └──────────────┘           │
│  │ (Members)│   Ghost Members              │                   │
│  └──────────┘                              │ Role Sync         │
│       │                                    ↓                   │
│       │                            ┌──────────────┐           │
│       │ Content Access             │  MongoDB     │           │
│       │                            │  (Roles)     │           │
│       │                            └──────────────┘           │
│       │                                                        │
│       ↓                                                        │
│  ┌──────────┐     SAML/OAuth2      ┌──────────────┐          │
│  │Discourse │────────────────────>│   Authentik   │          │
│  │  Forum   │<────────────────────│   (SSO)       │          │
│  └──────────┘                      └──────────────┘          │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. **User Login Flow (OAuth2/OIDC)**

```
1. User clicks "Log In" → Redirected to Authentik
2. User authenticates (password + MFA if enabled)
3. Authentik issues JWT token with claims:
   - email
   - name
   - groups: ["admin", "trusted", "guest", "restricted"]
4. Redirect back to Ghost with authorization code
5. Authentik Middleware exchanges code for access token
6. Middleware creates Ghost member session
7. User accesses Ghost content with hybrid session
```

### 2. **Session Management**

**Dual-Token Strategy** (for backward compatibility):
- **Authentik JWT**: Stored in HTTP-only cookie `authentik-session`
- **Ghost Member Cookie**: Created by Ghost for existing member features (`ghost-members-ssr`)

**Session Validation**:
```javascript
async function validateSession(req) {
  // 1. Check Authentik JWT first (primary)
  const authentikToken = req.cookies['authentik-session'];
  if (authentikToken) {
    const decoded = verifyAuthentikJWT(authentikToken);
    if (decoded) {
      // Ensure Ghost member exists
      await syncMemberToGhost(decoded);
      return { user: decoded, source: 'authentik' };
    }
  }

  // 2. Fall back to Ghost member session (legacy)
  const ghostSession = req.cookies['ghost-members-ssr'];
  if (ghostSession) {
    const member = await verifyGhostMember(ghostSession);
    if (member) {
      return { user: member, source: 'ghost-legacy' };
    }
  }

  return null; // Not authenticated
}
```

---

## Role Mapping Strategy

### Authentik Groups → Ghost Labels → Frontend Roles

| Authentik Group | Ghost Member Label | Frontend Role | Access Level |
|-----------------|-------------------|---------------|--------------|
| `sigmablox-admins` | `admin` | Admin (Level 4) | Full access |
| `sigmablox-trusted` | `trusted` | Trusted (Level 3) | View all, contact info |
| `sigmablox-guests` | `guest` | Guest (Level 2) | View only, no contact |
| `sigmablox-restricted` | `restricted` | Restricted User (Level 1) | List view only |

### Groups Claims Configuration

**Authentik Scope Mapping** (`groups`):
```python
# Property Mapping Expression (Authentik)
return {
    "groups": [g.name for g in request.user.ak_groups.all()]
}
```

**JWT Token Example**:
```json
{
  "sub": "user@company.com",
  "email": "user@company.com",
  "name": "Jane Doe",
  "groups": ["sigmablox-trusted", "sigmablox-industry"],
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Role Sync Service

**Bidirectional Sync**:
- **Authentik → Ghost**: Every 5 minutes + webhook-triggered
- **Ghost → MongoDB**: Real-time on member update
- **Audit Log**: All role changes tracked in MongoDB

```javascript
// Pseudo-code for role sync
async function syncRoleFromAuthentikToGhost(user) {
  // 1. Get highest role from Authentik groups
  const authentikRoles = user.groups.filter(g => g.startsWith('sigmablox-'));
  const highestRole = determineHighestRole(authentikRoles);

  // 2. Update Ghost member labels
  await ghostAdminAPI.updateMember(user.email, {
    labels: [highestRole, ...user.groups]
  });

  // 3. Update MongoDB role cache
  await db.collection('user_roles').updateOne(
    { email: user.email },
    { $set: { role: highestRole, updatedAt: new Date() } },
    { upsert: true }
  );

  // 4. Log change
  await db.collection('role_audit_log').insertOne({
    email: user.email,
    previousRole: currentRole,
    newRole: highestRole,
    source: 'authentik-sync',
    timestamp: new Date()
  });
}
```

---

## Technical Implementation

### 1. **Authentik Middleware (`authentik-middleware.js`)**

**Responsibilities**:
- OAuth2/OIDC authentication via passport-openidconnect
- JWT validation and refresh
- Session creation and management
- User sync to Ghost Members API

**Key Functions**:
```javascript
class AuthentikMiddleware {
  // Initialize Passport OIDC strategy
  initializePassport()

  // Middleware: Require authentication
  requireAuth()

  // Middleware: Require minimum role level
  requireRole(minimumRole)

  // Verify and decode Authentik JWT
  verifyAuthentikJWT(token)

  // Sync user from Authentik to Ghost
  syncUserToGhost(authentikUser)

  // Handle OAuth2 callback
  handleCallback(req, res)
}
```

### 2. **Authentik Sync Service (`authentik-sync-service.js`)**

**Daemon Service** (runs independently):
- Polls Authentik API for user/group changes
- Listens for Authentik webhooks
- Syncs users and roles to Ghost + MongoDB
- Handles group membership updates

**Architecture**:
```javascript
class AuthentikSyncService {
  // Start sync daemon
  async start() {
    // Periodic sync every 5 minutes
    setInterval(() => this.syncAll(), 5 * 60 * 1000);

    // Webhook listener on port 3001
    this.startWebhookListener();
  }

  // Sync all users from Authentik
  async syncAll()

  // Sync single user
  async syncUser(authentikUserId)

  // Handle webhook event
  async handleWebhook(event)
}
```

### 3. **Frontend Updates (`auth-service.js`)**

**OAuth Flow**:
```javascript
// Redirect to Authentik login
function loginWithAuthentik() {
  window.location.href = '/auth/authentik/login';
}

// Check current session
async function checkAuth() {
  const response = await fetch('/api/auth/session');
  if (response.ok) {
    const { user, source } = await response.json();
    return user;
  }
  return null;
}

// Logout (clear both sessions)
async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
}
```

---

## Discourse Integration

**Two Options**:

### Option A: Authentik → Discourse (Direct SAML)
```
User → Authentik (SAML IdP) → Discourse
```

### Option B: Authentik → Ghost → Discourse (Current DoG Flow)
```
User → Authentik → Ghost → DoG (SSO Bridge) → Discourse
```

**Recommendation**: Option B maintains current DoG setup, requires minimal changes.

---

## Migration Plan

### Phase 1: Setup (Week 1)
1. Deploy Authentik to GCP (Docker/Cloud Run)
2. Configure OAuth2 provider in Authentik
3. Create user groups: admin, trusted, guest, restricted
4. Test OAuth flow in development

### Phase 2: Development (Week 2-3)
1. Build `authentik-middleware.js`
2. Build `authentik-sync-service.js`
3. Update `auth-service.js` frontend
4. Update all role checks in templates
5. Test end-to-end authentication

### Phase 3: User Migration (Week 4)
1. Export Ghost members list
2. Bulk create users in Authentik
3. Send onboarding emails with password reset links
4. Assign users to groups based on current labels

### Phase 4: Deployment (Week 5)
1. Deploy to staging environment
2. User acceptance testing
3. Deploy to production with rollback plan
4. Monitor authentication metrics

### Migration Script Approach

**Bulk User Creation**:
```javascript
async function migrateUsersToAuthentik() {
  // 1. Fetch all Ghost members
  const members = await ghostAdminAPI.getMembers();

  // 2. For each member, create Authentik user
  for (const member of members) {
    const authentikUser = {
      email: member.email,
      name: member.name,
      username: member.email.split('@')[0],
      is_active: true,
      groups: mapGhostLabelsToGroups(member.labels)
    };

    await authentikAPI.createUser(authentikUser);

    // 3. Send password reset email
    await authentikAPI.sendPasswordResetEmail(member.email);
  }

  console.log(`Migrated ${members.length} users to Authentik`);
}

function mapGhostLabelsToGroups(labels) {
  // Map current Ghost labels to Authentik groups
  const roleMap = {
    'admin': 'sigmablox-admins',
    'trusted': 'sigmablox-trusted',
    'guest': 'sigmablox-guests',
    'restricted': 'sigmablox-restricted'
  };

  return labels.map(l => roleMap[l]).filter(Boolean);
}
```

---

## Security Considerations

### 1. **Token Storage**
- Store Authentik JWT in HTTP-only, Secure, SameSite=Strict cookies
- Never expose tokens to JavaScript (XSS protection)

### 2. **Token Validation**
- Verify JWT signature using Authentik's public key (JWKS endpoint)
- Check token expiration (exp claim)
- Validate issuer (iss claim) matches Authentik URL

### 3. **Session Timeout**
- Authentik access token: 15 minutes (short-lived)
- Authentik refresh token: 7 days
- Ghost member session: 30 days (for backward compatibility)

### 4. **HTTPS Only**
- All authentication endpoints require HTTPS
- No token transmission over HTTP

### 5. **CORS Configuration**
- Whitelist only production domains
- Restrict cookie access to same-site

---

## Rollback Strategy

### Emergency Rollback (< 5 minutes)
1. Switch load balancer to bypass Authentik middleware
2. Revert to Ghost email-based authentication
3. Users can request magic links as before

### Graceful Rollback (< 1 hour)
1. Disable Authentik sync service
2. Redeploy previous authentication middleware
3. Clear Authentik cookies on client-side
4. Send user communication about temporary change

---

## Monitoring & Metrics

**Authentication Metrics**:
- Login success rate
- Login failure reasons (invalid credentials, expired tokens)
- Average authentication time
- Session duration
- Role sync latency

**Alerting Thresholds**:
- Login failure rate > 5% → Alert
- Role sync latency > 10 seconds → Warning
- Authentik API unreachable > 1 minute → Critical

---

## Open Questions

1. **Authentik Hosting**: Cloud Run (serverless) vs VM (Docker)?
2. **Session Duration**: Should we match Ghost's 30-day sessions or use shorter windows?
3. **MFA Requirement**: Enforce for all users or only admins?
4. **User Onboarding**: Force password change on first Authentik login?
5. **Group Naming**: Use `sigmablox-*` prefix or plain names?

---

## Next Steps

- [ ] Get approval on architecture
- [ ] Provision Authentik instance (staging)
- [ ] Begin Agent 2 development (OAuth middleware)
- [ ] Test OAuth flow with test user
- [ ] Document API endpoints for frontend team

---

**Document Version**: 1.0
**Last Updated**: {{ current_date }}
**Author**: Claude (Orchestrator Agent)
**Status**: Draft for Review
