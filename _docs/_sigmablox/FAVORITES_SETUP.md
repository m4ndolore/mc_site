# Favorites Feature - Setup Guide

Quick guide to enable the Favorites & Recommendations feature on your Ghost site.

## Prerequisites

- ✅ Backend API endpoints deployed (webhook service running)
- ✅ MongoDB indexes created
- ✅ Ghost theme files updated with favorites.js

## Setup Steps

### 1. Add favorites.js to Ghost Theme

The `favorites.js` file needs to be loaded on all pages where favorites can be accessed.

**Edit** `ghost-cloudrun/ghost-data/themes/ease/default.hbs`:

Add before the closing `</body>` tag:

```handlebars
{{!-- Favorites & Recommendations --}}
<script src="{{asset "js/favorites.js"}}"></script>
```

### 2. Create /favorites Page in Ghost Admin

1. Navigate to Ghost Admin: `http://localhost:2368/ghost` (or your Ghost URL)
2. Go to **Pages** → **New Page**
3. Configure:
   - **Title**: `Favorites`
   - **URL**: `/favorites`
   - **Template**: Select `custom-favorites` from dropdown
4. Publish the page

### 3. Add to Navigation (Optional)

Add favorites link to site navigation:

1. Go to **Settings** → **Design** → **Site-wide** → **Navigation**
2. Add new item:
   - **Label**: `My Favorites`
   - **URL**: `/favorites`
3. Save

### 4. Test the Feature

#### Test Favorite Button
1. Navigate to a page with company tiles (e.g., cohort dashboard)
2. Click the heart icon on any company card
3. Should see:
   - Heart changes from 🤍 to ❤️
   - Success notification appears
   - Button stays in favorited state

#### Test Favorites Page
1. Navigate to `/favorites`
2. Should see:
   - List of saved companies
   - Recommendations section (if you have 1+ favorites)
   - Empty state if no favorites yet

#### Test Remove Favorite
1. On `/favorites` page, click the ❤️ on any company
2. Should see:
   - Company removed from list
   - Success notification
   - Page updates instantly

#### Test Recommendations
1. Add 2-3 favorites with similar mission areas or tags
2. Check `/favorites` page
3. Should see:
   - "Recommended for You" section
   - Companies with match scores
   - Match reasons explaining why they're recommended

## Troubleshooting

### Favorites Not Loading

**Check Browser Console**:
```javascript
// Should see:
[Favorites] Manager initialized
[Favorites] Loaded X favorites
```

**Common Issues**:
- ✅ Ensure `favorites.js` is loaded before trying to use it
- ✅ Check that `SigmaBloxAuth` is available (auth-service.js loaded)
- ✅ Verify member is signed in (check `x-member-email` header)

### API Errors

**401 Unauthorized**:
- Member not authenticated
- Session expired
- Missing `x-member-email` header

**Fix**: Ensure user is signed into Ghost

**500 Server Error**:
- MongoDB connection issue
- Webhook service down

**Fix**: Check webhook service logs:
```bash
# If running locally
tail -f webhook/logs/webhook.log

# If in Docker
docker logs [container-id]
```

### Favorite Buttons Not Appearing

**Check**:
1. `favorites.js` loaded on the page?
2. Company tiles have `data-favorite-id` attribute?
3. Browser console for errors?

**Fix**: Ensure `cohort-dashboard.js` updated with favorite button markup

### Recommendations Empty

**Requirements for Recommendations**:
- Member must have at least 1 favorite
- Companies in database must have mission areas, tags, or TRL data
- Must have companies that aren't already favorited

**Debug**:
```bash
# Test recommendations endpoint
curl http://localhost:2000/api/member/recommendations \
  -H 'x-member-email: your@email.com' \
  --cookie "ghost-members-ssr=..."
```

## Configuration

### API Endpoints (webhook/local-server.js)

All endpoints require authentication (`x-member-email` header):

- `GET /api/member/favorites` - List favorites
- `POST /api/member/favorites` - Add favorite
- `DELETE /api/member/favorites/:companyId` - Remove favorite
- `GET /api/member/recommendations` - Get recommendations

### Rate Limits

- 200 requests per 15 minutes per member (configured in rate-limit-config.js)

### MongoDB Collections

**favorites** collection schema:
```javascript
{
  _id: ObjectId,
  memberEmail: "user@example.com",
  companyId: "rec123abc",
  companyName: "Acme Defense",
  savedAt: ISODate("2025-11-04T..."),
  companyData: {
    logo: "https://...",
    missionAreas: ["Fires", "C2"],
    tags: ["AI", "Autonomy"],
    trl: 7
  }
}
```

**Indexes**:
- `memberEmail_companyId_unique` - Compound unique index
- `memberEmail_savedAt` - For sorted queries
- `companyId` - For analytics

## Deployment

### Local Development
```bash
# Ensure webhook service running on port 2000
cd webhook
node local-server.js

# Ghost should be on port 2368
# Access favorites at: http://localhost:2368/favorites
```

### Staging/Production

1. Deploy updated webhook service
2. Deploy updated Ghost theme
3. Create `/favorites` page in Ghost admin
4. Test with real user accounts

## Analytics (Future Enhancement)

Track favorite actions:
```javascript
// In favorites.js addFavorite() method
if (window.analytics) {
  analytics.track('Favorite Added', {
    companyId,
    companyName,
    timestamp: new Date()
  });
}
```

## Next Features

- [ ] Email notifications for new companies matching interests
- [ ] Share favorites with other members
- [ ] Favorite collections/folders
- [ ] Export favorites list
- [ ] Analytics dashboard showing most favorited companies

---

**Last Updated**: 2025-11-04
**Status**: Complete - Ready for Testing
