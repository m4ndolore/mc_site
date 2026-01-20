// js/builders/api.js
// API client for fetching builder data from SigmaBlox public API

/**
 * Mock data for local development when backend is unavailable
 */
const MOCK_DATA = {
    companies: [
        {
            airtableId: 'company-1',
            companyName: 'ShieldAI',
            productName: 'Hivemind',
            logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
            problemStatement: 'AI-powered autonomous systems for defense',
            description: 'Building intelligent systems that protect service members and civilians.',
            website: 'https://shield.ai',
            missionArea: 'Autonomy',
            secondaryMissions: ['ISR'],
            warfareDomain: 'Air',
            trlLevel: '7',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-2',
            companyName: 'Anduril Industries',
            productName: 'Lattice',
            logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop',
            problemStatement: 'Transforming defense capabilities through technology',
            description: 'Bringing Silicon Valley innovation to national security.',
            website: 'https://anduril.com',
            missionArea: 'Autonomy',
            secondaryMissions: ['C2'],
            warfareDomain: 'Multi-Domain',
            trlLevel: '8',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-3',
            companyName: 'Palantir Technologies',
            productName: 'Gotham',
            logoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop',
            problemStatement: 'Data integration and analytics for defense',
            description: 'Empowering operators with actionable intelligence.',
            website: 'https://palantir.com',
            missionArea: 'Intelligence',
            secondaryMissions: ['C2'],
            warfareDomain: 'Cyber',
            trlLevel: '9',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-4',
            companyName: 'Rebellion Defense',
            productName: 'Nova',
            logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&h=200&fit=crop',
            problemStatement: 'AI for national security decision-making',
            description: 'Accelerating mission-critical decisions with AI.',
            website: 'https://rebelliondefense.com',
            missionArea: 'Intelligence',
            secondaryMissions: ['Cyber'],
            warfareDomain: 'Cyber',
            trlLevel: '6',
            fundingStage: 'Series B',
            cohort: 'Cohort 2'
        },
        {
            airtableId: 'company-5',
            companyName: 'Hadrian',
            productName: 'Automated Manufacturing',
            logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
            problemStatement: 'Automated manufacturing for defense hardware',
            description: 'Rebuilding the defense industrial base with autonomy.',
            website: 'https://hadrian.co',
            missionArea: 'Logistics',
            secondaryMissions: [],
            warfareDomain: 'Ground',
            trlLevel: '7',
            fundingStage: 'Series B',
            cohort: 'Cohort 2'
        },
        {
            airtableId: 'company-6',
            companyName: 'Epirus',
            productName: 'Leonidas',
            logoUrl: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=200&h=200&fit=crop',
            problemStatement: 'High-power microwave systems for counter-drone',
            description: 'Directed energy for counter-drone and electronic warfare.',
            website: 'https://epirusinc.com',
            missionArea: 'Fires',
            secondaryMissions: ['C2'],
            warfareDomain: 'Air',
            trlLevel: '8',
            fundingStage: 'Series C+',
            cohort: 'Cohort 2'
        }
    ],
    pagination: {
        total: 6,
        limit: 100,
        offset: 0,
        hasMore: false
    }
};

const MOCK_FILTERS = {
    missionAreas: ['Autonomy', 'C2', 'Cyber', 'Fires', 'Intelligence', 'ISR', 'Logistics', 'Space'],
    warfareDomains: ['Air', 'Cyber', 'Ground', 'Maritime', 'Multi-Domain', 'Space'],
    fundingStages: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+']
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
 * @param {Object} options - Query options
 * @param {string} options.missionArea - Filter by mission area
 * @param {string} options.search - Search query
 * @param {number} options.limit - Max results
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<{companies: Array, pagination: Object}>}
 */
export async function fetchCompanies(options = {}) {
    if (shouldUseMockData()) {
        console.warn('[Builders] Using mock data for local development');
        return MOCK_DATA;
    }

    const apiBase = getApiBase();
    const params = new URLSearchParams();

    if (options.missionArea) params.set('missionArea', options.missionArea);
    if (options.search) params.set('search', options.search);
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

        return response.json();
    } catch (error) {
        console.error('[Builders] API error:', error.message);
        // Fall back to mock data on error in development
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
 * This maps API field names to the format expected by components
 * @param {Object} company - Raw company from API
 * @returns {Object} - Normalized company object
 */
export function normalizeCompany(company) {
    // Build mission areas array from primary + secondary
    const missionAreas = [];
    if (company.missionArea) missionAreas.push(company.missionArea);
    if (company.secondaryMissions && Array.isArray(company.secondaryMissions)) {
        missionAreas.push(...company.secondaryMissions);
    }

    // Build display name (company: product if both exist)
    const displayName = company.productName
        ? `${company.companyName}: ${company.productName}`
        : company.companyName;

    return {
        id: company.airtableId || company._id,
        name: company.companyName || 'Unknown',
        productName: company.productName || '',
        displayName,
        logo: company.logoUrl || null,
        tagline: company.problemStatement || company.description || '',
        description: company.description || company.problemStatement || '',
        website: company.website || '',
        missionAreas,
        primaryMission: company.missionArea || '',
        warfareDomain: company.warfareDomain || '',
        trlLevel: company.trlLevel || '',
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
