# Favorites & Recommendations Feature Design

**Status**: In Progress
**Priority**: High Value
**Timeline**: 4-6 hours

---

## Overview

Build a member-facing feature that allows users to save favorite companies and receive personalized recommendations based on their interests.

## User Stories

1. **As a member**, I want to save companies I'm interested in so I can easily find them later
2. **As a member**, I want to see recommendations for similar companies based on my favorites
3. **As a member**, I want to view all my saved favorites in one place
4. **As a member**, I want to remove companies from my favorites

---

## Technical Architecture

### Database Schema

**Collection**: `favorites`

```javascript
{
  _id: ObjectId,
  memberEmail: "user@example.com",  // Indexed
  companyId: "rec123abc",            // Airtable record ID
  companyName: "Acme Defense",       // Cached for quick display
  savedAt: ISODate("2025-11-04T..."),
  // Cached company data for faster rendering
  companyData: {
    logo: "https://...",
    missionAreas: ["Fires", "C2"],
    tags: ["AI", "Autonomy"],
    trl: 7
  }
}
```

**Indexes**:
- `{ memberEmail: 1, companyId: 1 }` - Unique compound index
- `{ memberEmail: 1, savedAt: -1 }` - For listing user's favorites
- `{ companyId: 1 }` - For analytics (most favorited companies)

---

## API Endpoints

### POST `/api/member/favorites`
Add a company to favorites

**Request**:
```json
{
  "companyId": "rec123abc",
  "companyName": "Acme Defense",
  "companyData": {
    "logo": "https://...",
    "missionAreas": ["Fires"],
    "tags": ["AI"],
    "trl": 7
  }
}
```

**Response**:
```json
{
  "success": true,
  "favoriteId": "673abc...",
  "message": "Company added to favorites"
}
```

**Rate Limit**: 100 requests per 15 minutes per user
**Authentication**: Requires valid member session (x-member-email header)

---

### DELETE `/api/member/favorites/:companyId`
Remove a company from favorites

**Response**:
```json
{
  "success": true,
  "message": "Company removed from favorites"
}
```

---

### GET `/api/member/favorites`
List all favorited companies for the current member

**Response**:
```json
{
  "favorites": [
    {
      "_id": "673abc...",
      "companyId": "rec123",
      "companyName": "Acme Defense",
      "savedAt": "2025-11-04T...",
      "companyData": { ... }
    }
  ],
  "count": 5
}
```

---

### GET `/api/member/recommendations`
Get personalized company recommendations

**Query Parameters**:
- `limit` (optional, default: 10): Number of recommendations

**Algorithm**:
1. Get member's favorite companies
2. Extract mission areas and tags from favorites
3. Score all companies based on:
   - Mission area overlap (weight: 0.4)
   - Tag similarity (weight: 0.4)
   - TRL proximity (weight: 0.2)
4. Exclude companies already in favorites
5. Return top N scored companies

**Response**:
```json
{
  "recommendations": [
    {
      "companyId": "rec456",
      "companyName": "Beta Solutions",
      "score": 0.85,
      "matchReason": "Similar mission areas: Fires, C2",
      "companyData": { ... }
    }
  ],
  "basedOn": ["Acme Defense", "..."]
}
```

---

## Frontend Implementation

### 1. Favorite Button Component

Add to all company tiles and modals:

```javascript
// In cohort-dashboard.js
function renderFavoriteButton(companyId, isFavorited) {
    return `
        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}"
                data-company-id="${companyId}"
                aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
            <svg class="heart-icon">
                ${isFavorited ? '❤️' : '🤍'}
            </svg>
        </button>
    `;
}
```

