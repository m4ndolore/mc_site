# Contributor Access: What Actually Works

## The Original Goal

Allow authenticated users (via Authentik) to submit draft posts without requiring a separate Ghost login.

## What We Thought Would Work (But Doesn't)

### ❌ Magic Links for Staff Users
- **Myth**: Generate magic signin links for Ghost staff (Contributors, Authors, etc.)
- **Reality**: Magic links only work for Ghost **Members** (subscribers/readers)
- **Evidence**: Ghost Admin API `/ghost/api/admin/users/{id}/signin_urls/` doesn't exist
- **Members Only**: `/ghost/api/admin/members/{id}/signin_urls/` works, but only for members

### ❌ Session Creation Without Password
- **Myth**: Create Ghost admin session with just email via Admin API
- **Reality**: `/ghost/api/admin/session/` requires username + password
- **Evidence**: Tested locally - endpoint returns 401 Unauthorized without password
- **Ghost Docs**: Session endpoint explicitly requires password authentication

## What Actually Works: Three Real Options

### Option 1: Ghost Members (Not Staff)
**Flow:**
1. User authenticates with Authentik
2. Create as Ghost **Member** (not staff)
3. Generate member magic link
4. Auto-login via magic link

**Limitations:**
- No access to Ghost admin interface
- Can't create/edit posts in Ghost UI
- Only for content consumption

**Use Case:** Not suitable for contributors

---

### Option 2: Password Storage (Security Risk)
**Flow:**
1. Generate random password for each staff user
2. Store securely in database
3. On Authentik auth, call `/ghost/api/admin/session/` with stored password
4. Set session cookie and redirect

**Limitations:**
- Storing passwords is a security anti-pattern
- Password rotation complexity
- Trust boundary issues

**Use Case:** Not recommended

---

### Option 3: Custom Submission Form ✅ **RECOMMENDED**
**Flow:**
1. User authenticates with Authentik
2. Custom form on SigmaBlox site for draft submission
3. Form submits to webhook service
4. Webhook service creates post via Ghost Admin API
5. Post created as draft, assigned to admin for review

**Benefits:**
- ✅ No Ghost login required
- ✅ No password storage
- ✅ Full control over submission UI/UX
- ✅ Can add custom fields (mission area, tags, etc.)
- ✅ Can implement approval workflow
- ✅ Users never see Ghost admin interface

**Ghost Admin API Endpoints We'll Use:**
- `POST /ghost/api/admin/posts/` - Create draft posts
- `GET /ghost/api/admin/posts/` - List posts for user
- `PUT /ghost/api/admin/posts/{id}/` - Update draft
- `GET /ghost/api/admin/authors/` - Assign author by email

## Implementation Plan: Option 3

### Architecture

```
User (Authenticated via Authentik)
    ↓
Custom Form on SigmaBlox Site
    ↓
Webhook Service API
    ↓
Ghost Admin API
    ↓
Draft Post Created in Ghost
    ↓
Admin Reviews & Publishes via Ghost Admin
```

### Endpoints to Create

**1. Submit Draft Post**
```
POST /api/contributor/posts
Headers:
  - x-member-email: user@example.com
  - Authorization: Bearer {authentik-token}

Body:
{
  "title": "My Post Title",
  "content": "<p>Post content in HTML</p>",
  "excerpt": "Brief summary",
  "tags": ["tag1", "tag2"],
  "feature_image": "https://...",
  "custom_data": {
    "mission_area": "Fires",
    "submitted_by": "user@example.com"
  }
}

Response:
{
  "success": true,
  "post": {
    "id": "post-id",
    "title": "...",
    "status": "draft",
    "url": "https://www.sigmablox.com/ghost/#/editor/post/post-id"
  }
}
```

**2. List My Drafts**
```
GET /api/contributor/posts
Headers:
  - x-member-email: user@example.com

Response:
{
  "posts": [
    {
      "id": "...",
      "title": "...",
      "status": "draft",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**3. Update My Draft**
```
PUT /api/contributor/posts/{id}
Body: (same as create)

Response: (same as create)
```

### UI Components Needed

1. **Contributor Dashboard Page** (`/contribute/`)
   - List of user's draft posts
   - "New Post" button
   - Edit/Delete actions

2. **Post Editor** (`/contribute/new/` and `/contribute/edit/{id}`)
   - Title input
   - Rich text editor (Markdown or HTML)
   - Feature image upload
   - Tag selection
   - Mission area dropdown
   - Preview mode
   - Save draft / Submit for review buttons

3. **Confirmation Messages**
   - Success: "Draft submitted! Admins will review shortly"
   - Error handling with helpful messages

### Database Schema (Optional)

If we want tracking beyond Ghost:

```sql
CREATE TABLE contributor_submissions (
  id UUID PRIMARY KEY,
  contributor_email VARCHAR(255),
  ghost_post_id VARCHAR(255),
  submitted_at TIMESTAMP,
  status VARCHAR(50), -- 'draft', 'pending_review', 'published'
  metadata JSONB
);
```

## Next Steps

1. ✅ Document what doesn't work (this file)
2. ⏭️ Test Ghost Admin API endpoints for post creation
3. ⏭️ Design contributor form UI
4. ⏭️ Implement `/api/contributor/posts` endpoints in webhook service
5. ⏭️ Build frontend forms
6. ⏭️ Test end-to-end flow

## References

- [Ghost Admin API - Posts](https://ghost.org/docs/admin-api/#posts)
- [Ghost Admin API - Authors](https://ghost.org/docs/admin-api/#authors)
- [Ghost Admin API - Authentication](https://ghost.org/docs/admin-api/#authentication)
