# Notes Feature Documentation

**Status:** ✅ Backend Complete, Frontend In Progress
**Last Updated:** November 21, 2025

---

## Overview

The Notes feature allows authenticated users to create, edit, and manage private notes on companies and coaches within the SigmaBlox platform. Notes support markdown formatting, tagging, pinning, and are future-proofed for sharing functionality.

---

## Architecture

### Database: MongoDB

**Collection:** `notes`

**Schema:**
```javascript
{
  _id: ObjectId,                  // Unique identifier

  // User Info
  memberEmail: String,            // Normalized email (lowercase)
  memberId: String,               // Optional: Ghost member ID

  // Target Entity
  targetType: String,             // "company" | "coach"
  targetId: String,               // Company/coach identifier
  companyId: ObjectId,            // If company
  coachId: ObjectId,              // If coach

  // Note Content
  content: String,                // Markdown content (max 10,000 chars)
  title: String,                  // Optional title (max 200 chars)

  // Organization
  tags: [String],                 // User-defined tags (max 10)
  pinned: Boolean,                // Pin to top

  // Sharing (Future)
  sharedWith: [String],           // Array of member emails

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastViewedAt: Date              // Optional tracking
}
```

**Indexes:**
- `{ memberEmail: 1, targetType: 1, createdAt: -1 }` - Get all notes by user/type
- `{ memberEmail: 1, targetId: 1 }` - Get notes for specific entity
- `{ memberEmail: 1, pinned: -1, updatedAt: -1 }` - Pinned notes first
- `{ memberEmail: 1, tags: 1 }` - Filter by tags
- `{ sharedWith: 1, createdAt: -1 }` - Shared notes (sparse, future use)
- Text index on `content` and `title` - Full-text search

---

## API Endpoints

Base URL: `https://api.sigmablox.com` (Production) or local server

### Get Notes

```http
GET /api/member/notes
```

**Authentication:** Required (Ghost member JWT)

**Query Parameters:**
- `targetType` (optional): `"company"` or `"coach"` - Filter by entity type
- `targetId` (optional): Specific entity ID
- `pinned` (optional): `"true"` or `"false"` - Filter pinned notes
- `tags` (optional): Tag name or array of tags

**Response:**
```json
{
  "notes": [
    {
      "noteId": "507f1f77bcf86cd799439011",
      "targetType": "company",
      "targetId": "rec123abc",
      "companyId": "507f1f77bcf86cd799439012",
      "coachId": null,
      "content": "# Great team\n\nImpressed by their autonomous swarm tech...",
      "title": "Initial Impressions",
      "tags": ["promising", "autonomy"],
      "pinned": true,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-21T14:15:00.000Z",
      "lastViewedAt": null,
      "isShared": false,
      "sharedWith": []
    }
  ],
  "total": 1,
  "filters": {
    "targetType": null,
    "targetId": null,
    "pinned": null
  }
}
```

---

### Add/Update/Delete Note

```http
POST /api/member/notes
```

**Authentication:** Required (Ghost member JWT)

**Request Body:**

**Add Note:**
```json
{
  "action": "add",
  "targetType": "company",
  "targetId": "rec123abc",
  "content": "# Great team\n\nImpressed by their approach...",
  "title": "Initial Impressions",
  "tags": ["promising", "autonomy"],
  "pinned": false
}
```

**Update Note:**
```json
{
  "action": "update",
  "noteId": "507f1f77bcf86cd799439011",
  "targetType": "company",
  "targetId": "rec123abc",
  "content": "# Updated impressions\n\nAfter second meeting...",
  "title": "Follow-up Notes",
  "tags": ["promising", "autonomy", "meeting-2"],
  "pinned": true
}
```

**Delete Note:**
```json
{
  "action": "delete",
  "noteId": "507f1f77bcf86cd799439011",
  "targetType": "company",
  "targetId": "rec123abc"
}
```

**Response:**
```json
{
  "success": true,
  "action": "added",  // or "updated" or "deleted"
  "note": {
    "noteId": "507f1f77bcf86cd799439011",
    "targetType": "company",
    "targetId": "rec123abc",
    "content": "...",
    // ... rest of note fields
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, content too long, invalid action)
- `404` - Note not found (update/delete)
- `500` - Server error

---

## Validation Rules

- **Content:**
  - Required for add/update actions
  - Must be non-empty string
  - Maximum length: 10,000 characters
  - Supports markdown syntax

- **Title:**
  - Optional
  - Maximum length: 200 characters

- **Tags:**
  - Optional array of strings
  - Maximum 10 tags per note
  - Automatically lowercased and deduplicated
  - Empty/whitespace tags are filtered out

- **Target Type:**
  - Must be either `"company"` or `"coach"`

- **Target ID:**
  - Required
  - Must be valid company or coach identifier

---

## Frontend Integration

### 1. Company Modal Enhancement

**Location:** `ghost-cloudrun/ghost-data/themes/ease/assets/js/company-modal-shared.js`

**Features:**
- "Notes" tab in company modal
- Display existing notes for the company
- Add/edit note with markdown editor
- Pin/unpin notes
- Tag management
- Delete confirmation

**UI Components:**
- Note list (sorted by pinned, then updated date)
- Markdown editor (e.g., SimpleMDE, marked.js for rendering)
- Tag input with autocomplete
- Pin toggle button
- Delete button with confirmation

### 2. Coach Modal Enhancement

**Location:** `ghost-cloudrun/ghost-data/themes/ease/assets/js/coaches.js`

Same functionality as company modal, but for coaches.

### 3. My Notes Page

**Location:** `ghost-cloudrun/ghost-data/themes/ease/custom-my-notes.hbs` (to be created)

**URL:** `https://www.sigmablox.com/my-notes/`

