# Ghost Portal Account Page Improvement Options

**Investigation Date:** 2025-11-23
**Portal URL:** `http://localhost:2368/#/portal/account`
**Status:** 🔍 Investigation Complete

---

## Current Situation

The Ghost Portal account page at `#/portal/account` is Ghost's native React-based member portal that provides basic account management functionality. Currently, members can:

- View their email and name
- Manage subscription plans (if using Ghost's native subscriptions)
- Update billing information (Stripe integration)
- Contact support via configured email
- Cancel or continue subscriptions

---

## Ghost Portal Limitations

Ghost's native portal has **limited customization options**:

1. **Account Page Settings:**
   - ✅ Support email address (configurable)
   - ❌ No control over account page layout
   - ❌ No ability to add custom fields or sections
   - ❌ No integration with external systems

2. **Visual Customization:**
   - ✅ Portal button appearance (show/hide, icon, text)
   - ✅ Brand colors and basic styling
   - ❌ Cannot modify internal account page UI
   - ❌ Limited to Ghost's predefined layout

3. **Functional Limitations:**
   - Only works with Ghost's native membership system
   - Cannot integrate with external authentication (OAuth)
   - Cannot display custom user data from Airtable
   - Cannot add platform-specific features

---

## Recommended Improvements

### Option 1: Create Custom Account Page (Recommended)

**Replace Ghost Portal with a custom account page that integrates with SigmaBlox systems.**

#### Benefits:
- ✅ Full control over UI/UX
- ✅ Integration with existing OAuth authentication
- ✅ Display Airtable-powered company data
- ✅ Show user role and permissions
- ✅ Custom features specific to SigmaBlox platform

#### Implementation:
1. Create new custom page template: `custom-account.hbs`
2. Build account UI using existing auth system (`window.SigmaBloxAuth`)
3. Display member information from Ghost + Airtable
4. Add platform-specific features

**Example Features to Add:**
- **Profile Section:**
  - Display name, email, role badge
  - Company affiliation (from Airtable)
  - Member since date
  - Last login

- **Account Actions:**
  - Change password/logout
  - Update profile information
  - Manage email preferences
  - Request role upgrade

- **Platform Access:**
  - Quick links to My Company, Favorites, Notes
  - Recent activity feed
  - Access request status
  - Invitation management

- **Settings:**
  - Email notification preferences
  - Privacy settings
  - Data export (GDPR compliance)
  - Account deletion request

#### Code Structure:
```handlebars
{{!-- custom-account.hbs --}}
<div class="account-page">
  {{#if @member}}
    <div class="account-header">
      <h1>Account Settings</h1>
      <p>Manage your SigmaBlox profile and preferences</p>
    </div>

    <div class="account-sections">
      <!-- Profile Section -->
      <section class="account-section">
        <h2>Profile Information</h2>
        <div id="profile-info"></div>
      </section>

      <!-- Company Section -->
      <section class="account-section">
        <h2>Company Profile</h2>
        <div id="company-info"></div>
      </section>

      <!-- Preferences Section -->
      <section class="account-section">
        <h2>Preferences</h2>
        <div id="user-preferences"></div>
      </section>

      <!-- Activity Section -->
      <section class="account-section">
        <h2>Recent Activity</h2>
        <div id="recent-activity"></div>
      </section>
    </div>
  {{else}}
    <div class="account-auth-required">
      <p>Please sign in to view your account</p>
      <a href="#/portal/signin" class="btn">Sign In</a>
    </div>
  {{/if}}
</div>
```

---

### Option 2: Hybrid Approach

**Keep Ghost Portal for basic account functions, add custom extensions.**

#### Benefits:
- ✅ Leverage Ghost's built-in subscription management
- ✅ Add SigmaBlox-specific features alongside
- ✅ Less development effort
- ⚠️ Split user experience between Ghost UI and custom UI

#### Implementation:
1. Keep Ghost Portal link for subscription management
2. Add separate "Profile" or "Dashboard" page for SigmaBlox features
3. Create navigation that separates concerns:
   - "Account" → Ghost Portal (billing, subscriptions)
   - "Profile" → Custom page (company, preferences, activity)

---

### Option 3: Enhance Ghost Portal with JavaScript

**Inject custom JavaScript to modify Ghost Portal appearance and behavior.**

#### Benefits:
- ✅ Quick implementation
- ✅ No new pages needed
- ❌ Limited by Ghost Portal's React structure
- ❌ Fragile (breaks with Ghost updates)
- ❌ Cannot add complex features

#### Implementation:
```javascript
// Inject custom sections into Ghost Portal
(function() {
  const portalObserver = new MutationObserver((mutations) => {
    const portalFrame = document.querySelector('[data-ghost-portal]');
    if (portalFrame) {
      // Attempt to inject custom content
      // (This is complex and not recommended)
    }
  });

  portalObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
```

**⚠️ Not Recommended:** This approach is fragile and difficult to maintain.

---

## Implementation Priority: Option 1 (Custom Account Page)

### Phase 1: Core Account Page
**Estimated Effort:** 2-3 days

1. **Create page template** (`custom-account.hbs`)
2. **Build account JavaScript** (`assets/js/account-page.js`)
3. **Integrate with auth system** (use existing `SigmaBloxAuth`)
4. **Display basic profile information**
5. **Add logout and password change links**

### Phase 2: SigmaBlox Integration
**Estimated Effort:** 2-3 days

1. **Fetch user's company data** from Airtable (if applicable)
2. **Display favorites and notes** summary
3. **Show access level** and permissions
4. **Add quick links** to platform features
5. **Recent activity feed** (viewed companies, saved notes)

### Phase 3: Advanced Features
**Estimated Effort:** 3-4 days

1. **Email preferences** management
2. **Profile editing** (name, bio, company affiliation)
3. **Data export** functionality (GDPR compliance)
4. **Invitation management** (view sent/received invites)
5. **Role upgrade requests**
6. **Account deletion** workflow

---

## Technical Requirements

### API Endpoints Needed

Create new webhook endpoints:

```javascript
// GET /api/account/profile
// Returns user profile with Ghost + Airtable data
{
  "member": {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "industry",
    "memberSince": "2024-01-15",
    "lastLogin": "2025-11-22"
  },
  "company": {
    "airtableId": "recXXX",
    "name": "Company Name",
    "isOwner": true
  },
  "stats": {
    "favoriteCount": 12,
    "noteCount": 45,
    "companiesViewed": 67
  }
}

// POST /api/account/preferences
// Update user preferences
{
  "emailNotifications": true,
  "weeklyDigest": false,
  "autoplayVideos": true
}

// GET /api/account/activity
// Return recent user activity
{
  "activities": [
    {
      "type": "viewed_company",
      "companyName": "Company A",
      "timestamp": "2025-11-22T14:30:00Z"
    }
  ]
}

// POST /api/account/export
// Request data export
{
  "exportType": "all",
  "format": "json"
}
```

### Frontend Requirements

- **Page template:** `custom-account.hbs`
- **JavaScript module:** `assets/js/account-page.js`
- **CSS styles:** `assets/css/account-page.css`
- **Integration:** Use existing `auth-service.js` and API patterns

---

## Navigation Changes

**Update account link in `custom-nav.js`:**

```javascript
// Current (line 63)
html += '  <a href="#/portal/account" data-portal="account" class="sb-nav-account-link">Account</a>';

// Proposed
html += '  <a href="/account/" class="sb-nav-account-link">Account</a>';
```

**Add account page to navigation config:**

```javascript
// In nav-config.js
{
  name: 'Account',
  href: '/account/',
  description: 'Manage your profile and preferences',
  visibleTo: ['guest', 'industry', 'trusted', 'admin']
}
```

---

## User Experience Improvements

### Current Ghost Portal Flow:
1. Click "Account" → Opens Ghost Portal modal
2. See generic subscription management UI
3. Limited customization and branding
4. No integration with SigmaBlox features

### Proposed Custom Account Flow:
1. Click "Account" → Navigate to `/account/` page
2. See branded SigmaBlox account dashboard
3. View profile, company, preferences, activity
4. Quick access to platform features
5. Personalized experience based on role

---

## Decision Matrix

| Feature | Ghost Portal | Custom Page | Hybrid |
|---------|-------------|-------------|---------|
| Development Effort | ✅ Low | ⚠️ Medium | ⚠️ Medium |
| Customization | ❌ Limited | ✅ Full | ⚠️ Partial |
| Maintenance | ✅ Easy | ⚠️ Moderate | ⚠️ Moderate |
| Airtable Integration | ❌ No | ✅ Yes | ✅ Yes |
| Platform Features | ❌ No | ✅ Yes | ⚠️ Split |
| Branding Control | ❌ Limited | ✅ Full | ⚠️ Partial |
| Future Flexibility | ❌ Locked | ✅ Unlimited | ⚠️ Limited |

**Recommendation:** ✅ **Option 1: Custom Account Page**

---

## Next Steps

1. **Review this document** with stakeholders
2. **Decide on approach** (Option 1 recommended)
3. **Create wireframes** for custom account page
4. **Define API requirements** in detail
5. **Implement Phase 1** (core account page)
6. **Test with users** before adding advanced features
7. **Iterate based on feedback**

---

## References

- [Ghost Portal Documentation](https://ghost.org/help/customize-portal/)
- [Ghost Members API](https://docs.ghost.org/themes/members/)
- [Ghost Portal GitHub](https://github.com/TryGhost/Portal)
- Current Auth System: `assets/js/auth-service.js`
- Current Nav System: `assets/js/custom-nav.js`

---

## Questions to Answer

1. **Do we still need Ghost's subscription management?**
   - If no → Full custom page
   - If yes → Consider hybrid approach

2. **What data do users need to manage?**
   - Profile information?
   - Company affiliation?
   - Email preferences?
   - Access requests?

3. **What are the most important features?**
   - Prioritize based on user needs
   - Phase implementation accordingly

4. **How do we handle authentication?**
   - Continue using OAuth system
   - Keep Ghost membership for authorization
   - Sync data between systems

---

**Status:** Ready for decision and implementation planning
