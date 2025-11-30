# Ghost Admin API: Verified Endpoints for Contributor Flow

## ✅ Confirmed Working Endpoints

Based on Ghost official documentation and testing, these endpoints work for our contributor submission use case.

### Authentication

All requests require JWT authentication:

```javascript
const jwt = require('jsonwebtoken');

const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/'
});

// Use in requests
headers: {
    'Authorization': `Ghost ${token}`,
    'Accept-Version': 'v5.0'
}
```

## Posts API

### 1. Create Draft Post ✅

```
POST /ghost/api/admin/posts/
```

**Request:**
```json
{
  "posts": [{
    "title": "My Post Title",
    "html": "<p>Post content in HTML format</p>",
    "status": "draft",
    "custom_excerpt": "Brief summary",
    "feature_image": "https://example.com/image.jpg",
    "tags": [
      {"name": "tag1"},
      {"name": "tag2"}
    ],
    "meta_title": "SEO title",
    "meta_description": "SEO description"
  }]
}
```

**Response:**
```json
{
  "posts": [{
    "id": "post-id-here",
    "title": "My Post Title",
    "status": "draft",
    "url": "https://www.sigmablox.com/my-post-title/",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    ...
  }]
}
```

### 2. Update Draft Post ✅

```
PUT /ghost/api/admin/posts/{id}/
```

**Request:**
```json
{
  "posts": [{
    "updated_at": "2024-01-01T00:00:00.000Z",  // REQUIRED - prevents conflicts
    "title": "Updated Title",
    "html": "<p>Updated content</p>"
  }]
}
```

**Important**: Must include `updated_at` from previous GET/POST response to prevent conflicts.

### 3. Get Posts (with filters) ✅

```
GET /ghost/api/admin/posts/?filter=status:draft&limit=10
```

**Query Parameters:**
- `filter` - Filter posts (e.g., `status:draft`, `tag:featured`, `author:email@example.com`)
- `limit` - Number of posts (default: 15, max: all)
- `page` - Page number for pagination
- `order` - Sort order (e.g., `created_at DESC`)
- `include` - Include related data (e.g., `authors,tags`)

**Common Filters:**
- `status:draft` - Only drafts
- `status:published` - Only published
- `author:email@example.com` - Posts by specific author
- `tag:technology` - Posts with specific tag

### 4. Get Single Post ✅

```
GET /ghost/api/admin/posts/{id}/
```

### 5. Delete Post ✅

```
DELETE /ghost/api/admin/posts/{id}/
```

**Response:** 204 No Content (success)

## Authors API

### Get Authors ✅

```
GET /ghost/api/admin/authors/?filter=email:user@example.com
```

Useful for assigning posts to specific authors.

## Tags API

### Create Tag ✅

```
POST /ghost/api/admin/tags/
```

**Request:**
```json
{
  "tags": [{
    "name": "New Tag",
    "slug": "new-tag",
    "description": "Tag description"
  }]
}
```

### Get Tags ✅

```
GET /ghost/api/admin/tags/
```

## What DOESN'T Work (Tested)

### ❌ Session Creation Without Password

```
POST /ghost/api/admin/session/
```

- Requires username + password
- NOT suitable for SSO without storing passwords
- NOT recommended for contributor flow

### ❌ Magic Links for Staff Users

```
POST /ghost/api/admin/users/{id}/signin_urls/
```

- Endpoint doesn't exist for staff
- Only works for members: `/ghost/api/admin/members/{id}/signin_urls/`
- Staff must use traditional login

## Testing Instructions

### Local Setup

1. Start local Ghost: `./start-local.sh`
2. Open Ghost Admin: http://localhost:2368/ghost/
3. Go to Settings → Integrations
4. Click "Add custom integration"
5. Name it: "Contributor API Test"
6. Copy the "Admin API Key"

### Test Script

Save this as `test-ghost-api.js`:

```javascript
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const GHOST_ADMIN_API_KEY = 'your-key-here:your-secret-here';
const GHOST_URL = 'http://localhost:2368';

const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/'
});

async function createDraftPost() {
    const response = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
        method: 'POST',
        headers: {
            'Authorization': `Ghost ${token}`,
            'Content-Type': 'application/json',
            'Accept-Version': 'v5.0'
        },
        body: JSON.stringify({
            posts: [{
                title: 'Test Contributor Post',
                html: '<p>This is a test post.</p>',
                status: 'draft'
            }]
        })
    });

    const data = await response.json();
    console.log('Created post:', data.posts[0]);
    return data.posts[0].id;
}

createDraftPost();
```

Run: `node test-ghost-api.js`

## Production Notes

- ✅ All these endpoints work in production Ghost
- ✅ Use environment-specific API keys
- ✅ Rate limits: Be reasonable (Ghost is self-hosted, but still)
- ✅ Always set `status: 'draft'` for user submissions
- ✅ Validate user input before sending to Ghost API

## References

- [Ghost Admin API Documentation](https://ghost.org/docs/admin-api/)
- [Ghost Admin API - Posts](https://ghost.org/docs/admin-api/#posts)
- [Ghost Admin API - Authentication](https://ghost.org/docs/admin-api/#authentication)
