# Modal Extraction to Shared Module - Technical Task

## Current State
- Company modal implemented inline in `custom-cohorts.hbs` (lines 3327-3850)
- My Company page opens modal in new tab to cohorts page
- **✅ COMPLETED**: Company owners now get trusted view of their own company

## Goal
Extract modal rendering logic into a shared JavaScript module (`company-modal-shared.js`) that can be used by both cohorts and my-company pages to display the modal inline without navigation.

## Technical Implementation Plan

### Phase 1: Extract Core Functions

Create `/assets/js/company-modal-shared.js` containing:

#### 1. Main Modal Function
```javascript
async function showCompanyModal(airtableId, options = {})
```
**Parameters:**
- `airtableId`: Company ID to display
- `options.companyData`: Optional pre-loaded company data (for My Company page)
- `options.onFieldClick`: Optional callback for edit links

**Dependencies:**
- `window.auth` (SigmaBloxAuth)
- `window.cohortManager` (for cohorts page) OR `options.companyData` (for my-company page)
- Modal HTML in DOM

#### 2. Helper Functions to Extract
- `escapeHtml(value)` - HTML sanitization
- `formatParagraphs(value)` - Text to paragraph HTML
- `buildQuickStats(company)` - Stats cards
- `buildSynopsisSections(company)` - Synopsis parsing
- `formatWebsiteHost(url)` - URL display
- `getLogoUrlForCompany(company, fallback)` - Logo handling
- `fetchCompanyVideoMeta(company)` - Video metadata
- `buildModalVideoSection(videoMetadata, company)` - Video HTML

#### 3. Ownership Check Logic
```javascript
async function checkCompanyOwnership(company)
```
**Returns**: Boolean indicating if current user owns the company
**Logic**:
```javascript
const member = await auth.getMember();
const userEmail = member?.email?.toLowerCase();
const companyEmail = company.contactEmail?.toLowerCase() || company.email?.toLowerCase();
return userEmail && companyEmail && userEmail === companyEmail;
```

### Phase 2: Modal HTML Structure

Ensure modal HTML exists in DOM on both pages:

**Option A**: Include in page templates
```handlebars
<!-- In both custom-cohorts.hbs and custom-my-company.hbs -->
<div id="company-modal" class="modal-overlay" onclick="closeModalOnOverlay(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeCompanyModal()">×</button>
        <div id="modal-content-inner"></div>
    </div>
</div>
```

**Option B**: Inject dynamically
```javascript
function ensureModalExists() {
    if (!document.getElementById('company-modal')) {
        document.body.insertAdjacentHTML('beforeend', MODAL_HTML_TEMPLATE);
    }
}
```

### Phase 3: CSS Extraction

Extract modal CSS from inline styles in cohorts page to:
- `/assets/css/company-modal.css` (new file)

Include on both pages:
```handlebars
<link rel="stylesheet" href="{{asset "css/company-modal.css"}}">
```

### Phase 4: Integration

#### In `custom-cohorts.hbs`:
```html
<!-- Remove inline showCompanyModal function (lines 3327-3850) -->
<!-- Add script tag -->
<script src="{{asset "js/company-modal-shared.js"}}"></script>
```

#### In `custom-my-company.hbs`:
```html
<!-- Add modal HTML -->
<!-- Add CSS -->
<link rel="stylesheet" href="{{asset "css/company-modal.css"}}">
<!-- Add script -->
<script src="{{asset "js/company-modal-shared.js"}}"></script>
```

#### In `my-company.js`:
```javascript
// Update preview button to call shared function
previewModalBtn.addEventListener('click', async () => {
    if (currentCompany && window.showCompanyModal) {
        // Pass company data directly since it's already loaded
        await window.showCompanyModal(currentCompany.airtableId, {
            companyData: currentCompany,
            onFieldClick: (fieldName) => {
                // Switch to appropriate tab and highlight field
                switchToTabForField(fieldName);
                highlightField(fieldName);
            }
        });
    }
});
```

### Phase 5: Inline Editing for Owners and Admins

Enable inline editing directly in the modal for company owners and admins.

#### 5.1: Edit Mode Detection
```javascript
async function canEditCompany(company) {
    const member = await auth.getMember();
    const userEmail = member?.email?.toLowerCase();
    const companyEmail = company.contactEmail?.toLowerCase() || company.email?.toLowerCase();
    const isOwner = userEmail && companyEmail && userEmail === companyEmail;
    const isAdmin = await auth.hasMinimumRole('admin');

    return { canEdit: isOwner || isAdmin, isOwner, isAdmin };
}
```

#### 5.2: Edit Mode UI States

