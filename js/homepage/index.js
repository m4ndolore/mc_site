// js/homepage/index.js
// Homepage - loads stats from live API

/**
 * API base URL
 */
const API_BASE = 'https://api.sigmablox.com';

/**
 * DOM selectors for stat elements
 * Each stat element should have a data-stat attribute matching these keys
 */
const STAT_SELECTORS = {
    companies: '[data-stat="companies"]',
    operators: '[data-stat="operators"]',
    problemSets: '[data-stat="problem-sets"]'
};

/**
 * Default stats to show while loading or on error
 */
const DEFAULT_STATS = {
    companies: '80+',
    operators: '150+',
    problemSets: '20+'
};

/**
 * Check if running on localhost
 * @returns {boolean}
 */
function isLocalhost() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Load seeded data from build-time JSON
 * @returns {Promise<Object|null>}
 */
async function loadSeededData() {
    try {
        const response = await fetch('/data/companies.json');
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (data.companies && Array.isArray(data.companies) && data.companies.length > 0) {
            console.log('[Homepage] Loaded seeded data:', data.companies.length, 'companies');
            return data;
        }
        return null;
    } catch (error) {
        console.warn('[Homepage] Failed to load seeded data:', error.message);
        return null;
    }
}

/**
 * Fetch company stats - prioritizes seeded data on localhost, tries live API in production
 * @returns {Promise<Object|null>}
 */
async function fetchCompanyStats() {
    // On localhost, prioritize seeded data to avoid CORS errors
    if (isLocalhost()) {
        return await loadSeededData();
    }

    // In production, try live API first, fall back to seeded data
    try {
        const response = await fetch(`${API_BASE}/api/public/companies?limit=100`);
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        if (data.companies && data.companies.length > 0) {
            return data;
        }
        // API returned empty, try seeded data
        throw new Error('API returned empty data');
    } catch (error) {
        console.warn('[Homepage] Live API failed:', error.message, '- trying seeded data');
        return await loadSeededData();
    }
}

/**
 * Calculate stats from company data
 * @param {Object} data - API response data
 * @returns {Object} Stats object with companies, operators, problemSets
 */
function calculateStats(data) {
    const companies = data?.companies || [];
    const total = data?.pagination?.total || companies.length;

    // Extract unique mission areas as "problem sets"
    const missionAreas = new Set();
    companies.forEach(company => {
        if (company.missionArea) {
            missionAreas.add(company.missionArea);
        }
        if (company.secondaryMissions && Array.isArray(company.secondaryMissions)) {
            company.secondaryMissions.forEach(m => missionAreas.add(m));
        }
    });

    // Format stats with "+" suffix for rounded numbers
    const companiesCount = total >= 80 ? `${Math.floor(total / 10) * 10}+` : `${total}`;
    const problemSetsCount = missionAreas.size >= 20 ? `${Math.floor(missionAreas.size / 5) * 5}+` : `${missionAreas.size}`;

    return {
        companies: companiesCount,
        // Operators stat comes from external source - keep default
        operators: DEFAULT_STATS.operators,
        problemSets: problemSetsCount
    };
}

/**
 * Update all stat elements in the DOM
 * @param {Object} stats - Stats object
 */
function updateStatElements(stats) {
    // Update hero section stats
    document.querySelectorAll(STAT_SELECTORS.companies).forEach(el => {
        el.textContent = stats.companies;
    });

    document.querySelectorAll(STAT_SELECTORS.operators).forEach(el => {
        el.textContent = stats.operators;
    });

    document.querySelectorAll(STAT_SELECTORS.problemSets).forEach(el => {
        el.textContent = stats.problemSets;
    });

    console.log('[Homepage] Stats updated:', stats);
}

/**
 * Initialize homepage stats
 */
async function init() {
    console.log('[Homepage] Initializing...');

    // Fetch stats from live API
    const data = await fetchCompanyStats();

    if (data) {
        // Calculate and update stats from API data
        const stats = calculateStats(data);
        updateStatElements(stats);
    } else {
        // Use defaults (already in HTML, no update needed)
        console.log('[Homepage] Using default stats');
    }

    console.log('[Homepage] Initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
