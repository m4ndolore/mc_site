# Contributor Submission System Design

## Overview

Allow authenticated users (via Authentik) to submit draft blog posts without requiring Ghost admin access. Posts are created via Ghost Admin API and remain as drafts for admin review.

## Architecture

```
┌─────────────────┐
│  User Browser   │
│  (Authenticated │
│   via Authentik)│
└────────┬────────┘
         │
         │ POST /api/contributor/posts
         │
    ┌────▼─────────────────┐
    │  Webhook Service     │
    │  - Auth middleware   │
    │  - Validation        │
    │  - Ghost API calls   │
    └────┬─────────────────┘
         │
         │ Ghost Admin API
         │  POST /ghost/api/admin/posts/
         │
    ┌────▼────────┐
    │  Ghost CMS  │
    │  (Draft)    │
    └─────────────┘
         │
         │ Admin reviews
         │
    ┌────▼────────┐
    │  Published  │
    └─────────────┘
```

## API Endpoints

### 1. Submit Draft Post

```
POST /api/contributor/posts
```

**Headers:**
```
x-member-email: user@example.com
Authorization: Bearer {authentik-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My Post Title",
  "content": "<p>Post content in HTML</p>",
  "excerpt": "Brief summary (optional)",
  "tags": ["technology", "defense"],
  "featureImage": "https://example.com/image.jpg (optional)",
  "missionArea": "Fires (optional - custom field)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "post": {
    "id": "ghost-post-id",
    "title": "My Post Title",
    "status": "draft",
    "url": "https://www.sigmablox.com/my-post-title/",
    "ghostEditorUrl": "https://www.sigmablox.com/ghost/#/editor/post/ghost-post-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Title is required",
  "code": "VALIDATION_ERROR"
}
```

### 2. List My Submissions

```
GET /api/contributor/posts
```

**Headers:**
```
x-member-email: user@example.com
```

**Query Parameters:**
- `status` - Filter by status: `draft`, `published`, `all` (default: `all`)
- `limit` - Number of posts (default: 10, max: 50)
- `page` - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "post-id",
      "title": "Post Title",
      "excerpt": "Summary...",
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "url": "https://www.sigmablox.com/post-slug/"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 3. Get Single Submission

```
GET /api/contributor/posts/{id}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post-id",
    "title": "Post Title",
    "content": "<p>Full HTML content...</p>",
    "excerpt": "Summary",
    "tags": ["tag1", "tag2"],
    "featureImage": "https://...",
    "status": "draft",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4. Update Draft

```
PUT /api/contributor/posts/{id}
```

**Request Body:** (same as create)

**Restrictions:**
- Can only update own posts
- Can only update drafts (not published posts)

### 5. Delete Draft

```
DELETE /api/contributor/posts/{id}
```

**Restrictions:**
- Can only delete own posts
- Can only delete drafts (not published posts)

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

## Frontend UI

### Page: `/contribute/`

**Layout:**
```
┌─────────────────────────────────────────┐
│  SigmaBlox Navigation                   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  📝 My Submissions                      │
│                                         │
│  [+ New Post]                           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Post Title 1           [Draft]    │ │
│  │ Summary of the post...            │ │
│  │ Created: 2 days ago               │ │
│  │ [Edit] [Delete]                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Post Title 2        [Published]   │ │
│  │ Summary...                        │ │
│  │ Published: 1 week ago             │ │
│  │ [View]                            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Features:**
- List all user's submissions (drafts + published)
- Filter by status (All / Drafts / Published)
- Search by title
- Sort by date (newest/oldest)
- Pagination

### Page: `/contribute/new/` & `/contribute/edit/{id}/`