**Features:**
- List all user notes across all entities
- Filter by:
  - Entity type (company/coach)
  - Tags
  - Pinned status
  - Search (full-text)
- Group by entity or show flat list
- Click note to open entity modal
- Quick edit/delete actions
- Export notes (future)

---

## Implementation Files

### Backend
- ✅ `webhook/lib/notes-utils.js` - Utility functions for validation, formatting
- ✅ `webhook/create-notes-indexes.js` - MongoDB index creation script
- ✅ `webhook/local-server.js` (lines 28-35, 1551-1738) - API endpoints

### Frontend (Pending)
- ⏳ `ghost-cloudrun/ghost-data/themes/ease/assets/js/notes.js` - Notes management logic
- ⏳ `ghost-cloudrun/ghost-data/themes/ease/assets/js/company-modal-shared.js` - Add notes tab
- ⏳ `ghost-cloudrun/ghost-data/themes/ease/assets/js/coaches.js` - Add notes to coach modal
- ⏳ `ghost-cloudrun/ghost-data/themes/ease/custom-my-notes.hbs` - My Notes page template

---

## Setup Instructions

### 1. Database Setup (✅ Complete)

```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
node create-notes-indexes.js
```

**Verify:**
```bash
# Connect to MongoDB and check indexes
use sigmablox-production
db.notes.getIndexes()
```

### 2. Deploy Backend

**Local Development:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
npm start
```

**Production:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
./deploy-to-prod.sh
```

### 3. Frontend Implementation (Next Steps)

See Frontend Implementation section for details on creating UI components.

---

## Future Enhancements

### Phase 2: Sharing
- Share notes with other members
- Collaborative editing
- Comment threads on shared notes
- Permission levels (view/edit)

### Phase 3: Advanced Features
- Rich text editor with WYSIWYG
- Attach files/images to notes
- Version history
- Export notes (PDF, markdown)
- Bulk operations
- Note templates

### Phase 4: Integration
- Link notes to PACAF programs
- AI-powered note summaries
- Reminder/follow-up system
- Integration with external tools (Notion, etc.)

---

## Usage Examples

### JavaScript (Frontend)

```javascript
// Get all notes for a company
async function getCompanyNotes(companyId) {
  const response = await fetch(`${apiBase}/api/member/notes?targetType=company&targetId=${companyId}`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.notes;
}

// Add a new note
async function addNote(targetType, targetId, content, title, tags = []) {
  const response = await fetch(`${apiBase}/api/member/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'add',
      targetType,
      targetId,
      content,
      title,
      tags,
      pinned: false
    })
  });
  return await response.json();
}

// Update existing note
async function updateNote(noteId, updates) {
  const response = await fetch(`${apiBase}/api/member/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'update',
      noteId,
      ...updates
    })
  });
  return await response.json();
}

// Delete note
async function deleteNote(noteId, targetType, targetId) {
  const response = await fetch(`${apiBase}/api/member/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'delete',
      noteId,
      targetType,
      targetId
    })
  });
  return await response.json();
}
```

---

## Security Considerations

- ✅ **Authentication Required:** All endpoints require valid Ghost member session
- ✅ **User Isolation:** Users can only access/modify their own notes
- ✅ **Input Validation:** Content length limits, sanitization
- ✅ **Rate Limiting:** Uses same limiter as favorites endpoints
- ✅ **XSS Prevention:** Markdown content should be sanitized before rendering
- ⏳ **Future:** Encryption for sensitive notes

---

## Testing

### Manual Testing

```bash
# 1. Start local server
cd webhook && npm start

# 2. Get auth cookie from browser (sign in to Ghost)

# 3. Test endpoints with curl
curl -X GET 'http://localhost:3000/api/member/notes' \
  -H 'Cookie: ghost-members-ssr=YOUR_COOKIE'

curl -X POST 'http://localhost:3000/api/member/notes' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: ghost-members-ssr=YOUR_COOKIE' \
  -d '{
    "action": "add",
    "targetType": "company",
    "targetId": "rec123abc",
    "content": "Test note",
    "title": "Test"
  }'
```

### Automated Testing (Future)

Create test suite in `webhook/tests/notes.test.js` covering:
- CRUD operations
- Validation rules
- Error handling
- Authorization checks

---

## Troubleshooting

**Notes not saving:**
- Check MongoDB connection
- Verify authentication cookie
- Check browser console for API errors
- Review webhook service logs

**Notes not appearing:**
- Check targetId matches company/coach ID format
- Verify filter parameters
- Check memberEmail matches logged-in user

**Markdown not rendering:**
- Ensure markdown library loaded (e.g., marked.js)
- Sanitize HTML output to prevent XSS
- Check for syntax errors in markdown

---

## Related Documentation

- [Favorites Feature](_docs/FAVORITES_DESIGN.md) - Similar pattern for reference
- [PACAF Database Schema](_docs/features/PACAF_DATABASE_SCHEMA.md) - MongoDB collections
- [API Authentication](_docs/AUTHENTICATION.md) - Auth middleware

---

**End of Documentation**
