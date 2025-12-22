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