**Layout:**
```
┌────────────────────────────────────────┐
│  [← Back to My Submissions]            │
├────────────────────────────────────────┤
│                                        │
│  Title: [_________________________]    │
│                                        │
│  Content:                              │
│  ┌─────────────────────────────────┐  │
│  │ Rich Text Editor                 │  │
│  │ (Markdown or HTML)               │  │
│  │                                  │  │
│  │ [B] [I] [Link] [Image]           │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Feature Image (optional):             │
│  [Upload Image] or [Enter URL]         │
│  [  Image Preview  ]                   │
│                                        │
│  Excerpt (optional):                   │
│  [_________________________________]   │
│                                        │
│  Tags:                                 │
│  [Select tags...▼] [+ Create new]      │
│  • Technology • Defense                │
│                                        │
│  Mission Area (optional):              │
│  [Fires ▼]                             │
│                                        │
│  [Preview] [Save Draft] [Submit]       │
└────────────────────────────────────────┘
```

**Features:**
- Rich text editor (TinyMCE, Quill, or Tiptap)
- Image upload (or URL input)
- Tag selection (from existing Ghost tags)
- Custom fields (mission area, etc.)
- Auto-save draft every 30 seconds
- Preview mode
- Submit for review button

### Preview Mode

```
┌────────────────────────────────────────┐
│  [← Back to Editor]                    │
├────────────────────────────────────────┤
│                                        │
│  📄 Post Preview                       │
│                                        │
│  [Feature Image]                       │
│                                        │
│  Post Title                            │
│  By: Your Name • 5 min read            │
│  Tags: #Technology #Defense            │
│                                        │
│  ─────────────────────────────         │
│                                        │
│  Post content rendered here...         │
│                                        │
└────────────────────────────────────────┘
```

## Implementation Details

### Backend (Webhook Service)

**File Structure:**
```
webhook/
├── routes/
│   └── contributor.js          # New routes for contributor API
├── middleware/
│   └── contributor-auth.js     # Auth + ownership checks
├── services/
│   └── ghost-posts.js          # Ghost API wrapper
└── validators/
    └── post-validator.js       # Input validation
```

**Route Handler Example:**

```javascript
// routes/contributor.js
const express = require('express');
const router = express.Router();
const { authenticateContributor } = require('../middleware/contributor-auth');
const { createPost, listPosts } = require('../services/ghost-posts');
const { validatePost } = require('../validators/post-validator');

router.post('/posts', authenticateContributor, async (req, res) => {
    try {
        // Validate input
        const validation = validatePost(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        // Get user email from auth
        const userEmail = req.memberEmail;

        // Create draft post via Ghost API
        const post = await createPost({
            title: req.body.title,
            html: req.body.content,
            excerpt: req.body.excerpt,
            tags: req.body.tags?.map(name => ({ name })),
            feature_image: req.body.featureImage,
            status: 'draft',
            custom_excerpt: req.body.excerpt,
            // Store metadata in Ghost (if needed)
            meta_description: `Submitted by: ${userEmail}`
        });

        res.json({
            success: true,
            post: {
                id: post.id,
                title: post.title,
                status: post.status,
                url: post.url,
                ghostEditorUrl: `https://www.sigmablox.com/ghost/#/editor/post/${post.id}`,
                createdAt: post.created_at
            }
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create post',
            message: error.message
        });
    }
});

