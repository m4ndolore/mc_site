# Notes Feature - Testing Guide

**Created:** November 21, 2025
**Status:** Ready for Testing

---

## Pre-Testing Checklist

✅ **Completed:**
- [x] MongoDB collection created with indexes
- [x] API endpoints added to `webhook/local-server.js`
- [x] Notes utility functions created
- [x] Frontend component built (`notes-shared.js`)
- [x] CSS styling added (`notes.css`)
- [x] Integrated into company modal
- [x] Scripts added to cohorts and my-company pages
- [x] JavaScript syntax validated (no errors)

---

## Testing Environment Setup

### Option 1: Local Development Testing

**1. Start the Webhook Server:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
npm start
```

Server should start on: `http://localhost:3000`

**2. Start Local Ghost Instance:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/ghost-cloudrun
docker-compose up -d
```

Ghost should be accessible at: `http://localhost:2368`

**3. Verify Theme Files:**
The new files should be in:
- `ghost-cloudrun/ghost-data/themes/ease/assets/js/notes-shared.js`
- `ghost-cloudrun/ghost-data/themes/ease/assets/css/notes.css`

### Option 2: Production/Staging Testing

**Deploy Backend to Production:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/webhook
./deploy-to-prod.sh
```

**Deploy Theme to Production:**
```bash
cd /Users/paulgarcia/Dev/sigmablox/ghost-cloudrun
./deploy-theme-to-vm.sh
```

Or use unified deployment:
```bash
cd /Users/paulgarcia/Dev/sigmablox
./deploy.sh production
```

---

## Test Plan

### Test 1: Basic Note Creation ✅

**Steps:**
1. Navigate to cohorts page: `https://www.sigmablox.com/cohorts/`
2. Log in as a member (if not already)
3. Click on any company to open the modal
4. Scroll down to the "My Notes" section
5. Click "Add Note" button

**Expected:**
- Note editor appears
- Title input field visible
- Content textarea visible
- Tag input visible
- Pin checkbox visible
- Save/Cancel buttons visible

**Test Actions:**
6. Type a title: "Test Note"
7. Type content: "This is a test note"
8. Click "Save Note"

**Expected:**
- Success message appears
- Note appears in the list
- Note shows title and content
- Character counter updates as you type

### Test 2: Markdown Rendering ✅

**Create a note with markdown:**
```markdown
# Meeting Notes

**Important:** This is bold text

*This is italic*

- Bullet point 1
- Bullet point 2

Check out [our website](https://sigmablox.com)

Here's some `inline code`
```

**Expected:**
- Header renders larger
- Bold text appears bold
- Italic text appears italic
- Bullets render as list
- Link is clickable
- Code has monospace font and background

### Test 3: Tag Management ✅

**Steps:**
1. Open note editor
2. Type "promising" in tag input
3. Press Enter
4. Type "autonomy" in tag input
5. Press Enter
6. Try to add 11th tag (should fail with message)
7. Click X on a tag to remove it

**Expected:**
- Tags appear as colored badges
- Max 10 tags enforced
- Tags can be removed
- Tags are saved with note

### Test 4: Pin/Unpin Notes ✅

**Steps:**
1. Create a note
2. Check "Pin note" checkbox
3. Save the note
4. Create another unpinned note

**Expected:**
- Pinned note shows "📌 Pinned" badge
- Pinned note appears first in list
- Yellow background for pinned notes

### Test 5: Edit Existing Note ✅

**Steps:**
1. Click "Edit" button on an existing note
2. Modify the content
3. Add/remove tags
4. Toggle pin status
5. Click "Save Note"

**Expected:**
- Editor loads with existing data
- Changes are saved
- Updated timestamp shows
- Note re-renders with new content

### Test 6: Delete Note ✅

**Steps:**
1. Click "Delete" button on a note
2. Confirm deletion in popup

**Expected:**
- Confirmation dialog appears
- Note is removed from list
- No errors in console

### Test 7: Character Limit Validation ✅

**Steps:**
1. Create a new note
2. Paste 10,000+ characters of text
3. Try to save

