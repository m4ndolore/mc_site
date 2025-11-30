# Tag System Documentation

## Overview

The SigmaBlox tag system provides a unified, consistent way to display and filter companies and users across the platform using visual tags/badges. Tags are automatically generated from company data fields and follow a standardized taxonomy.

## Architecture

### Core Components

1. **Tag Taxonomy** (`assets/js/tag-taxonomy.js`)
   - Centralized configuration for all tag categories
   - Color schemes and visual styling definitions
   - Utility functions for tag generation and rendering

2. **Tag CSS** (`assets/css/tags.css`)
   - Consistent visual styling across all pages
   - Responsive design for mobile/desktop
   - Interactive states (hover, click, selected)
   - Accessibility features

3. **Integration Points**
   - Company modal (company-modal-shared.js)
   - Cohorts page
   - My Company page
   - Search/filtering interfaces

## Tag Categories

### Mission Area (Blue)
- **Purpose**: Primary operational focus
- **Values**: Fires, Plans, C2, Autonomy, Logistics, Intelligence, Communications, Cyber, Other
- **Icon**: Each value has a unique emoji icon
- **Use case**: Quick identification of company focus area

### Warfare Domain (Purple)
- **Purpose**: Operational environment
- **Values**: Air, Land, Sea, Space, Cyber, Multi-Domain
- **Icon**: Domain-specific emoji
- **Use case**: Filter companies by operational domain

### TRL Level (Green)
- **Purpose**: Technology readiness
- **Values**: 1-9 (numeric badges)
- **Display**: "TRL X" format
- **Use case**: Assess technical maturity

### Hardware/Software (Orange)
- **Purpose**: Technology type
- **Values**: Hardware, Software, Both, Service
- **Icon**: Type-specific emoji
- **Use case**: Filter by implementation type

### Funding Stage (Teal)
- **Purpose**: Company funding level
- **Values**: Pre-Seed, Seed, Series A/B/C+, Bootstrapped, Government Funded
- **Icon**: Growth stage emoji
- **Use case**: Filter by funding maturity

### Team Size (Pink)
- **Purpose**: Company size indicator
- **Values**: Solo (1), Small (2-10), Medium (11-50), Large (50+)
- **Icon**: People emoji
- **Use case**: Find companies by team size

### GPC Ready (Indigo)
- **Purpose**: Government Purchase Card readiness
- **Values**: Yes, No, In Progress
- **Icon**: Status emoji
- **Use case**: Filter for GPC-ready vendors

### Special Badges (Gold)
- **Purpose**: Achievements and distinctions
- **Values**: Combine Standout, Gov Champion, Pod Winner
- **Icon**: Achievement emoji
- **Use case**: Highlight top performers

## Usage Examples

### Basic Tag Rendering

```javascript
// Load the tag system (add to page template)
<script src="{{asset "js/tag-taxonomy.js"}}"></script>
<link rel="stylesheet" href="{{asset "css/tags.css"}}">

// Render all tags for a company
const tagsHtml = window.TagTaxonomy.renderCompanyTags(company, {
    size: 'default',  // or 'small', 'large'
    clickable: false,
    showIcon: true,
    showTooltip: true
});

// Insert into page
document.getElementById('company-tags').innerHTML = tagsHtml;
```

### Individual Tag Rendering

```javascript
// Get tag configuration
const tagConfig = window.TagTaxonomy.getTagConfig('missionArea', 'Fires');

// Render single tag
const tagHtml = window.TagTaxonomy.renderTag(tagConfig, {
    size: 'small',
    clickable: true
});
```

### Extract Tags from Company

```javascript
// Get array of tag configuration objects
const tags = window.TagTaxonomy.extractCompanyTags(company);

// tags = [
//   { category: 'missionArea', value: 'Fires', label: 'Fires', icon: '🎯', color: {...} },
//   { category: 'trl', value: '7', label: 'TRL 7', badge: '7', color: {...} },
//   ...
// ]
```

### Filtering with Tags

```javascript
// Get filter options for a category
const missionOptions = window.TagTaxonomy.getFilterOptions('missionArea');

// Render filter UI
missionOptions.forEach(option => {
    const filter = `
        <div class="tag-filter-option" data-value="${option.value}">
            <input type="checkbox" id="filter-${option.value}">
            <label for="filter-${option.value}">
                ${option.icon} ${option.label}
            </label>
        </div>
    `;
});
```

## Integration Guide

### Step 1: Add to Page Template

Add these lines to any page that needs tags:

