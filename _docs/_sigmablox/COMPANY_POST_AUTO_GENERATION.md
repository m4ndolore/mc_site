# Company Post Auto-Generation Design

## Overview

Automatically generate company profile posts (like `/kform-redcom-solution-brief/`) from Airtable data. These posts serve as shareable, professional company briefs that can be offered to companies for their review and editing.

## Data Source

**Airtable Company Data** (via `/getCohorts` endpoint):
- Company Name, Website, Description
- Mission Area, TRL Level
- Founders, Team Size, Funding Stage
- Problem Statement, Solution
- Field Validation, Strategic Advantage
- Logo URL
- Contact Information
- Competitive Landscape
- Primary User, User-Critical Problem

## Post Template Structure

Based on `/kform-redcom-solution-brief/` example:

### 1. **Header**
- **Title**: `{CompanyName} + REDCOM Solution Brief` or `{CompanyName} | {Problem Statement}`
- **Feature Image**: Company logo (from `logoUrl` or `storedLogoId`)
- **Excerpt**: Short problem statement (first 150 chars of description)
- **Tags**: Mission area, TRL level, cohort ID

### 2. **Content Sections** (HTML)

```html
<h2>Problem</h2>
<p>{description.problem section or problemStatement field}</p>

<h2>Solution</h2>
<p>{description.solution section or productName + description}</p>

<h2>Field Validation</h2>
<p>{description.field validation section}</p>

<h2>Technology Maturity (TRL)</h2>
<p>TRL {trlLevel}. {technicalMaturity description}</p>

<h2>Strategic Advantage</h2>
<p>{description.strategic advantage section}</p>

<h2>Go-to-Market Access</h2>
<p>{availableGovContract or currentGovPOC info}</p>

<h2>Dual-Use Potential</h2>
<p>{dual-use description from description field}</p>

<h2>Team</h2>
<p>{founders} - {teamSize} team, {fundingStage} funding</p>

<h2>Competitive Landscape</h2>
<p>{description.competitive landscape section}</p>

<h2>Primary User</h2>
<p>{primaryMissions or warfareDomain info}</p>

<h2>User-Critical Problem</h2>
<p>{user-critical problem from description}</p>
```

### 3. **Metadata**
- **Status**: `draft` (companies can review before publishing)
- **Visibility**: `members` or `public` (configurable)
- **Author**: Admin or company contact
- **Tags**: `[mission-area, cohort-id, company-brief, auto-generated]`

## Implementation Plan

### **Option 1: API Endpoint (Recommended)**

Create `/api/admin/generate-company-post` endpoint:

```javascript
POST /api/admin/generate-company-post
Headers:
  x-member-email: admin@example.com
Body:
  {
    "companyId": "68b40d1d096b512b65fd00b9",  // Airtable record ID
    "cohortId": "25-1",
    "includeConfidential": false  // Filter sensitive data
  }
```

**Flow**:
1. Admin selects company from UI
2. API fetches company data from MongoDB (synced from Airtable)
3. Parses description field to extract sections (Problem, Solution, etc.)
4. Generates HTML content using template
5. Creates draft post via Ghost Admin API
6. Returns Ghost editor URL for review
7. Optionally emails company contact with draft link

### **Option 2: Batch Generation**

Create `/api/admin/generate-all-company-posts` endpoint:
- Generates posts for all cohort companies
- Returns summary of created posts
- Useful for cohort launches

## Parsing Strategy

The `description` field contains structured text with section headers. Parse using:

```javascript
function parseDescription(description) {
  const sections = {};
  const lines = description.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    // Detect section headers (e.g., "Problem", "Solution", etc.)
    if (/^(Problem|Solution|Field Validation|Technology Maturity|Strategic Advantage|Go-to-Market|Dual-Use Potential|Team|Competitive Landscape|Primary User|User-Critical Problem)$/i.test(line.trim())) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}
```

## HTML Template Generator

