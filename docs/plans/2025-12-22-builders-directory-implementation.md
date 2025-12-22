# Defense Builders Directory - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a command-center style directory page at `/builders` that displays defense tech companies from the existing SigmaBlox webhook API.

**Architecture:** Static page in mc_site Vite project, fetches data from SigmaBlox webhook `/getCohorts` endpoint, renders filterable card grid with modal detail views. Dark theme matching typography.md.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Vite build, existing webhook API

**Worktree:** `~/Dev/worktrees/mc_site/builders-directory`

**Design Doc:** `docs/plans/2025-12-22-defense-builders-directory-design.md`

---

## Task 1: Create builders.html Page Shell

**Files:**
- Create: `builders.html`

**Step 1: Create the HTML file with basic structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Builders Directory | Merge Combinator</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="styles/builders.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation (copy from index.html) -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-logo">
                <span class="logo-merge">Merge</span>
                <span class="logo-combinator">Combinator</span>
            </a>
            <div class="nav-links">
                <a href="/about">About</a>
                <a href="/services">Services</a>
                <a href="/builders" class="active">Builders</a>
                <a href="/blog">Blog</a>
                <a href="/careers">Careers</a>
            </div>
            <div class="nav-cta">
                <a href="#" class="btn-login">Login</a>
                <a href="#" class="btn-apply">Apply</a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="builders-page">
        <div class="builders-container">
            <!-- Stats Bar -->
            <section id="stats-bar" class="stats-bar">
                <div class="stat-item">
                    <span class="stat-value" id="stat-builders">--</span>
                    <span class="stat-label">Builders</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-missions">--</span>
                    <span class="stat-label">Mission Areas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-ctas">--</span>
                    <span class="stat-label">Tech Areas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-cohorts">--</span>
                    <span class="stat-label">Cohorts</span>
                </div>
            </section>

            <!-- Filters -->
            <section id="filter-bar" class="filter-bar">
                <div class="filter-group search-group">
                    <input type="text" id="search-input" class="search-input" placeholder="Search builders...">
                </div>
                <div class="filter-group">
                    <select id="filter-mission" class="filter-select">
                        <option value="">All Mission Areas</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select id="filter-cta" class="filter-select">
                        <option value="">All Tech Areas</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select id="filter-cohort" class="filter-select">
                        <option value="">All Cohorts</option>
                    </select>
                </div>
            </section>

            <!-- Results Count -->
            <div class="results-info">
                Showing <strong id="results-count">0</strong> builders
            </div>

            <!-- Builder Cards Grid -->
            <section id="builders-grid" class="builders-grid">
                <!-- Cards rendered by JavaScript -->
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading builders...</p>
                </div>
            </section>
        </div>
    </main>

    <!-- Builder Modal -->
    <div id="builder-modal" class="modal-overlay">
        <div class="modal-content">
            <button class="modal-close" id="modal-close">&times;</button>
            <div id="modal-body">
                <!-- Modal content rendered by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Configuration -->
    <script>
        window.MCPlatformConfig = {
            apiBase: 'https://webhook-667608980042.us-central1.run.app'
        };
    </script>
    <script type="module" src="js/builders/index.js"></script>
</body>
</html>
```

**Step 2: Verify file created**

Run: `ls -la builders.html`
Expected: File exists

**Step 3: Commit**

```bash
git add builders.html
git commit -m "feat(builders): add page shell with stats, filters, grid sections"
```

---

## Task 2: Create Builders CSS File

**Files:**
- Create: `styles/builders.css`

**Step 1: Create the styles directory if needed**

```bash
mkdir -p styles
```

**Step 2: Create builders.css with dark theme**

```css
/* Defense Builders Directory Styles */
/* Colors from typography.md */
:root {
    --near-black: #0B0E11;
    --charcoal: #1C232B;
    --slate: #2C3036;
    --off-white: #F2F5F7;
    --white: #FFFFFF;
    --signal-blue: #2A7FDB;
    --operator-green: #5DA06F;

    /* Derived */
    --text-primary: var(--off-white);
    --text-secondary: #888888;
    --border-color: #1e1e2e;
    --card-bg: var(--charcoal);
    --glow-blue: rgba(42, 127, 219, 0.3);
    --glow-green: rgba(93, 160, 111, 0.3);
}