**View Mode (Default)**:
- Read-only display
- "Edit Profile" button in modal header (only for owners/admins)
- Quick edit icons next to each editable field

**Edit Mode (Activated)**:
- Fields become inline editable
- Save/Cancel buttons appear in modal header
- Changes highlight in real-time
- Unsaved changes warning on modal close

#### 5.3: Inline Editing Implementation

```javascript
function renderField(fieldName, value, canEdit) {
    const isEditMode = window.modalEditMode === true;

    if (!canEdit || !isEditMode) {
        // View mode - show with optional edit icon
        return `
            <div class="modal-field">
                <div class="modal-field-label">${getFieldLabel(fieldName)}</div>
                <div class="modal-field-value">${escapeHtml(value)}</div>
                ${canEdit ? `<button class="field-edit-icon" onclick="enableModalEditMode('${fieldName}')">✏️</button>` : ''}
            </div>
        `;
    }

    // Edit mode - show inline editor
    const fieldType = getFieldType(fieldName);

    switch (fieldType) {
        case 'textarea':
            return `
                <div class="modal-field editing">
                    <div class="modal-field-label">${getFieldLabel(fieldName)}</div>
                    <textarea
                        name="${fieldName}"
                        data-original="${escapeHtml(value)}"
                        class="modal-field-input"
                        rows="3"
                    >${escapeHtml(value)}</textarea>
                </div>
            `;
        case 'select':
            const options = getFieldOptions(fieldName);
            return `
                <div class="modal-field editing">
                    <div class="modal-field-label">${getFieldLabel(fieldName)}</div>
                    <select
                        name="${fieldName}"
                        data-original="${escapeHtml(value)}"
                        class="modal-field-input"
                    >
                        ${options.map(opt => `
                            <option value="${opt}" ${opt === value ? 'selected' : ''}>
                                ${opt}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        default:
            return `
                <div class="modal-field editing">
                    <div class="modal-field-label">${getFieldLabel(fieldName)}</div>
                    <input
                        type="text"
                        name="${fieldName}"
                        value="${escapeHtml(value)}"
                        data-original="${escapeHtml(value)}"
                        class="modal-field-input"
                    />
                </div>
            `;
    }
}
```

#### 5.4: Edit Mode Controls

**Modal Header in Edit Mode**:
```javascript
function renderModalHeader(company, editPermissions) {
    const { canEdit, isOwner, isAdmin } = editPermissions;
    const isEditMode = window.modalEditMode === true;

    if (!isEditMode) {
        return `
            <div class="modal-header">
                <!-- Logo, title, etc. -->
                ${canEdit ? `
                    <button class="modal-edit-btn" onclick="enableModalEditMode()">
                        ✏️ Edit Profile
                    </button>
                ` : ''}
                <button class="modal-close" onclick="closeCompanyModal()">×</button>
            </div>
        `;
    }

    return `
        <div class="modal-header editing">
            <!-- Logo, title, etc. -->
            <div class="modal-edit-controls">
                <button class="modal-save-btn" onclick="saveModalChanges('${company.airtableId}')">
                    💾 Save Changes
                </button>
                <button class="modal-cancel-btn" onclick="cancelModalEdit()">
                    Cancel
                </button>
            </div>
            <button class="modal-close" onclick="confirmCloseWithUnsaved()">×</button>
        </div>
    `;
}
```

#### 5.5: Save Functionality

```javascript
async function saveModalChanges(airtableId) {
    const changedFields = getChangedFields();

    if (Object.keys(changedFields).length === 0) {
        alert('No changes to save');
        return;
    }

    // Show saving indicator
    const saveBtn = document.querySelector('.modal-save-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '⏳ Saving...';
    saveBtn.disabled = true;

    try {
        // Determine API endpoint based on context
        const apiBase = window.SigmaBloxAuth?.getApiBase() || '';
        const member = await window.SigmaBloxAuth?.getMember();

        const response = await fetch(`${apiBase}/api/my-company`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-member-email': member.email,
                'x-company-id': airtableId  // For admin edits
            },
            body: JSON.stringify(changedFields)
        });

        if (!response.ok) {
            throw new Error('Failed to save changes');
        }

        // Success - refresh modal with new data
        const updatedCompany = await response.json();
        await showCompanyModal(airtableId, { companyData: updatedCompany, forceRefresh: true });

        // Show success message
        showToast('✅ Changes saved successfully');

    } catch (error) {
        console.error('Save failed:', error);
        alert('Failed to save changes: ' + error.message);
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function getChangedFields() {
    const changed = {};
    document.querySelectorAll('.modal-field-input').forEach(input => {
        const fieldName = input.name;
        const currentValue = input.value;
        const originalValue = input.dataset.original || '';

        if (currentValue !== originalValue) {
            changed[fieldName] = currentValue;
        }
    });
    return changed;
}
```

#### 5.6: Navigation-Based Editing (Alternative/Fallback)

For complex fields or when inline editing isn't suitable:

```javascript
function jumpToEditField(fieldName) {
    // Save which field to focus
    sessionStorage.setItem('editField', fieldName);

    // Navigate to My Company page
    window.location.href = '/my-company/';
}

// In my-company.js
window.addEventListener('DOMContentLoaded', () => {
    const fieldToEdit = sessionStorage.getItem('editField');
    if (fieldToEdit) {
        sessionStorage.removeItem('editField');

        // Switch to appropriate tab
        const tabMap = {
            'missionArea': 'mission-tech',
            'trlLevel': 'mission-tech',
            'contactEmail': 'contact',
            'description': 'overview',
            // ... etc
        };

        const tabId = tabMap[fieldName];
        if (tabId) {
            document.querySelector(`[data-tab="${tabId}"]`)?.click();
            setTimeout(() => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                field?.focus();
                field?.classList.add('highlight-field');
            }, 300);
        }
    }
});
```

### Phase 6: Admin Bulk Edit Capabilities

For admins editing any company:

#### 6.1: Admin Edit Context
```javascript
// When admin opens modal on cohorts page
if (isAdmin && !isOwner) {
    // Show admin notice
    showAdminEditNotice(company);
    // Enable edit mode with admin permissions
    // Log admin edits for audit trail
}
```

#### 6.2: Audit Trail
```javascript
async function saveModalChanges(airtableId) {
    const isAdmin = await auth.hasMinimumRole('admin');

    if (isAdmin) {
        const payload = {
            ...changedFields,
            _adminEdit: true,
            _adminEmail: member.email,
            _editTimestamp: new Date().toISOString()
        };
        // Backend logs admin edits for compliance
    }
}
```

#### 6.3: Extended Permissions for Admins
- Edit any field (including restricted fields)
- Bypass validation rules (with confirmation)
- Bulk operations (future: edit multiple companies)
- Access to admin-only fields (verification status, notes, flags)
```

## Files to Modify

### New Files
1. `/assets/js/company-modal-shared.js` (~500 lines)
2. `/assets/css/company-modal.css` (~300 lines)

### Modified Files
1. `custom-cohorts.hbs` - Remove inline modal code, add script tag
2. `custom-my-company.hbs` - Add modal HTML, CSS link, script tag
3. `my-company.js` - Update preview button to use shared function

## Testing Checklist

### Cohorts Page
- [ ] Modal opens correctly from company cards
- [ ] Quick stats display properly
- [ ] Synopsis sections render
- [ ] Video section works (if video exists)
- [ ] Contact info shows for trusted users only
- [ ] Contact info shows for company owners (even if not trusted)
- [ ] Favorite button works
- [ ] Interest button works
- [ ] Export button works
- [ ] Modal closes on X click
- [ ] Modal closes on overlay click
- [ ] ESC key closes modal

### My Company Page
- [ ] Preview button opens modal inline (no navigation)
- [ ] Modal displays current company data
- [ ] Company owner sees all contact info
- [ ] Edit links appear on fields
- [ ] Clicking edit link closes modal and jumps to field
- [ ] Field highlights after jump
- [ ] Modal reflects latest changes after save

### Both Pages
- [ ] Modal CSS loads correctly
- [ ] Responsive design works on mobile
- [ ] No JavaScript errors
- [ ] Performance is acceptable
- [ ] Ownership check works correctly

## Rollback Plan

If issues arise:
1. Keep `company-modal-shared.js` but restore inline version in cohorts
2. Revert my-company page to open new tab approach
3. Fix issues in shared module
4. Re-deploy shared module when ready

## Estimated Effort

- **Extraction**: 4-6 hours
- **Integration**: 2-3 hours
- **Testing**: 2-3 hours
- **Bug fixes**: 2-4 hours
- **Total**: 10-16 hours

## Priority

**Medium-High** - Improves UX significantly but current new-tab approach works.

Recommend implementing after:
- Core My Company editing workflow is stable
- No other blocking issues

## Notes

- Ensure backward compatibility during rollout
- Consider feature flag for gradual rollout
- Monitor for JavaScript errors after deployment
- Ownership check is CRITICAL - test thoroughly

## Related Issues

- Company owners hidden from own info: ✅ FIXED (custom-cohorts.hbs:3381-3391)
- Modal duplication across pages: Pending this extraction
- Edit workflow friction: Will be resolved by field-specific edit links