```javascript
function generateCompanyPostHTML(company) {
  const sections = parseDescription(company.description);

  return `
    <h2>Problem</h2>
    <p>${escapeHtml(sections.Problem || sections['User-Critical Problem'] || 'Not specified')}</p>

    <h2>Solution</h2>
    <p>${escapeHtml(sections.Solution || company.problemStatement || '')}</p>

    <h2>Field Validation</h2>
    <p>${escapeHtml(sections['Field Validation'] || 'Not specified')}</p>

    <h2>Technology Maturity (TRL)</h2>
    <p>TRL ${company.trlLevel}. ${escapeHtml(sections['Technology Maturity'] || company.technicalMaturity || '')}</p>

    <h2>Strategic Advantage</h2>
    <p>${escapeHtml(sections['Strategic Advantage'] || 'Not specified')}</p>

    <h2>Go-to-Market Access</h2>
    <p>${escapeHtml(sections['Go-to-Market'] || company.availableGovContract || company.currentGovPOC || 'Not specified')}</p>

    <h2>Dual-Use Potential</h2>
    <p>${escapeHtml(sections['Dual-Use Potential'] || 'Not specified')}</p>

    <h2>Team</h2>
    <p>${escapeHtml(sections.Team || `${company.founders} - ${company.teamSize} team, ${company.fundingStage} funding`)}</p>

    <h2>Competitive Landscape</h2>
    <p>${escapeHtml(sections['Competitive Landscape'] || 'Not specified')}</p>

    <h2>Primary User</h2>
    <p>${escapeHtml(sections['Primary User'] || company.primaryMissions?.join(', ') || company.warfareDomain?.join(', ') || 'Not specified')}</p>
  `.trim();
}
```

## Admin UI

Add button to admin dashboard company list:

```html
<button class="btn-generate-post" data-company-id="{{companyId}}">
  Generate Solution Brief
</button>
```

**Workflow**:
1. Admin clicks "Generate Solution Brief" next to company
2. Modal shows preview of generated content
3. Admin reviews, adjusts settings (visibility, author)
4. Clicks "Create Draft Post"
5. API creates post in Ghost
6. Shows success message with link to Ghost editor
7. Optionally sends email to company contact

## Email Notification (Optional)

Send email to company contact when post is generated:

```
Subject: Your SigmaBlox Solution Brief is Ready for Review

Hi {contact_name},

We've created a draft solution brief for {company_name} on the SigmaBlox platform.

Please review and edit it here:
{ghost_editor_url}

Once you're happy with it, we can publish it to showcase your solution to the SigmaBlox community.

Questions? Reply to this email.

Best,
SigmaBlox Team
```

## File Structure

```
webhook/lib/
├── services/
│   ├── ghost-posts.js (existing)
│   └── company-post-generator.js (new)
├── routes/
│   └── admin-company-posts.js (new)
└── utils/
    └── html-template.js (new)
```

## Implementation Steps

1. **Create company-post-generator.js** service
   - `parseDescription()`
   - `generateCompanyPostHTML()`
   - `createCompanyPost(company, options)`

2. **Create admin-company-posts.js** routes
   - POST `/api/admin/generate-company-post`
   - POST `/api/admin/generate-all-company-posts`
   - Include auth middleware (admin-only)

3. **Update admin dashboard UI**
   - Add "Generate Post" button to company cards
   - Add modal for preview/settings
   - Add success/error notifications

4. **Test with Kform data**
   - Generate post for Kform
   - Compare with existing `/kform-redcom-solution-brief/`
   - Verify formatting, links, images

5. **Optional: Email integration**
   - Use existing SMTP config
   - Send notification to company contact
   - Include Ghost editor link

## Benefits

- **Scalable**: Generate posts for entire cohort at once
- **Consistent**: All posts follow same professional format
- **Editable**: Companies receive drafts they can customize
- **Shareable**: Professional briefs for investors, customers, partners
- **SEO**: Each company gets dedicated, indexed page

## Next Steps

1. Approve this design
2. Implement `company-post-generator.js` service
3. Create admin API endpoints
4. Add UI to admin dashboard
5. Test with real company data
6. Deploy and generate posts for cohort

---

**Questions to Address:**
1. Should posts be `members-only` or `public` by default?
2. Do we want email notifications to companies?
3. Should we batch-generate for whole cohort or one-by-one?
4. What happens if a company already has a post? (skip, update, or create new?)
