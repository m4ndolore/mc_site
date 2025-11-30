# The Combine - Navigation & Interoperability Guide

## Overview

The Combine is now accessible at `/combine/` and displays all defense tech companies from the SigmaBlox cohorts with upvoting.

## Setup Required in Ghost Admin

### 1. Create the Combine Page

1. Go to Ghost Admin → Pages → New Page
2. **Title:** "The Combine" or "Combine"
3. **URL:** Set to `/combine/` (must match routes.yaml)
4. **Content:** Can be empty - the custom template handles everything
5. **Settings:**
   - Template: `custom-combine` (auto-selected based on routes.yaml)
   - Visibility: Members only
   - Featured: No (this is a utility page, not content)
6. **Publish** the page

### 2. Add to Main Navigation

1. Go to Ghost Admin → Settings → Navigation
2. Add new navigation item:
   - **Label:** "The Combine"
   - **URL:** `/combine/`
3. Position it appropriately (suggested: after "Dashboard" or "Cohorts")
4. **Save** navigation

### 3. Optional: Add to Secondary Navigation (Footer)

1. Go to Ghost Admin → Settings → Navigation → Secondary Navigation
2. Add:
   - **Label:** "Companies"
   - **URL:** `/combine/`

## Recommended Navigation Structure

```
Primary Navigation:
├── Home (/)
├── Dashboard (/dashboard/)
├── The Combine (/combine/) ← NEW
├── Cohorts (/cohorts/)
├── My Interests (/my-interests/)
└── About

Secondary Navigation (Footer):
├── Companies (/combine/) ← NEW
├── Success Stories
├── Resources
└── Contact
```

## Interoperability Points

### From Other Pages to The Combine

**1. Dashboard (/dashboard/)**
- Add a "View All Companies" button that links to `/combine/`
- Add a "Explore The Combine →" CTA card

**2. Cohort Overview (/cohort-overview/)**
- Each cohort card could have a "View in Combine" link
- Filter button: "See all [Mission Area] companies →" links to `/combine/?mission=[area]`

**3. Admin Dashboard (/admin-dashboard/)**
- Company management section: "View in Combine" link
- Quick stats card linking to The Combine

**4. My Interests (/my-interests/)**
- Recommendations section: "Discover more in The Combine →"

**5. Individual Company Posts**
- Breadcrumb: The Combine → [Company Name]
- Related companies section at bottom: "More companies like this →"

### From The Combine to Other Pages

**Current Implementation:**
- Clicking company card → Checks for Ghost post at `/combine/{company-slug}/`
- If post exists → Navigates to post
- If post doesn't exist → Opens modal with company details (fallback)

**Future Enhancements:**
- Add "View Cohort" button in company modal
- Add "Save to My Interests" quick action
- Add "Share Company" functionality

## Company Posts

### URL Structure

Individual company posts should follow this pattern:
- **URL:** `/combine/{company-slug}/`
- **Example:** `/combine/cachai/`

### Required Tags

All company posts should have:
1. `combine` - Primary tag (required for filtering)
2. Mission area tag (`c2`, `fires`, `autonomy`, `plans`)
3. Cohort tag (`2024-q4`, `2025-q1`, etc.)

### Creating Company Posts

See `_docs/company-combine-post-template.md` for:
- Full post template
- Field mapping from company data
- Ghost metadata structure
- Publishing instructions

### Example Post

See `_docs/example-cachai-combine-post.md` for a complete example of a company post with all sections populated.

## Technical Implementation

### Route Configuration

**File:** `ghost-cloudrun/routes.yaml`

```yaml
/combine/:
  template: custom-combine
  data: page.combine
```

This route maps `/combine/` to the `custom-combine.hbs` template.

### Template File

**File:** `ghost-cloudrun/ghost-data/themes/ease/custom-combine.hbs`

Features:
- Fetches companies from `/getCohorts` API
- Client-side filtering (search, mission area, TRL)
- Client-side sorting (recent, name, TRL)
- Upvoting with localStorage (works without login)
- Rocket emoji animation on upvote
- Links to company posts with modal fallback

### Data Flow

```
The Combine Page
    ↓
Fetch: /getCohorts API
    ↓
Extract companies from cohorts
    ↓
Apply filters & sort
    ↓
Render cards
    ↓
Click company → Check if post exists at /combine/{slug}/
    ├─→ Post exists: Navigate to post
    └─→ No post: Open modal with company data
```

## Search Integration

The Combine is integrated with the unified site search (`js/unified-search.js`):
- Companies appear in search results
- Clicking a company in search can navigate to `/combine/` with filters
- Search supports company name, mission area, description

## Filtering & Deep Linking

Users can share filtered views:
- `/combine/?mission=C2` - Show only C2 companies
- `/combine/?trl=7,8,9` - Show only advanced TRL companies
- `/combine/?search=ai` - Search results for "ai"

**Note:** This requires URL parameter support to be added to `custom-combine.hbs` (future enhancement).

## Mobile Considerations

The Combine page is fully responsive:
- Single-column layout on mobile
- Horizontal upvote section on small screens
- Touch-friendly upvote buttons
- Collapsible filters

## Admin Features

**Admin-only features** (when logged in as admin):
- Edit company data directly from card (future)
- Bulk approve/feature companies (future)
- Analytics: Track upvotes and views (future)

## Testing Checklist

- [ ] Page loads at `/combine/`
- [ ] Navigation link appears in header
- [ ] Companies load from API
- [ ] Filters work (search, mission, TRL)
- [ ] Sorting works (recent, name, TRL)
- [ ] Upvoting works and persists in localStorage
- [ ] Clicking company navigates to post or opens modal
- [ ] Modal displays company details correctly
- [ ] Mobile responsive design works
- [ ] Admin nav shows admin links if admin
- [ ] Search includes companies from The Combine

## Future Enhancements

1. **URL Parameters** - Deep linking with filters
2. **Company Analytics** - Track views and upvotes in database
3. **Featured Companies** - Pin specific companies to top
4. **Company Badges** - Highlight new, trending, or standout companies
5. **Export** - Download company list as CSV
6. **Embeddable Widget** - Iframe for external sites
7. **RSS Feed** - Subscribe to new company additions
8. **Email Notifications** - Alert users when new companies join

## Troubleshooting

### Companies Not Loading

- Check API endpoint: Should be `http://localhost:2000/getCohorts` (local) or `https://api.sigmablox.com/getCohorts` (prod)
- Verify auth-service.js is loaded
- Check browser console for errors
- Verify cohorts have participants with company data

### Navigation Link Not Appearing

- Ensure page is published in Ghost Admin
- Check Ghost Settings → Navigation
- Clear browser cache
- Verify routes.yaml is correct

### Company Posts Not Found

- Verify post URL matches `/combine/{company-slug}/`
- Check post is published (not draft)
- Verify post has `combine` tag
- Check company data has `combinePostUrl` field OR slug matches company name

### Upvotes Not Persisting

- Check localStorage is enabled in browser
- Verify no browser extensions blocking localStorage
- Check browser console for errors
- Key should be `sigmablox_upvotes` in localStorage

## Support

For issues or questions about The Combine:
1. Check this guide first
2. Review template code in `custom-combine.hbs`
3. Check API responses in browser Network tab
4. Review Ghost Admin settings
