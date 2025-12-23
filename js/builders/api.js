// js/builders/api.js
// API client for fetching builder data from webhook

/**
 * Mock data for local development when backend is unavailable
 */
const MOCK_DATA = {
    cohorts: [
        {
            id: 'cohort-1',
            name: 'Cohort 1 - Spring 2024',
            companies: [
                {
                    id: 'company-1',
                    name: 'ShieldAI',
                    logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
                    tagline: 'AI-powered autonomous systems for defense',
                    description: 'Building intelligent systems that protect service members and civilians.',
                    website: 'https://shield.ai',
                    missionAreas: ['Autonomous Systems', 'AI/ML'],
                    ctas: ['Counter-UAS', 'ISR']
                },
                {
                    id: 'company-2',
                    name: 'Anduril Industries',
                    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop',
                    tagline: 'Transforming defense capabilities through technology',
                    description: 'Bringing Silicon Valley innovation to national security.',
                    website: 'https://anduril.com',
                    missionAreas: ['Autonomous Systems', 'Border Security'],
                    ctas: ['Counter-UAS', 'Surveillance']
                },
                {
                    id: 'company-3',
                    name: 'Palantir Technologies',
                    logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop',
                    tagline: 'Data integration and analytics for defense',
                    description: 'Empowering operators with actionable intelligence.',
                    website: 'https://palantir.com',
                    missionAreas: ['Data Analytics', 'AI/ML'],
                    ctas: ['C2', 'Intelligence']
                }
            ]
        },
        {
            id: 'cohort-2',
            name: 'Cohort 2 - Fall 2024',
            companies: [
                {
                    id: 'company-4',
                    name: 'Rebellion Defense',
                    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&h=200&fit=crop',
                    tagline: 'AI for national security decision-making',
                    description: 'Accelerating mission-critical decisions with AI.',
                    website: 'https://rebelliondefense.com',
                    missionAreas: ['AI/ML', 'Cyber'],
                    ctas: ['Decision Support', 'Cyber Defense']
                },
                {
                    id: 'company-5',
                    name: 'Hadrian',
                    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
                    tagline: 'Automated manufacturing for defense hardware',
                    description: 'Rebuilding the defense industrial base with autonomy.',
                    website: 'https://hadrian.co',
                    missionAreas: ['Manufacturing', 'Supply Chain'],
                    ctas: ['Precision Manufacturing', 'Defense Production']
                },
                {
                    id: 'company-6',
                    name: 'Epirus',
                    logo: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=200&h=200&fit=crop',
                    tagline: 'High-power microwave systems',
                    description: 'Directed energy for counter-drone and electronic warfare.',
                    website: 'https://epirusinc.com',
                    missionAreas: ['Directed Energy', 'Counter-UAS'],
                    ctas: ['EW', 'Base Defense']
                }
            ]
        }
    ]
};

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

    try {
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
    } catch (error) {
        // In development, fall back to mock data if API is unavailable
        if (location.hostname === 'localhost') {
            console.warn('[Builders] API unavailable, using mock data:', error.message);
            return MOCK_DATA;
        }
        throw error;
    }
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