/* Page Layout */
.builders-page {
    background: var(--near-black);
    min-height: 100vh;
    padding-top: 100px;
}

.builders-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 24px;
}

/* Stats Bar */
.stats-bar {
    display: flex;
    gap: 24px;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--charcoal);
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.stat-value {
    font-family: 'Inter', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--signal-blue);
    line-height: 1.2;
}

.stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 4px;
}

/* Filter Bar */
.filter-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.filter-group {
    flex: 1;
    min-width: 200px;
}

.filter-group.search-group {
    flex: 2;
}

.search-input,
.filter-select {
    width: 100%;
    padding: 12px 16px;
    background: var(--charcoal);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus,
.filter-select:focus {
    outline: none;
    border-color: var(--signal-blue);
    box-shadow: 0 0 0 3px var(--glow-blue);
}

.filter-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
}

.filter-select option {
    background: var(--charcoal);
    color: var(--text-primary);
}

/* Results Info */
.results-info {
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
}

.results-info strong {
    color: var(--signal-blue);
}

/* Builders Grid */
.builders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}

/* Builder Card */
.builder-card {
    background: var(--charcoal);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.builder-card:hover {
    transform: translateY(-4px);
    border-color: var(--signal-blue);
    box-shadow: 0 8px 32px var(--glow-blue);
}

.builder-card-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    background: var(--white);
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 16px;
}

.builder-card-name {
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    margin: 0 0 8px 0;
}

.builder-card-tagline {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0 0 16px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.builder-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.builder-tag {
    font-family: 'Space Mono', monospace;
    font-size: 0.6875rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--slate);
    color: var(--text-secondary);
}

.builder-tag.mission {
    background: rgba(42, 127, 219, 0.15);
    color: var(--signal-blue);
    border: 1px solid rgba(42, 127, 219, 0.3);
}

.builder-tag.cta {
    background: rgba(93, 160, 111, 0.15);
    color: var(--operator-green);
    border: 1px solid rgba(93, 160, 111, 0.3);
}

/* Loading State */
.loading-container {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
}

.loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--border-color);
    border-top-color: var(--signal-blue);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-container p {
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

/* Empty State */
.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    background: var(--charcoal);
    border: 1px solid var(--border-color);
    border-radius: 12px;
}

.empty-state h3 {
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    margin: 0 0 8px 0;
}

.empty-state p {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    color: var(--text-secondary);
}

/* Modal */
.modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    padding: 40px 20px;
    overflow-y: auto;
}

.modal-overlay.active {
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

.modal-content {
    background: var(--charcoal);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    max-width: 800px;
    width: 100%;
    position: relative;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: var(--slate);
    border: none;
    color: var(--text-secondary);
    font-size: 24px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
}

.modal-close:hover {
    background: var(--signal-blue);
    color: var(--white);
}

/* Modal Content */
.modal-header {
    padding: 32px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    gap: 24px;
    align-items: flex-start;
}

.modal-logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    background: var(--white);
    border-radius: 12px;
    padding: 12px;
    flex-shrink: 0;
}

.modal-title-section {
    flex: 1;
}

.modal-title {
    font-family: 'Inter', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--white);
    margin: 0 0 8px 0;
}

.modal-cohort {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
}

.modal-website {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    color: var(--signal-blue);
    text-decoration: none;
}

.modal-website:hover {
    text-decoration: underline;
}

.modal-body {
    padding: 32px;
}

.modal-section {
    margin-bottom: 32px;
}

.modal-section:last-child {
    margin-bottom: 0;
}

.modal-section-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 12px 0;
}

.modal-section p {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    color: var(--text-primary);
    line-height: 1.6;
    margin: 0;
}

