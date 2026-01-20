// js/builders/api.js
// API client for fetching builder data from SigmaBlox public API
// Supports: 1) Live API, 2) Build-time seeded static JSON, 3) Mock data fallback

/**
 * Path to build-time seeded company data
 */
const SEEDED_DATA_PATH = '/data/companies.json';

/**
 * Cached seeded data (loaded once)
 */
let seededDataCache = null;

/**
 * Load build-time seeded data from static JSON
 * @returns {Promise<Object|null>}
 */
async function loadSeededData() {
    if (seededDataCache !== null) {
        return seededDataCache;
    }

    try {
        const response = await fetch(SEEDED_DATA_PATH);
        if (!response.ok) {
            console.log('[Builders] No seeded data available');
            seededDataCache = false; // Mark as unavailable
            return null;
        }

        const data = await response.json();
        if (data.companies && data.companies.length > 0) {
            console.log('[Builders] Loaded seeded data:', data.companies.length, 'companies');
            seededDataCache = data;
            return data;
        }

        console.log('[Builders] Seeded data empty');
        seededDataCache = false;
        return null;
    } catch (error) {
        console.log('[Builders] Failed to load seeded data:', error.message);
        seededDataCache = false;
        return null;
    }
}

/**
 * Mock data for local development when backend is unavailable
 * Matches API spec format: id, name, productName, etc.
 */
const MOCK_DATA = {
    companies: [
        {
            id: 'mock-001',
            name: 'ShieldAI',
            productName: 'Hivemind',
            logoUrl: null,
            location: 'San Diego, CA',
            missionArea: 'Intel and Battlespace Awareness',
            warfareDomain: 'Air',
            description: 'AI-powered autonomous systems for defense. Building intelligent systems that protect service members and civilians.',
            trlLevel: 7,
            fundingStage: 'Series Funding',
            teamSize: '500+'
        },
        {
            id: 'mock-002',
            name: 'Anduril Industries',
            productName: 'Lattice',
            logoUrl: null,
            location: 'Costa Mesa, CA',
            missionArea: 'Command and Control',
            warfareDomain: 'Multi',
            description: 'Transforming defense capabilities through technology. Bringing Silicon Valley innovation to national security.',
            trlLevel: 8,
            fundingStage: 'Series Funding',
            teamSize: '1000+'
        },
        {
            id: 'mock-003',
            name: 'Palantir Technologies',
            productName: 'Gotham',
            logoUrl: null,
            location: 'Denver, CO',
            missionArea: 'Intel and Battlespace Awareness',
            warfareDomain: 'Cyber',
            description: 'Data integration and analytics for defense. Empowering operators with actionable intelligence.',
            trlLevel: 9,
            fundingStage: 'Series Funding',
            teamSize: '1000+'
        },
        {
            id: 'mock-004',
            name: 'Rebellion Defense',
            productName: 'Nova',
            logoUrl: null,
            location: 'Washington, DC',
            missionArea: 'Intel and Battlespace Awareness',
            warfareDomain: 'Cyber',
            description: 'AI for national security decision-making. Accelerating mission-critical decisions with AI.',
            trlLevel: 6,
            fundingStage: 'Series Funding',
            teamSize: '100-500'
        },
        {
            id: 'mock-005',
            name: 'Hadrian',
            productName: 'Automated Manufacturing',
            logoUrl: null,
            location: 'Torrance, CA',
            missionArea: 'Logistics',
            warfareDomain: 'Land',
            description: 'Automated manufacturing for defense hardware. Rebuilding the defense industrial base with autonomy.',
            trlLevel: 7,
            fundingStage: 'Series Funding',
            teamSize: '100-500'
        },
        {
            id: 'mock-006',
            name: 'Epirus',
            productName: 'Leonidas',
            logoUrl: null,
            location: 'Torrance, CA',
            missionArea: 'Joint Fires (Offense)',
            warfareDomain: 'Air',
            description: 'High-power microwave systems for counter-drone. Directed energy for counter-drone and electronic warfare.',
            trlLevel: 8,
            fundingStage: 'Series Funding',
            teamSize: '100-500'
        }
    ],
    total: 6,
    limit: 50,
    offset: 0
};