module.exports = router;
```

### Authentication Middleware

```javascript
// middleware/contributor-auth.js
async function authenticateContributor(req, res, next) {
    const memberEmail = req.headers['x-member-email'];

    // 1. Verify member is logged in via Authentik/Ghost
    if (!memberEmail) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // 2. Check if user has contributor permission
    // (Could check labels, tiers, or custom permission system)
    const hasPermission = await checkContributorPermission(memberEmail);
    if (!hasPermission) {
        return res.status(403).json({
            success: false,
            error: 'Contributor access required'
        });
    }

    req.memberEmail = memberEmail;
    next();
}
```

### Input Validation

```javascript
// validators/post-validator.js
function validatePost(data) {
    const errors = [];

    // Required fields
    if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required');
    }
    if (data.title && data.title.length > 255) {
        errors.push('Title must be less than 255 characters');
    }

    if (!data.content || data.content.trim().length === 0) {
        errors.push('Content is required');
    }

    // Optional fields validation
    if (data.excerpt && data.excerpt.length > 500) {
        errors.push('Excerpt must be less than 500 characters');
    }

    if (data.tags && !Array.isArray(data.tags)) {
        errors.push('Tags must be an array');
    }

    if (data.featureImage && !isValidUrl(data.featureImage)) {
        errors.push('Feature image must be a valid URL');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

### Frontend (Ghost Theme)

**Page Template:** `custom-contribute.hbs`

```handlebars
{{!< default}}

<div class="contribute-page">
    <div class="contribute-header">
        <h1>My Submissions</h1>
        <a href="/contribute/new/" class="btn btn-primary">+ New Post</a>
    </div>

    <div id="posts-list">
        <!-- Populated via JavaScript -->
    </div>
</div>

<script src="{{asset "js/contributor-dashboard.js"}}"></script>
```

**JavaScript:** `assets/js/contributor-dashboard.js`

```javascript
(async function() {
    const apiBase = 'http://localhost:2000'; // or production URL

    async function loadPosts() {
        const response = await fetch(`${apiBase}/api/contributor/posts`, {
            headers: {
                'x-member-email': window.ghostMemberEmail
            }
        });

        const data = await response.json();
        renderPosts(data.posts);
    }

    function renderPosts(posts) {
        const container = document.getElementById('posts-list');
        container.innerHTML = posts.map(post => `
            <div class="post-card">
                <h3>${post.title}</h3>
                <p>${post.excerpt || ''}</p>
                <span class="status">${post.status}</span>
                <div class="actions">
                    ${post.status === 'draft' ?
                        `<a href="/contribute/edit/${post.id}/">Edit</a>
                         <button onclick="deletePost('${post.id}')">Delete</button>` :
                        `<a href="${post.url}">View</a>`
                    }
                </div>
            </div>
        `).join('');
    }

    loadPosts();
})();
```

## Security Considerations

1. **Authentication**
   - Verify user is authenticated via Authentik
   - Check `x-member-email` header + Ghost session

2. **Authorization**
   - Only allow contributors to create drafts
   - Prevent publishing directly (admins only)
   - Verify ownership before edit/delete

3. **Input Validation**
   - Sanitize HTML content (prevent XSS)
   - Validate image URLs
   - Limit post length
   - Rate limiting (max 10 posts/day per user)

4. **Content Security**
   - All submissions start as drafts
   - Admin must review before publishing
   - Audit log of submissions

## Deployment Steps

1. ✅ Remove speculative docs
2. ✅ Document actual Ghost API
3. ✅ Design API endpoints
4. ⏭️ Implement webhook service routes
5. ⏭️ Add authentication middleware
6. ⏭️ Create frontend pages
7. ⏭️ Test end-to-end flow
8. ⏭️ Deploy to staging
9. ⏭️ User acceptance testing
10. ⏭️ Deploy to production

## Testing Plan

### Unit Tests
- Input validation
- Ghost API wrapper
- Authentication middleware

### Integration Tests
- Create draft post flow
- Update draft flow
- List posts with filters
- Delete draft flow

### E2E Tests
1. User logs in via Authentik
2. Navigate to `/contribute/`
3. Click "New Post"
4. Fill form and submit
5. Verify draft created in Ghost
6. Admin reviews in Ghost admin
7. Admin publishes post

## Future Enhancements

1. **Rich Media**
   - Video embeds
   - Image galleries
   - File attachments

2. **Collaboration**
   - Co-authors
   - Comments/feedback from admins
   - Revision history

3. **Workflows**
   - Approval process
   - Scheduled publishing
   - Content calendar

4. **Analytics**
   - Submission stats
   - Review time tracking
   - Popular topics

## Success Metrics

- Time to submit post: < 5 minutes
- Submission success rate: > 95%
- Admin review time: < 24 hours
- User satisfaction: > 4/5 stars