```handlebars
{{!-- In the <head> or before </body> --}}
<link rel="stylesheet" href="{{asset "css/tags.css"}}">
<script src="{{asset "js/tag-taxonomy.js"}}"></script>
```

### Step 2: Render Tags in Company Modal

Update `company-modal-shared.js` to include tags in the header:

```javascript
// In the renderModal() function, after the company name/product name:
const tagsHtml = window.TagTaxonomy.renderCompanyTags(company, {
    size: 'default',
    showIcon: true,
    showTooltip: true
});

// Add to modal header HTML:
`<div class="tag-group">${tagsHtml}</div>`
```

### Step 3: Add Filtering to Cohorts Page

```javascript
// Create filter UI
function renderTagFilters() {
    const categories = ['missionArea', 'warfareDomain', 'trl', 'hardwareSoftware'];

    return categories.map(category => {
        const options = window.TagTaxonomy.getFilterOptions(category);
        return `
            <div class="filter-category">
                <h4>${window.TagTaxonomy.TAG_TAXONOMY[category].label}</h4>
                <div class="tag-group">
                    ${options.map(opt => `
                        <button class="tag tag-clickable"
                                data-category="${category}"
                                data-value="${opt.value}"
                                onclick="toggleFilter('${category}', '${opt.value}')">
                            ${opt.icon} ${opt.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Filter companies by selected tags
function filterCompaniesByTags(companies, activeFilters) {
    return companies.filter(company => {
        const companyTags = window.TagTaxonomy.extractCompanyTags(company);

        return Object.entries(activeFilters).every(([category, values]) => {
            if (values.length === 0) return true; // No filter for this category

            const companyValue = companyTags.find(t => t.category === category)?.value;
            return values.includes(companyValue);
        });
    });
}
```

## CSS Customization

### Custom Tag Colors

```css
/* Override tag colors for specific use cases */
.tag[data-category="missionArea"][data-value="Fires"] {
    background: #fee2e2;
    color: #991b1b;
    border-color: #fca5a5;
}
```

### Custom Sizes

```css
/* Extra small tags */
.tag-xs {
    padding: 3px 8px;
    font-size: 0.6875rem;
}

/* Extra large tags */
.tag-xl {
    padding: 10px 20px;
    font-size: 1.125rem;
}
```

## Best Practices

### 1. Tag Display Priority

Display tags in order of importance:
1. Mission Area (primary identifier)
2. TRL Level (readiness indicator)
3. Hardware/Software (type)
4. Special Badges (achievements)
5. Other metadata (funding, team size, etc.)

### 2. Mobile Responsiveness

On mobile, show only the most important 2-3 tags and hide others:

```html
<div class="tag-group">
    <span class="tag">🎯 Fires</span>
    <span class="tag">TRL 7</span>
    <span class="tag tag-hide-mobile">💾 Software</span>
    <span class="tag tag-hide-mobile">⭐ Standout</span>
</div>
```

### 3. Accessibility

- Always include `title` attributes for tooltips
- Use semantic HTML and ARIA attributes
- Ensure color contrast ratios meet WCAG AA standards
- Support keyboard navigation for clickable tags

### 4. Performance

- Render tags on the server when possible
- Cache tag configurations to avoid repeated calculations
- Use CSS classes instead of inline styles where possible

## Migration from Existing Systems

### Current Badge System

The existing `.badge-chip` class can be gradually replaced:

```javascript
// Old way
`<span class="badge-chip">${company.missionArea}</span>`

// New way
window.TagTaxonomy.renderTag(
    window.TagTaxonomy.getTagConfig('missionArea', company.missionArea)
)
```

### Backward Compatibility

The tag system is designed to coexist with existing badge implementations. No breaking changes required.

## Future Enhancements

### Phase 2 Features
- [ ] Multi-select tag filtering with AND/OR logic
- [ ] Tag-based search autocomplete
- [ ] Tag popularity analytics
- [ ] Custom user-defined tags
- [ ] Tag-based recommendations
- [ ] Export tag filters as shareable URLs

### Phase 3 Features
- [ ] Tag hierarchies and relationships
- [ ] Tag synonyms and aliases
- [ ] Machine learning tag suggestions
- [ ] Tag-based company clustering
- [ ] Tag trend analysis over time

## Support

For questions or issues with the tag system:
- Review this documentation
- Check `tag-taxonomy.js` for tag definitions
- See `tags.css` for styling options
- Contact: platform team

## Changelog

### v1.0.0 (2025-01-22)
- Initial tag system implementation
- 8 tag categories defined
- Centralized taxonomy and CSS
- Basic rendering and filtering utilities
