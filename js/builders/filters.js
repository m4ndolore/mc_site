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

        // Technology area filter — OR logic
        if (filters.technologyAreas && filters.technologyAreas.length > 0) {
            const companyAreas = (company.technologyArea || '')
                .split(',')
                .map(a => a.trim())
                .filter(Boolean);
            if (!companyAreas.some(a => filters.technologyAreas.includes(a))) {
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

        // Warfare domain filter — OR logic across selected domains
        // Company matches if ANY of its domains overlap with ANY selected domain
        if (filters.warfareDomains && filters.warfareDomains.length > 0) {
            const companyDomains = (company.warfareDomain || '')
                .split(',')
                .map(d => d.trim().toLowerCase())
                .filter(Boolean);
            const selectedDomains = filters.warfareDomains.map(d => d.toLowerCase());
            const hasOverlap = companyDomains.some(d => selectedDomains.includes(d));
            if (!hasOverlap) {
                return false;
            }
        }

        // Legacy single warfareDomain filter (backward compat)
        if (filters.warfareDomain && (!filters.warfareDomains || filters.warfareDomains.length === 0)) {
            const companyDomains = (company.warfareDomain || '')
                .split(',')
                .map(d => d.trim().toLowerCase())
                .filter(Boolean);
            if (!companyDomains.includes(filters.warfareDomain.toLowerCase())) {
                return false;
            }
        }

        // Funding stage filter
        if (filters.fundingStage) {
            if (company.fundingStage !== filters.fundingStage) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Populate filter dropdowns and domain chips
 * @param {Object} options - {missionAreas, warfareDomains, fundingStages, cohorts}
 */
export function populateFilters(options) {
    const missionSelect = document.getElementById('filter-mission');
    const fundingSelect = document.getElementById('filter-funding');
    const domainsContainer = document.getElementById('filter-domains-multi');
    const techContainer = document.getElementById('filter-cta-chips');

    const missionAreas = options?.missionAreas || [];
    const warfareDomains = options?.warfareDomains || [];
    const fundingStages = options?.fundingStages || [];
    const technologyAreas = options?.technologyAreas || [];

    // Normalize warfare domains — extract individual domains from comma-separated values
    const uniqueDomains = new Set();
    warfareDomains.forEach(d => {
        d.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
            // Normalize casing
            const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
            uniqueDomains.add(normalized);
        });
    });
    const sortedDomains = [...uniqueDomains].sort();

    // Mission areas
    if (missionSelect && missionAreas.length > 0) {
        missionSelect.innerHTML = '<option value="">All Mission Areas</option>' +
            missionAreas.map(m => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
    }

    // Domain chips (multi-select)
    if (domainsContainer && sortedDomains.length > 0) {
        domainsContainer.innerHTML = sortedDomains.map(d =>
            `<button type="button" class="domain-chip" data-domain="${escapeAttr(d)}">${escapeHtml(d)}</button>`
        ).join('');
    }

    // Technology area chips (multi-select)
    if (techContainer && technologyAreas.length > 0) {
        techContainer.innerHTML = technologyAreas.map(a =>
            `<button type="button" class="builders-filters__chip" data-area="${escapeAttr(a)}">${escapeHtml(a)}</button>`
        ).join('');
    }

    // Funding stages
    if (fundingSelect && fundingStages.length > 0) {
        fundingSelect.innerHTML = '<option value="">All Funding Stages</option>' +
            fundingStages.map(f => `<option value="${escapeAttr(f)}">${escapeHtml(f)}</option>`).join('');
    }
}

/**
 * Get current filter state from DOM
 * @returns {Object} - Current filter state
 */
export function getFilterState() {
    // Collect selected domain chips
    const domainChips = document.querySelectorAll('#filter-domains-multi .domain-chip.active');
    const warfareDomains = Array.from(domainChips).map(c => c.dataset.domain);

    // Collect selected technology area chips
    const techChips = document.querySelectorAll('#filter-cta-chips .builders-filters__chip.active');
    const technologyAreas = Array.from(techChips).map(c => c.dataset.area);

    return {
        search: document.getElementById('search-input')?.value || '',
        missionArea: document.getElementById('filter-mission')?.value || '',
        technologyAreas,
        warfareDomains,
        warfareDomain: '', // Legacy — chips replace the select
        fundingStage: document.getElementById('filter-funding')?.value || '',
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
    if (elements.techAreas) elements.techAreas.textContent = stats.ctas;
    if (elements.fundingStages) elements.fundingStages.textContent = stats.fundingStages;
    // Don't overwrite cohort label — it's "25-1" not a count
}

/**
 * Update results count
 * @param {number} count - Number of results
 */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${count} ${count === 1 ? 'company' : 'companies'}`;
}

// Utility functions
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function escapeAttr(str) {
    if (str == null) return '';
    const s = String(str);
    return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