/**
 * Mock filter options matching API spec
 */
const MOCK_FILTERS = {
    missionAreas: [
        'Administration',
        'Command and Control',
        'Comm',
        'Cyber',
        'Force Protection (Defense)',
        'Information',
        'Intel and Battlespace Awareness',
        'Joint Fires (Offense)',
        'Logistics',
        'Maintenance',
        'Planning'
    ],
    warfareDomains: ['Air', 'Cyber', 'Information', 'Land', 'Multi', 'Sea', 'Space'],
    fundingStages: ['Angel / Private', 'Bootstrapped', 'Grant Funded', 'Series Funding'],
    cohorts: ['Cohort 1', 'Cohort 2', 'Cohort 3']
};

/**
 * Get the API base URL from config
 */
function getApiBase() {
    if (window.MCBuildersConfig && window.MCBuildersConfig.apiBase) {
        return window.MCBuildersConfig.apiBase;
    }
    // Fallback for production
    return 'https://api.sigmablox.com';
}

/**
 * Check if we should use mock data (local development)
 */
function shouldUseMockData() {
    return window.MCBuildersConfig?.useMockData === true ||
           (location.hostname === 'localhost' && !window.MCBuildersConfig?.apiBase);
}

/**
 * Fetch companies from public API
 * Priority: 1) Live API (if configured), 2) Seeded static data, 3) Mock data
 *
 * API spec: https://api.sigmablox.com/api/public/companies
 * Returns: { companies: [], total: number, limit: number, offset: number }
 *
 * @param {Object} options - Query options
 * @param {string} options.missionArea - Filter by mission area
 * @param {string} options.warfareDomain - Filter by warfare domain
 * @param {string} options.fundingStage - Filter by funding stage
 * @param {number} options.limit - Max results (default 50, max 100)
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<{companies: Array, total: number, limit: number, offset: number}>}
 */