.modal-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
    .stats-bar {
        flex-wrap: wrap;
    }

    .stat-item {
        flex: 1 1 45%;
    }

    .filter-bar {
        flex-direction: column;
    }

    .filter-group {
        min-width: 100%;
    }

    .modal-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
}
```

**Step 3: Verify file created**

Run: `ls -la styles/builders.css`
Expected: File exists with content

**Step 4: Commit**

```bash
git add styles/builders.css
git commit -m "feat(builders): add dark theme CSS with stats, cards, filters, modal"
```

---

## Task 3: Create API Module

**Files:**
- Create: `js/builders/api.js`

**Step 1: Create the js/builders directory**

```bash
mkdir -p js/builders
```

**Step 2: Create api.js for data fetching**

```javascript
// js/builders/api.js
// API client for fetching builder data from webhook

/**
 * Get the API base URL from config
 */
function getApiBase() {
    if (window.MCPlatformConfig && window.MCPlatformConfig.apiBase) {
        return window.MCPlatformConfig.apiBase;
    }
    throw new Error('MCPlatformConfig.apiBase not configured');
}

/**
 * Fetch all cohorts with companies
 * @returns {Promise<{cohorts: Array}>}
 */
export async function fetchCohorts() {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/getCohorts`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch cohorts: ${response.status}`);
    }

    return response.json();
}

/**
 * Extract unique companies from cohorts data
 * @param {Array} cohorts - Array of cohort objects
 * @returns {Array} - Flattened array of unique companies
 */
export function extractCompanies(cohorts) {
    const companiesMap = new Map();

    for (const cohort of cohorts) {
        if (!cohort.companies) continue;

        for (const company of cohort.companies) {
            const id = company.id || company._id;
            if (!id) continue;

            // Skip if already seen (take first occurrence)
            if (companiesMap.has(id)) continue;

            companiesMap.set(id, {
                id,
                name: company.name || 'Unknown',
                logo: company.logo || null,
                tagline: company.tagline || company.description || '',
                description: company.description || company.tagline || '',
                website: company.website || '',
                missionAreas: company.missionAreas || [],
                ctas: company.ctas || company.criticalTechAreas || [],
                videoUrl: company.videoUrl || company.video || null,
                cohort: cohort.name || cohort.id,
                cohortId: cohort.id || cohort._id
            });
        }
    }

    return Array.from(companiesMap.values());
}

/**
 * Extract unique values for filters
 * @param {Array} companies - Array of company objects
 * @returns {{missionAreas: Array, ctas: Array, cohorts: Array}}
 */
export function extractFilterOptions(companies) {
    const missionAreas = new Set();
    const ctas = new Set();
    const cohorts = new Set();

    for (const company of companies) {
        if (company.missionAreas) {
            company.missionAreas.forEach(m => missionAreas.add(m));
        }
        if (company.ctas) {
            company.ctas.forEach(c => ctas.add(c));
        }
        if (company.cohort) {
            cohorts.add(company.cohort);
        }
    }

    return {
        missionAreas: Array.from(missionAreas).sort(),
        ctas: Array.from(ctas).sort(),
        cohorts: Array.from(cohorts).sort()
    };
}
```

**Step 3: Verify file created**

Run: `cat js/builders/api.js | head -20`
Expected: Shows API module code

**Step 4: Commit**

```bash
git add js/builders/api.js
git commit -m "feat(builders): add API module for fetching cohort data"
```

---

## Task 4: Create Components Module

**Files:**
- Create: `js/builders/components.js`

**Step 1: Create components.js for rendering**

```javascript
// js/builders/components.js
// UI components for builder directory

