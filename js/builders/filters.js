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
                company.productName,
                company.displayName,
                company.tagline,
                company.description
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchFields.includes(searchLower)) {
                return false;
            }
        }

        // Mission area filter
        if (filters.missionArea) {
            const hasMission = company.missionAreas?.includes(filters.missionArea) ||
                              company.primaryMission === filters.missionArea;
            if (!hasMission) {
                return false;
            }
        }

        // Warfare domain filter (replaces CTA)
        if (filters.warfareDomain) {
            if (company.warfareDomain !== filters.warfareDomain) {
                return false;
            }
        }

        // Funding stage filter
        if (filters.fundingStage) {
            if (company.fundingStage !== filters.fundingStage) {
                return false;
            }
        }

        // Cohort filter
        if (filters.cohort) {
            if (company.cohort !== filters.cohort) {
                return false;
            }
        }

        // Legacy CTA filter support
        if (filters.cta && !filters.warfareDomain) {
            if (company.warfareDomain !== filters.cta) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Populate filter dropdowns with options
 * @param {Object} options - {missionAreas, warfareDomains, fundingStages, cohorts}
 */
export function populateFilters(options) {
    const missionSelect = document.getElementById('filter-mission');
    const domainSelect = document.getElementById('filter-domain');
    const fundingSelect = document.getElementById('filter-funding');
    const cohortSelect = document.getElementById('filter-cohort');
    // Legacy support
    const techSelect = document.getElementById('filter-tech');

    // Mission areas
    if (missionSelect) {
        missionSelect.innerHTML = '<option value="">All Mission Areas</option>' +
            options.missionAreas.map(m => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
    }

    // Warfare domains
    if (domainSelect) {
        domainSelect.innerHTML = '<option value="">All Domains</option>' +
            options.warfareDomains.map(d => `<option value="${escapeAttr(d)}">${escapeHtml(d)}</option>`).join('');
    }

    // Funding stages
    if (fundingSelect) {
        fundingSelect.innerHTML = '<option value="">All Funding Stages</option>' +
            options.fundingStages.map(f => `<option value="${escapeAttr(f)}">${escapeHtml(f)}</option>`).join('');
    }

    // Cohorts
    if (cohortSelect) {
        cohortSelect.innerHTML = '<option value="">All Cohorts</option>' +
            options.cohorts.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    }

    // Legacy tech select (uses warfare domains)
    if (techSelect) {
        const domains = options.warfareDomains || options.ctas || [];
        techSelect.innerHTML = '<option value="">All Domains</option>' +
            domains.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
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
        warfareDomain: document.getElementById('filter-domain')?.value ||
                       document.getElementById('filter-tech')?.value || '',
        fundingStage: document.getElementById('filter-funding')?.value || '',
        cohort: document.getElementById('filter-cohort')?.value || '',
        // Legacy alias
        cta: document.getElementById('filter-tech')?.value || ''
    };
}

/**
 * Update stats display
 * @param {Object} stats - {builders, missionAreas, warfareDomains, fundingStages, cohorts}
 */
export function updateStats(stats) {
    const elements = {
        builders: document.getElementById('stat-builders'),
        missionAreas: document.getElementById('stat-mission-areas'),
        domains: document.getElementById('stat-domains'),
        techAreas: document.getElementById('stat-tech-areas'),
        fundingStages: document.getElementById('stat-funding'),
        cohorts: document.getElementById('stat-cohorts')
    };

    if (elements.builders) elements.builders.textContent = stats.builders;
    if (elements.missionAreas) elements.missionAreas.textContent = stats.missionAreas;
    if (elements.domains) elements.domains.textContent = stats.warfareDomains || stats.ctas;
    if (elements.techAreas) elements.techAreas.textContent = stats.warfareDomains || stats.ctas;
    if (elements.fundingStages) elements.fundingStages.textContent = stats.fundingStages;
    if (elements.cohorts) elements.cohorts.textContent = stats.cohorts;
}

/**
 * Update results count - operational language per C2UX
 * @param {number} count - Number of results
 */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${count} record${count !== 1 ? 's' : ''}`;
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