export async function fetchCompanies(options = {}) {
    // In local development, use mock data
    if (shouldUseMockData()) {
        console.warn('[Builders] Using mock data for local development');
        return MOCK_DATA;
    }

    const apiBase = getApiBase();
    const params = new URLSearchParams();

    // Query parameters per API spec
    if (options.missionArea) params.set('missionArea', options.missionArea);
    if (options.warfareDomain) params.set('warfareDomain', options.warfareDomain);
    if (options.fundingStage) params.set('fundingStage', options.fundingStage);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${apiBase}/api/public/companies${queryString ? '?' + queryString : ''}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch companies: ${response.status}`);
        }

        const data = await response.json();

        // Check for application-level errors (API returns 200 but with error)
        if (data.error) {
            throw new Error(`API error: ${data.error}`);
        }

        return data;
    } catch (error) {
        console.error('[Builders] API error:', error.message);

        // Try seeded static data first (build-time cached)
        const seededData = await loadSeededData();
        if (seededData && seededData.companies && seededData.companies.length > 0) {
            console.log('[Builders] Falling back to seeded data');
            return {
                companies: seededData.companies,
                total: seededData.total || seededData.companies.length,
                limit: seededData.limit || 100,
                offset: seededData.offset || 0
            };
        }

        // Fall back to mock data on localhost
        if (location.hostname === 'localhost') {
            console.warn('[Builders] Falling back to mock data');
            return MOCK_DATA;
        }

        throw error;
    }
}

/**
 * Fetch available filter options from API
 * @returns {Promise<{missionAreas: Array, warfareDomains: Array, fundingStages: Array}>}
 */
export async function fetchFilterOptions() {
    if (shouldUseMockData()) {
        console.warn('[Builders] Using mock filter data');
        return MOCK_FILTERS;
    }

    const apiBase = getApiBase();

    try {
        const response = await fetch(`${apiBase}/api/public/companies/filters`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch filters: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('[Builders] Failed to fetch filters:', error.message);
        // Fall back to mock filters
        if (location.hostname === 'localhost') {
            return MOCK_FILTERS;
        }
        throw error;
    }
}

/**
 * Fetch a single company by ID
 * @param {string} id - Company airtableId
 * @returns {Promise<Object>}
 */
export async function fetchCompanyById(id) {
    if (shouldUseMockData()) {
        const company = MOCK_DATA.companies.find(c => c.airtableId === id);
        if (!company) throw new Error('Company not found');
        return company;
    }

    const apiBase = getApiBase();

    const response = await fetch(`${apiBase}/api/public/companies/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch company: ${response.status}`);
    }

    return response.json();
}

/**
 * Normalize company data from API to internal format
 * Handles both API format (id, name) and legacy format (airtableId, companyName)
 *
 * API spec fields: id, name, productName, website, logoUrl, location,
 * missionArea, warfareDomain, description, trlLevel, fundingStage, teamSize
 *
 * @param {Object} company - Raw company from API
 * @returns {Object} - Normalized company object
 */
export function normalizeCompany(company) {
    // Handle both API format (id, name) and legacy format (airtableId, companyName)
    const companyId = company.id || company.airtableId || company._id;
    const companyName = company.name || company.companyName || 'Unknown';

    // Build mission areas array from primary + secondary
    const missionAreas = [];
    if (company.missionArea) missionAreas.push(company.missionArea);
    if (company.secondaryMissions && Array.isArray(company.secondaryMissions)) {
        missionAreas.push(...company.secondaryMissions);
    }

    // Build display name (company: product if both exist)
    const displayName = company.productName
        ? `${companyName}: ${company.productName}`
        : companyName;

    return {
        id: companyId,
        name: companyName,
        productName: company.productName || '',
        displayName,
        logo: company.logoUrl || null,
        tagline: company.description || company.problemStatement || '',
        description: company.description || company.problemStatement || '',
        website: company.website || '',
        missionAreas,
        primaryMission: company.missionArea || '',
        warfareDomain: company.warfareDomain || '',
        trlLevel: company.trlLevel != null ? String(company.trlLevel) : '',
        fundingStage: company.fundingStage || '',
        teamSize: company.teamSize || '',
        videoUrl: company.videoLink || null,
        pitchUrl: company.pitchLink || null,
        cohort: company.cohort || '',
        founders: company.founders || '',
        location: company.location || ''
    };
}

/**
 * Normalize array of companies
 * @param {Array} companies - Raw companies from API
 * @returns {Array} - Normalized companies
 */
export function normalizeCompanies(companies) {
    return companies.map(normalizeCompany);
}

// Legacy exports for backwards compatibility
export { fetchCompanies as fetchCohorts };

export function extractCompanies(data) {
    // Handle both old cohorts format and new companies format
    if (data.companies) {
        return normalizeCompanies(data.companies);
    }
    // Legacy cohorts format
    if (Array.isArray(data)) {
        const companiesMap = new Map();
        for (const cohort of data) {
            if (!cohort.companies && !cohort.participants) continue;
            const items = cohort.companies || cohort.participants || [];
            for (const company of items) {
                const id = company.airtableId || company.id || company._id;
                if (!id || companiesMap.has(id)) continue;
                companiesMap.set(id, normalizeCompany({
                    ...company,
                    cohort: cohort.name || cohort.cohortName || cohort.id
                }));
            }
        }
        return Array.from(companiesMap.values());
    }
    return [];
}

export function extractFilterOptions(companies) {
    const missionAreas = new Set();
    const warfareDomains = new Set();
    const fundingStages = new Set();
    const cohorts = new Set();

    for (const company of companies) {
        if (company.missionAreas) {
            company.missionAreas.forEach(m => m && missionAreas.add(m));
        }
        if (company.primaryMission) {
            missionAreas.add(company.primaryMission);
        }
        if (company.warfareDomain) {
            warfareDomains.add(company.warfareDomain);
        }
        if (company.fundingStage) {
            fundingStages.add(company.fundingStage);
        }
        if (company.cohort) {
            cohorts.add(company.cohort);
        }
    }

    return {
        missionAreas: Array.from(missionAreas).sort(),
        warfareDomains: Array.from(warfareDomains).sort(),
        fundingStages: Array.from(fundingStages).sort(),
        cohorts: Array.from(cohorts).sort(),
        // Legacy alias
        ctas: Array.from(warfareDomains).sort()
    };
}