/**
 * Render a builder card
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderCard(company) {
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="builder-card-logo">`
        : `<div class="builder-card-logo" style="display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#666;">${escapeHtml(company.name.charAt(0))}</div>`;

    const missionTags = (company.missionAreas || []).slice(0, 2)
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const ctaTags = (company.ctas || []).slice(0, 1)
        .map(c => `<span class="builder-tag cta">${escapeHtml(c)}</span>`)
        .join('');

    return `
        <article class="builder-card" data-id="${escapeHtml(company.id)}" tabindex="0" role="button">
            ${logoHtml}
            <h3 class="builder-card-name">${escapeHtml(company.name)}</h3>
            <p class="builder-card-tagline">${escapeHtml(company.tagline)}</p>
            <div class="builder-card-tags">
                ${missionTags}
                ${ctaTags}
            </div>
        </article>
    `;
}

/**
 * Render the modal content for a company
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderModal(company) {
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="modal-logo">`
        : `<div class="modal-logo" style="display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;color:#666;">${escapeHtml(company.name.charAt(0))}</div>`;

    const websiteHtml = company.website
        ? `<a href="${escapeHtml(company.website)}" target="_blank" rel="noopener" class="modal-website">${escapeHtml(company.website.replace(/^https?:\/\//, ''))}</a>`
        : '';

    const missionTags = (company.missionAreas || [])
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const ctaTags = (company.ctas || [])
        .map(c => `<span class="builder-tag cta">${escapeHtml(c)}</span>`)
        .join('');

    const videoHtml = company.videoUrl
        ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Video</h4>
                <div class="modal-video">
                    <iframe
                        src="${escapeHtml(company.videoUrl)}"
                        style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            </div>
        `
        : '';

    return `
        <div class="modal-header">
            ${logoHtml}
            <div class="modal-title-section">
                <h2 class="modal-title">${escapeHtml(company.name)}</h2>
                <div class="modal-cohort">${escapeHtml(company.cohort)}</div>
                ${websiteHtml}
            </div>
        </div>
        <div class="modal-body">
            <div class="modal-section">
                <h4 class="modal-section-title">About</h4>
                <p>${escapeHtml(company.description || company.tagline)}</p>
            </div>
            ${missionTags ? `
                <div class="modal-section">
                    <h4 class="modal-section-title">Mission Areas</h4>
                    <div class="modal-tags">${missionTags}</div>
                </div>
            ` : ''}
            ${ctaTags ? `
                <div class="modal-section">
                    <h4 class="modal-section-title">Critical Technology Areas</h4>
                    <div class="modal-tags">${ctaTags}</div>
                </div>
            ` : ''}
            ${videoHtml}
        </div>
    `;
}

/**
 * Render empty state
 * @returns {string} - HTML string
 */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No builders found</h3>
            <p>Try adjusting your search or filters.</p>
        </div>
    `;
}

/**
 * Render loading state
 * @returns {string} - HTML string
 */
export function renderLoadingState() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading builders...</p>
        </div>
    `;
}

/**
 * Render error state
 * @param {string} message - Error message
 * @returns {string} - HTML string
 */
