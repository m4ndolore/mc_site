// js/builders/api.js
// API client for fetching builder data from SigmaBlox public API
// Supports: 1) Live API, 2) Build-time seeded static JSON, 3) Mock data fallback

import { handleApiResponse, clearAuthCache, redirectToLogin } from './auth.js';

/**
 * Default retry configuration for exponential backoff
 */
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    retryableStatuses: [429, 500, 502, 503, 504]
};

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelayMs - Base delay in milliseconds
 * @param {number} maxDelayMs - Maximum delay cap
 * @returns {number} - Delay in milliseconds
 */
function calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs) {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    // Add jitter (0-25% of delay) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * Math.random();
    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Fetch with exponential backoff retry logic for rate limiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryConfig - Retry configuration
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retryConfig = {}) {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // Check if we should retry this response
            if (config.retryableStatuses.includes(response.status) && attempt < config.maxRetries) {
                // Check for Retry-After header
                const retryAfter = response.headers.get('Retry-After');
                let delayMs;

                if (retryAfter) {
                    // Retry-After can be seconds or HTTP-date
                    const retryAfterSeconds = parseInt(retryAfter, 10);
                    if (!isNaN(retryAfterSeconds)) {
                        delayMs = retryAfterSeconds * 1000;
                    } else {
                        // Parse HTTP-date
                        const retryDate = new Date(retryAfter);
                        delayMs = Math.max(0, retryDate.getTime() - Date.now());
                    }
                    // Cap at maxDelay
                    delayMs = Math.min(delayMs, config.maxDelayMs);
                } else {
                    delayMs = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
                }

                console.log(`[Builders] Rate limited (${response.status}), retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${config.maxRetries})`);
                await sleep(delayMs);
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;

            // Network errors are retryable
            if (attempt < config.maxRetries) {
                const delayMs = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
                console.log(`[Builders] Network error, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${config.maxRetries})`);
                await sleep(delayMs);
                continue;
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
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
 * Load seeded data from build-time generated JSON
 * @returns {Promise<Object|null>} Seeded data or null if unavailable
 */
async function loadSeededData() {
    try {
        const response = await fetch('/data/companies.json');
        if (!response.ok) return null;
        const data = await response.json();
        // Validate seeded data has companies
        if (data.companies && data.companies.length > 0) {
            console.log(`[Builders] Loaded seeded data: ${data.companies.length} companies`);
            return data;
        }
        return null;
    } catch (error) {
        console.log('[Builders] No seeded data available');
        return null;
    }
}

/**
 * Fetch companies from public API
 * Priority:
 *   - Localhost: 1) Seeded data, 2) Mock data fallback (no live API)
 *   - Production: 1) Live API, 2) Seeded data fallback
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
    // In local development with useMockData=true, use mock data directly
    if (shouldUseMockData()) {
        console.warn('[Builders] Using mock data for local development');
        return MOCK_DATA;
    }

    // On localhost, prioritize seeded data to avoid CORS errors
    if (location.hostname === 'localhost') {
        const seeded = await loadSeededData();
        if (seeded) {
            return seeded;
        }
        // Fall back to mock data if no seeded data
        console.warn('[Builders] No seeded data, using mock data fallback');
        return MOCK_DATA;
    }

    // Production: try live API first
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
        const response = await fetchWithRetry(url, {
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

        // Check for empty data - use seeded fallback
        if (!data.companies || data.companies.length === 0) {
            console.warn('[Builders] API returned empty data, trying seeded fallback');
            const seeded = await loadSeededData();
            if (seeded) return seeded;
        }

        return data;
    } catch (error) {
        // Live API failed, try seeded data fallback
        console.warn('[Builders] API failed, trying seeded fallback:', error.message);
        const seeded = await loadSeededData();
        if (seeded) return seeded;

        // No seeded data, throw original error
        throw error;
    }
}

/**
 * Fetch available filter options from API
 * Priority:
 *   - Localhost: Use mock filters (no API call)
 *   - Production: 1) Live API, 2) Mock filters fallback
 * @returns {Promise<{missionAreas: Array, warfareDomains: Array, fundingStages: Array}>}
 */
export async function fetchFilterOptions() {
    if (shouldUseMockData()) {
        console.warn('[Builders] Using mock filter data');
        return MOCK_FILTERS;
    }

    // On localhost, use mock filters to avoid CORS/network delays
    if (location.hostname === 'localhost') {
        console.log('[Builders] Using mock filters (localhost)');
        return MOCK_FILTERS;
    }

    // Production: try live API
    const apiBase = getApiBase();

    try {
        const response = await fetchWithRetry(`${apiBase}/api/public/companies/filters`, {
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
        return MOCK_FILTERS;
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

    const response = await fetchWithRetry(`${apiBase}/api/public/companies/${encodeURIComponent(id)}`, {
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
 * Fetch from private API endpoint (requires authentication)
 * Handles 401/403 responses by redirecting to login
 * Uses exponential backoff for rate limiting (excludes 401/403 from retry)
 *
 * @param {string} endpoint - API endpoint path (e.g., '/api/members')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export async function fetchPrivateApi(endpoint, options = {}) {
    const apiBase = getApiBase();
    const url = `${apiBase}${endpoint}`;

    // Don't retry 401/403 for private endpoints - those need re-auth
    const response = await fetchWithRetry(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            ...options.headers
        },
        ...options
    }, {
        retryableStatuses: [429, 500, 502, 503, 504] // Exclude 401/403
    });

    // Handle auth errors - redirect to login on 401/403
    handleApiResponse(response, { redirectOn401: true, redirectOn403: true });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Build logo URL from stored logo or fall back to logoUrl
 * storedLogoId indicates a permanent logo exists; served via /api/logo/:companyId
 * The logo endpoint uses legacyAirtableId or id, not the storedLogoId itself
 * @param {Object} company - Raw company from API
 * @returns {string|null} - Logo URL or null
 */
function getLogoUrl(company) {
    // Prefer stored logo (permanent) over Airtable URL (expires)
    // Logo endpoint uses company ID (legacyAirtableId or id), not storedLogoId
    if (company.storedLogoId) {
        const apiBase = getApiBase();
        const companyId = company.legacyAirtableId || company.id || company.airtableId;
        if (companyId) {
            return `${apiBase}/api/logo/${companyId}`;
        }
    }
    return company.logoUrl || null;
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

    // Preserve timestamps when provided by the API so downstream views (e.g., dashboard)
    // can compute recent activity windows without relying on fragile field names.
    const createdAt =
        company.createdAt ||
        company.created_at ||
        company.created ||
        company.createdTime ||
        null;
    const updatedAt =
        company.updatedAt ||
        company.updated_at ||
        company.updated ||
        company.lastModified ||
        null;

    return {
        id: companyId,
        name: companyName,
        productName: company.productName || '',
        displayName,
        logo: getLogoUrl(company),
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
        cohortId: company.cohortId || '',
        tulsaAttended: company.tulsaAttended || '',
        upvoteCount: company.upvoteCount || 0,
        founders: company.founders || '',
        location: company.location || '',
        createdAt,
        updatedAt
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

export function extractCompanies(data, options = {}) {
    const { filterAttended = true } = options;

    let companies = [];

    // Handle both old cohorts format and new companies format
    if (data.companies) {
        companies = normalizeCompanies(data.companies);
    } else if (Array.isArray(data)) {
        // Legacy cohorts format
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
        companies = Array.from(companiesMap.values());
    }

    // Filter to only show companies that attended SigmaBlox 25-1 by default
    if (filterAttended) {
        companies = companies.filter(c => c.tulsaAttended === 'Attended');
    }

    return companies;
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

/**
 * Upvote a company
 * @param {string} companyId - Company ID to upvote
 * @returns {Promise<{id: string, name: string, upvoteCount: number}>}
 */
export async function upvoteCompany(companyId) {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/public/companies/${encodeURIComponent(companyId)}/upvote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to upvote: ${response.status}`);
    }

    return response.json();
}
