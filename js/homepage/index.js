// js/homepage/index.js
// Homepage - loads stats from seeded company data

/**
 * Path to build-time seeded company data
 */
const SEEDED_DATA_PATH = '/data/companies.json';

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
 * Load company data from seeded JSON
 * @returns {Promise<Object|null>}
 */
async function loadSeededData() {
    try {
        const response = await fetch(SEEDED_DATA_PATH);
        if (!response.ok) {
            console.log('[Homepage] No seeded data available');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log('[Homepage] Failed to load seeded data:', error.message);
        return null;
    }
}

/**
 * Calculate stats from company data
 * @param {Object} data - Seeded data object
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

    // Load seeded data
    const data = await loadSeededData();

    if (data) {
        // Calculate and update stats from real data
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