export function renderErrorState(message) {
    return `
        <div class="empty-state">
            <h3>Failed to load builders</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

**Step 2: Verify file created**

Run: `cat js/builders/components.js | head -20`
Expected: Shows components module code

**Step 3: Commit**

```bash
git add js/builders/components.js
git commit -m "feat(builders): add component renderers for cards, modal, states"
```

---

## Task 5: Create Filters Module

**Files:**
- Create: `js/builders/filters.js`

**Step 1: Create filters.js for search and filtering**

```javascript
// js/builders/filters.js
// Search and filter logic for builder directory

/**
 * Filter companies based on current filter state
 * @param {Array} companies - All companies
 * @param {Object} filters - Current filter state
 * @returns {Array} - Filtered companies
 */
export function filterCompanies(companies, filters) {
    return companies.filter(company => {
        // Search filter (name, tagline, description)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const searchFields = [
                company.name,
                company.tagline,
                company.description
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchFields.includes(searchLower)) {
                return false;
            }
        }

        // Mission area filter
        if (filters.missionArea) {
            if (!company.missionAreas || !company.missionAreas.includes(filters.missionArea)) {
                return false;
            }
        }

        // CTA filter
        if (filters.cta) {
            if (!company.ctas || !company.ctas.includes(filters.cta)) {
                return false;
            }
        }

        // Cohort filter
        if (filters.cohort) {
            if (company.cohort !== filters.cohort) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Populate filter dropdowns with options
 * @param {Object} options - {missionAreas, ctas, cohorts}
 */
export function populateFilters(options) {
    const missionSelect = document.getElementById('filter-mission');
    const ctaSelect = document.getElementById('filter-cta');
    const cohortSelect = document.getElementById('filter-cohort');

    // Mission areas
    if (missionSelect) {
        missionSelect.innerHTML = '<option value="">All Mission Areas</option>' +
            options.missionAreas.map(m => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
    }

    // CTAs
    if (ctaSelect) {
        ctaSelect.innerHTML = '<option value="">All Tech Areas</option>' +
            options.ctas.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    }

    // Cohorts
    if (cohortSelect) {
        cohortSelect.innerHTML = '<option value="">All Cohorts</option>' +
            options.cohorts.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    }
}

/**
 * Get current filter state from DOM
 * @returns {Object} - Current filter state
 */
export function getFilterState() {
    return {
        search: document.getElementById('search-input')?.value || '',
        missionArea: document.getElementById('filter-mission')?.value || '',
        cta: document.getElementById('filter-cta')?.value || '',
        cohort: document.getElementById('filter-cohort')?.value || ''
    };
}

/**
 * Update stats display
 * @param {Object} stats - {builders, missionAreas, ctas, cohorts}
 */
export function updateStats(stats) {
    const elements = {
        builders: document.getElementById('stat-builders'),
        missions: document.getElementById('stat-missions'),
        ctas: document.getElementById('stat-ctas'),
        cohorts: document.getElementById('stat-cohorts')
    };

    if (elements.builders) elements.builders.textContent = stats.builders;
    if (elements.missions) elements.missions.textContent = stats.missionAreas;
    if (elements.ctas) elements.ctas.textContent = stats.ctas;
    if (elements.cohorts) elements.cohorts.textContent = stats.cohorts;
}

/**
 * Update results count
 * @param {number} count - Number of results
 */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = count;
}

// Utility functions
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

**Step 2: Verify file created**

Run: `cat js/builders/filters.js | head -20`
Expected: Shows filters module code

**Step 3: Commit**

```bash
git add js/builders/filters.js
git commit -m "feat(builders): add filter and search logic module"
```

---

## Task 6: Create Main Entry Point

**Files:**
- Create: `js/builders/index.js`

**Step 1: Create index.js to wire everything together**

```javascript
// js/builders/index.js
// Main entry point for builder directory

import { fetchCohorts, extractCompanies, extractFilterOptions } from './api.js';
import {
    renderBuilderCard,
    renderBuilderModal,
    renderEmptyState,
    renderLoadingState,
    renderErrorState
} from './components.js';
import {
    filterCompanies,
    populateFilters,
    getFilterState,
    updateStats,
    updateResultsCount
} from './filters.js';

// State
let allCompanies = [];
let currentCompany = null;

// DOM Elements
const grid = document.getElementById('builders-grid');
const modal = document.getElementById('builder-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

/**
 * Initialize the builder directory
 */
async function init() {
    console.log('[Builders] Initializing...');

    // Show loading state
    if (grid) grid.innerHTML = renderLoadingState();

    try {
        // Fetch data
        const data = await fetchCohorts();
        console.log('[Builders] Fetched cohorts:', data);

        // Extract companies
        allCompanies = extractCompanies(data.cohorts || data);
        console.log('[Builders] Extracted companies:', allCompanies.length);

        // Extract filter options
        const filterOptions = extractFilterOptions(allCompanies);

        // Update stats
        updateStats({
            builders: allCompanies.length,
            missionAreas: filterOptions.missionAreas.length,
            ctas: filterOptions.ctas.length,
            cohorts: filterOptions.cohorts.length
        });

        // Populate filter dropdowns
        populateFilters(filterOptions);

        // Render initial view
        renderBuilders(allCompanies);

        // Setup event listeners
        setupEventListeners();

        console.log('[Builders] Initialization complete');
    } catch (error) {
        console.error('[Builders] Failed to initialize:', error);
        if (grid) grid.innerHTML = renderErrorState(error.message);
    }
}

/**
 * Render the builder cards
 * @param {Array} companies - Companies to render
 */
function renderBuilders(companies) {
    if (!grid) return;

    updateResultsCount(companies.length);

    if (companies.length === 0) {
        grid.innerHTML = renderEmptyState();
        return;
    }

    grid.innerHTML = companies.map(renderBuilderCard).join('');

    // Add click handlers to cards
    grid.querySelectorAll('.builder-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card.dataset.id);
            }
        });
    });
}

/**
 * Apply filters and re-render
 */
function applyFilters() {
    const filters = getFilterState();
    const filtered = filterCompanies(allCompanies, filters);
    renderBuilders(filtered);
}

/**
 * Open the modal for a company
 * @param {string} companyId - Company ID
 */
function openModal(companyId) {
    currentCompany = allCompanies.find(c => c.id === companyId);
    if (!currentCompany) return;

    if (modalBody) modalBody.innerHTML = renderBuilderModal(currentCompany);
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the modal
 */
function closeModal() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCompany = null;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input (debounced)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 300);
        });
    }

    // Filter dropdowns
    ['filter-mission', 'filter-cta', 'filter-cohort'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Modal close button
    if (modalClose) modalClose.addEventListener('click', closeModal);

    // Modal overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

**Step 2: Verify file created**

Run: `cat js/builders/index.js | head -20`
Expected: Shows main entry point code

**Step 3: Commit**

```bash
git add js/builders/index.js
git commit -m "feat(builders): add main entry point to wire API, components, filters"
```

---

## Task 7: Add builders.html to Vite Build

**Files:**
- Modify: `vite.config.js`

**Step 1: Read current vite.config.js**

Run: `cat vite.config.js`

**Step 2: Add builders.html to build inputs**

Update the rollupOptions input to include builders:

```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        blog: resolve(__dirname, 'blog.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        builders: resolve(__dirname, 'builders.html'),
      }
    },
    copyPublicDir: false
  },
  publicDir: false
})
```

**Step 3: Verify build includes builders.html**

Run: `npm run build`
Expected: Output shows `dist/builders.html`

**Step 4: Commit**

```bash
git add vite.config.js
git commit -m "build: add builders.html to Vite build config"
```

---

## Task 8: Add Route to vercel.json

**Files:**
- Modify: `vercel.json`

**Step 1: Read current vercel.json**

Run: `cat vercel.json`

**Step 2: Add builders rewrite rule**

Add to the rewrites array:

```json
{
  "source": "/builders",
  "destination": "/builders.html"
}
```

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "config: add /builders route to Vercel rewrites"
```