**Expected:**
- Textarea enforces 10,000 char limit (can't type more)
- Character counter shows current count
- Counter turns red at 90% (9,000 chars)
- If somehow exceeded, save button should validate

### Test 8: Multiple Companies ✅

**Steps:**
1. Open Company A modal
2. Create a note on Company A
3. Close modal
4. Open Company B modal
5. Verify no notes appear (or different notes)
6. Create note on Company B
7. Close modal
8. Reopen Company A modal

**Expected:**
- Each company has its own notes
- Notes persist across modal opens/closes
- No cross-contamination

### Test 9: Authentication Required ✅

**Steps:**
1. Log out (if logged in)
2. Try to access `/api/member/notes` directly via browser

**Expected:**
- 401 Unauthorized or redirect to login
- Notes don't load for unauthenticated users

### Test 10: User Isolation ✅

**Steps:**
1. Log in as User A
2. Create notes on a company
3. Log out
4. Log in as User B
5. View same company

**Expected:**
- User B should NOT see User A's notes
- Each user has private notes

---

## API Testing (Using curl)

### Get Notes for a Company

```bash
# Get your auth cookie from browser dev tools
COOKIE="ghost-members-ssr=YOUR_COOKIE_HERE"

# Test GET endpoint
curl -X GET 'http://localhost:3000/api/member/notes?targetType=company&targetId=rec123abc' \
  -H "Cookie: $COOKIE" \
  -v
```

**Expected Response:**
```json
{
  "notes": [],
  "total": 0,
  "filters": {
    "targetType": "company",
    "targetId": "rec123abc",
    "pinned": null
  }
}
```

### Create a Note

```bash
curl -X POST 'http://localhost:3000/api/member/notes' \
  -H "Cookie: $COOKIE" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "add",
    "targetType": "company",
    "targetId": "rec123abc",
    "content": "Test note from API",
    "title": "API Test",
    "tags": ["test", "api"],
    "pinned": false
  }' \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "action": "added",
  "note": {
    "noteId": "...",
    "targetType": "company",
    "targetId": "rec123abc",
    "content": "Test note from API",
    "title": "API Test",
    "tags": ["test", "api"],
    "pinned": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Update a Note

```bash
curl -X POST 'http://localhost:3000/api/member/notes' \
  -H "Cookie: $COOKIE" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "update",
    "noteId": "NOTE_ID_HERE",
    "targetType": "company",
    "targetId": "rec123abc",
    "content": "Updated content",
    "title": "Updated Title",
    "tags": ["updated"],
    "pinned": true
  }' \
  -v
```

### Delete a Note

```bash
curl -X POST 'http://localhost:3000/api/member/notes' \
  -H "Cookie: $COOKIE" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "delete",
    "noteId": "NOTE_ID_HERE",
    "targetType": "company",
    "targetId": "rec123abc"
  }' \
  -v
```

---

## Browser Console Testing

Open browser console (F12) and run:

```javascript
// Check if NotesManager is loaded
console.log('NotesManager available:', typeof window.NotesManager !== 'undefined');

// Manually initialize notes for testing
if (window.NotesManager) {
  window.NotesManager.init('company', 'rec123abc', '#company-notes-container')
    .then(() => console.log('Notes initialized successfully'))
    .catch(err => console.error('Notes init failed:', err));
}
```

---

## Common Issues & Troubleshooting

### Issue: "Notes not loading"

**Check:**
1. Is user authenticated? (Check for `ghost-members-ssr` cookie)
2. Is webhook server running? (Check `http://localhost:3000` or Cloud Run)
3. Check browser console for errors
4. Verify network tab shows API call to `/api/member/notes`

**Fix:**
- Restart webhook server
- Clear browser cache
- Check MongoDB connection

### Issue: "Cannot save note"

**Check:**
1. Content length (must be < 10,000 chars)
2. Authentication cookie present
3. Network tab for 400/500 errors
4. Backend logs for validation errors

**Fix:**
- Reduce content length
- Re-authenticate
- Check webhook logs: `docker logs` or Cloud Run logs

### Issue: "Notes appear for wrong company"

**Check:**
1. Verify `targetId` in API call
2. Check `company.airtableId` is correct
3. Browser console for initialization errors

**Fix:**
- Clear browser cache
- Verify company data structure

### Issue: "Markdown not rendering"

**Check:**
1. `renderMarkdown()` function loaded
2. CSS styles for markdown elements loaded
3. Content contains valid markdown syntax

**Fix:**
- Check `notes-shared.js` loaded correctly
- Verify `notes.css` is included

---

## Performance Testing

### Test with Many Notes

**Create 20+ notes on a single company:**
- Should load within 2 seconds
- Scroll should be smooth
- No browser lag

### Test with Long Content

**Create note with 9,000+ characters:**
- Character counter should update smoothly
- No input lag
- Save should work correctly

---

## Acceptance Criteria

✅ **Feature is ready when:**
- [ ] All 10 test cases pass
- [ ] Notes persist across browser refreshes
- [ ] Notes are private to each user
- [ ] Markdown renders correctly
- [ ] Character limits enforced
- [ ] Tags work correctly
- [ ] Pin/unpin works
- [ ] Edit/delete works
- [ ] No console errors
- [ ] Mobile responsive (optional: test on mobile)

---

## Next Steps After Testing

**If tests pass:**
1. Deploy to production
2. Monitor for errors in first 24 hours
3. Gather user feedback
4. Consider adding coach modal integration
5. Plan "My Notes" dedicated page

**If tests fail:**
1. Document specific failures
2. Check error logs (browser + backend)
3. Fix identified issues
4. Re-run tests

---

## Test Results Log

Date: _________________
Tester: _________________

| Test # | Test Name | Pass/Fail | Notes |
|--------|-----------|-----------|-------|
| 1 | Basic Note Creation | ⬜ | |
| 2 | Markdown Rendering | ⬜ | |
| 3 | Tag Management | ⬜ | |
| 4 | Pin/Unpin Notes | ⬜ | |
| 5 | Edit Existing Note | ⬜ | |
| 6 | Delete Note | ⬜ | |
| 7 | Character Limit | ⬜ | |
| 8 | Multiple Companies | ⬜ | |
| 9 | Authentication | ⬜ | |
| 10 | User Isolation | ⬜ | |

---

**End of Testing Guide**
