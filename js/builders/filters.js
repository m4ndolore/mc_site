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
    const techSelect = document.getElementById('filter-tech');
    const cohortSelect = document.getElementById('filter-cohort');

    // Mission areas
    if (missionSelect) {
        missionSelect.innerHTML = '<option value="">All Mission Areas</option>' +
            options.missionAreas.map(m => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
    }

    // Tech areas (CTAs)
    if (techSelect) {
        techSelect.innerHTML = '<option value="">All Tech Areas</option>' +
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
        cta: document.getElementById('filter-tech')?.value || '',
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
        missionAreas: document.getElementById('stat-mission-areas'),
        techAreas: document.getElementById('stat-tech-areas'),
        cohorts: document.getElementById('stat-cohorts')
    };

    if (elements.builders) elements.builders.textContent = stats.builders;
    if (elements.missionAreas) elements.missionAreas.textContent = stats.missionAreas;
    if (elements.techAreas) elements.techAreas.textContent = stats.ctas;
    if (elements.cohorts) elements.cohorts.textContent = stats.cohorts;
}

/**
 * Update results count
 * @param {number} count - Number of results
 */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${count} builder${count !== 1 ? 's' : ''} active`;
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