---

## Task 9: Test Locally

**Files:**
- None (verification only)

**Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts on port 3000

**Step 2: Open builders page**

Navigate to: `http://localhost:3000/builders.html`
Expected: Page loads with dark theme, shows loading state, then either data or error

**Step 3: Check console for errors**

Open browser dev tools → Console
Expected: No JavaScript errors, logs showing initialization

**Step 4: Test filters (if data loads)**

- Type in search box → cards filter
- Select dropdown option → cards filter
- Click card → modal opens
- Press Escape or click X → modal closes

**Step 5: Run production build**

Run: `npm run build && npm run preview`
Expected: Preview server starts, `/builders` route works

---

## Task 10: Final Commit and Push

**Files:**
- None (git operations only)

**Step 1: Verify all changes committed**

Run: `git status`
Expected: Working directory clean

**Step 2: Review commit log**

Run: `git log --oneline -10`
Expected: Shows all feature commits

**Step 3: Push feature branch**

Run: `git push -u origin feature/builders-directory`
Expected: Branch pushed to remote

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Page shell | `builders.html` |
| 2 | Dark theme CSS | `styles/builders.css` |
| 3 | API module | `js/builders/api.js` |
| 4 | Components | `js/builders/components.js` |
| 5 | Filters | `js/builders/filters.js` |
| 6 | Main entry | `js/builders/index.js` |
| 7 | Vite config | `vite.config.js` |
| 8 | Vercel route | `vercel.json` |
| 9 | Local testing | (verification) |
| 10 | Push branch | (git) |

**After completion:** Create PR to merge `feature/builders-directory` into `main`.