**Styling**:
- Unfavorited: Outline heart, hover effect
- Favorited: Filled red heart (#FF1A75)
- Smooth animation on toggle

---

### 2. Favorites Page (`/favorites`)

**Template**: `custom-favorites.hbs`

**Layout**:
```
┌─────────────────────────────────────┐
│   My Favorites (5)                  │
├─────────────────────────────────────┤
│  [Company Grid - saved companies]   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Recommendations for You (10)  │ │
│  ├───────────────────────────────┤ │
│  │  [Recommendation Rail]         │ │
│  │  - Similar companies           │ │
│  │  - Match scores shown          │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Features**:
- Empty state: "No favorites yet. Explore companies to get started"
- Loading states during API calls
- Optimistic UI updates (immediate feedback)
- Error handling with user-friendly messages

---

### 3. JavaScript Module (`favorites.js`)

```javascript
class FavoritesManager {
    constructor() {
        this.favorites = new Set();
        this.apiBase = SigmaBloxAuth.getApiBase();
    }

    async loadFavorites() {
        const response = await fetch(`${this.apiBase}/api/member/favorites`, {
            credentials: 'include',
            headers: {
                'x-member-email': memberEmail
            }
        });
        const data = await response.json();
        this.favorites = new Set(data.favorites.map(f => f.companyId));
        return data.favorites;
    }

    async addFavorite(companyId, companyData) {
        // Optimistic update
        this.favorites.add(companyId);
        this.updateUI(companyId, true);

        try {
            await fetch(`${this.apiBase}/api/member/favorites`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-member-email': memberEmail
                },
                body: JSON.stringify({ companyId, ...companyData })
            });
        } catch (error) {
            // Rollback on error
            this.favorites.delete(companyId);
            this.updateUI(companyId, false);
            throw error;
        }
    }

    async removeFavorite(companyId) {
        // Optimistic update
        this.favorites.delete(companyId);
        this.updateUI(companyId, false);

        try {
            await fetch(`${this.apiBase}/api/member/favorites/${companyId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'x-member-email': memberEmail
                }
            });
        } catch (error) {
            // Rollback on error
            this.favorites.add(companyId);
            this.updateUI(companyId, true);
            throw error;
        }
    }

    isFavorited(companyId) {
        return this.favorites.has(companyId);
    }

    updateUI(companyId, isFavorited) {
        const buttons = document.querySelectorAll(`[data-company-id="${companyId}"]`);
        buttons.forEach(btn => {
            btn.classList.toggle('favorited', isFavorited);
            btn.setAttribute('aria-label',
                isFavorited ? 'Remove from favorites' : 'Add to favorites');
        });
    }
}

// Initialize global instance
window.favoritesManager = new FavoritesManager();
```

---

## Security & Performance

### Security
- **Authentication**: All endpoints require valid member session
- **Authorization**: Users can only access their own favorites
- **Rate Limiting**: 100 requests per 15 minutes per member
- **Input Validation**: Sanitize companyId and companyData
- **XSS Protection**: Escape all user-generated content

### Performance
- **Caching**: Cache company data in favorites document
- **Indexes**: Compound indexes on memberEmail + companyId
- **Batch Loading**: Load all favorites in single request
- **Optimistic UI**: Instant feedback before API confirmation
- **Pagination**: Limit recommendations to 10 by default

---

## Implementation Phases

### Phase 1: Backend API (2 hours)
1. Create MongoDB favorites collection with indexes
2. Implement POST /api/member/favorites
3. Implement DELETE /api/member/favorites/:id
4. Implement GET /api/member/favorites
5. Add rate limiting middleware
6. Write endpoint tests

### Phase 2: Recommendations Engine (1.5 hours)
1. Implement GET /api/member/recommendations
2. Build scoring algorithm
3. Test with sample data
4. Optimize query performance

### Phase 3: Frontend Integration (2 hours)
1. Create favorites.js module
2. Add favorite buttons to company tiles
3. Add favorite buttons to company modals
4. Implement optimistic UI updates
5. Add error handling and loading states

### Phase 4: Favorites Page (1.5 hours)
1. Create custom-favorites.hbs template
2. Implement page layout and styling
3. Add recommendations rail
4. Test responsive design
5. Add empty states

---

## Testing Strategy

### Backend Tests
- [ ] Add favorite (valid company)
- [ ] Add favorite (duplicate - should fail)
- [ ] Remove favorite (existing)
- [ ] Remove favorite (non-existent - should fail)
- [ ] List favorites (empty)
- [ ] List favorites (multiple items)
- [ ] Recommendations (no favorites)
- [ ] Recommendations (with favorites)
- [ ] Rate limiting enforcement
- [ ] Authentication enforcement

### Frontend Tests
- [ ] Favorite button click (add)
- [ ] Favorite button click (remove)
- [ ] Optimistic UI update
- [ ] Error rollback
- [ ] Favorites page load
- [ ] Recommendations render
- [ ] Empty state display
- [ ] Loading state display

---

## Success Metrics

- [ ] Member can save/remove favorites
- [ ] Favorites persist across sessions
- [ ] Recommendations show relevant companies
- [ ] UI updates instantly (< 100ms perceived)
- [ ] API responses < 500ms (p95)
- [ ] Zero data loss on errors
- [ ] Works on mobile and desktop

---

## Future Enhancements

- Email notifications for new companies matching interests
- Share favorites with other members
- Favorite collections/folders
- Export favorites list
- Analytics: Most favorited companies
- Collaborative filtering recommendations
