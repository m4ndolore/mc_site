// js/portfolio/index.js
// Portfolio page - displays companies from seeded data with category filtering

/**
 * Path to build-time seeded company data
 */
const SEEDED_DATA_PATH = '/data/companies.json';

/**
 * State
 */
let allCompanies = [];
let currentFilter = 'all';

/**
 * DOM Elements
 */
const filterContainer = document.querySelector('.filter-tags');
const gridContainer = document.querySelector('.portfolio-grid__wrapper');
const featuredCard = document.querySelector('.featured-card');
const resultsCount = document.getElementById('portfolio-count');

/**
 * Category mapping - maps mission areas to filter categories
 */
const CATEGORY_MAP = {
    'Autonomy': 'autonomy',
    'ISR': 'isr',
    'Intel and Battlespace Awareness': 'isr',
    'Intelligence': 'isr',
    'Logistics': 'logistics',
    'Cyber': 'cyber',
    'Command and Control': 'c2',
    'C2': 'c2',
    'Fires': 'autonomy',
    'Joint Fires (Offense)': 'autonomy'
};

/**
 * Get category for a company based on mission area
 * @param {Object} company
 * @returns {string[]} Array of categories
 */
function getCategories(company) {
    const categories = new Set();

    if (company.missionArea) {
        const cat = CATEGORY_MAP[company.missionArea];
        if (cat) categories.add(cat);
    }

    if (company.secondaryMissions && Array.isArray(company.secondaryMissions)) {
        company.secondaryMissions.forEach(mission => {
            const cat = CATEGORY_MAP[mission];
            if (cat) categories.add(cat);
        });
    }

    return Array.from(categories);
}

/**
 * Render a portfolio card
 * @param {Object} company
 * @returns {string} HTML string
 */
function renderPortfolioCard(company) {
    const categories = getCategories(company);
    const categoryAttr = categories.join(' ');
    const primaryCategory = categories[0] || 'autonomy';

    // Build display name
    const displayName = company.productName
        ? `${company.companyName}: ${company.productName}`
        : company.companyName;

    // Build tags HTML
    const tagsHtml = categories.map(cat =>
        `<span class="case-tag case-tag--${cat}">${cat.toUpperCase()}</span>`
    ).join('');

    return `
        <article class="portfolio-card" data-category="${categoryAttr}" data-id="${company.airtableId || company.id}">
            <div class="portfolio-card__visual">
                <div class="portfolio-card__gradient portfolio-card__gradient--${primaryCategory}"></div>
                <div class="portfolio-card__pattern"></div>
            </div>
            <div class="portfolio-card__content">
                <h3 class="portfolio-card__title">${escapeHtml(displayName)}</h3>
                <p class="portfolio-card__description">
                    ${escapeHtml(company.problemStatement || company.description || '')}
                </p>
                <div class="portfolio-card__tags">
                    ${tagsHtml}
                </div>
                ${company.website ? `
                <a href="${escapeHtml(company.website)}" class="portfolio-card__link" target="_blank" rel="noopener">
                    External Site
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </a>
                ` : ''}
            </div>
        </article>
    `;
}

/**
 * Render the featured card (first/most prominent company)
 * @param {Object} company
 */
function renderFeaturedCard(company) {
    if (!featuredCard || !company) return;

    const categories = getCategories(company);
    const categoryAttr = categories.join(' ');

    // Update data attribute for filtering
    featuredCard.setAttribute('data-category', categoryAttr);

    // Update content
    const titleEl = featuredCard.querySelector('.featured-card__title');
    const descEl = featuredCard.querySelector('.featured-card__description');
    const tagsEl = featuredCard.querySelector('.featured-card__tags');

    if (titleEl) {
        titleEl.textContent = company.productName
            ? `${company.companyName}: ${company.productName}`
            : company.companyName;
    }

    if (descEl) {
        descEl.textContent = company.description || company.problemStatement || '';
    }

    if (tagsEl) {
        tagsEl.innerHTML = categories.map(cat =>
            `<span class="case-tag case-tag--${cat}">${cat.toUpperCase()}</span>`
        ).join('');
    }
}

/**
 * Render all portfolio cards
 * @param {Array} companies
 */
function renderPortfolioGrid(companies) {
    if (!gridContainer) return;

    // Skip first company (used for featured)
    const gridCompanies = companies.slice(1);

    if (gridCompanies.length === 0) {
        gridContainer.innerHTML = `
            <div class="portfolio-empty">
                <p>No results</p>
            </div>
        `;
        return;
    }

    gridContainer.innerHTML = gridCompanies.map(renderPortfolioCard).join('');
}

/**
 * Update results count
 * @param {number} visible
 * @param {number} total
 */
function updateResultsCount(visible, total) {
    if (!resultsCount) return;
    resultsCount.textContent = `${visible} of ${total} records`;
}

/**
 * Apply filter to cards
 * @param {string} filter
 */
function applyFilter(filter) {
    currentFilter = filter;

    // Update filter button states
    if (filterContainer) {
        filterContainer.querySelectorAll('.filter-tag').forEach(btn => {
            btn.classList.toggle('filter-tag--active', btn.dataset.filter === filter);
        });
    }

    // Filter featured card
    if (featuredCard) {
        const categories = featuredCard.dataset.category?.split(' ') || [];
        const showFeatured = filter === 'all' || categories.includes(filter);
        featuredCard.style.display = showFeatured ? '' : 'none';
    }

    // Filter grid cards
    let visibleCount = featuredCard?.style.display !== 'none' ? 1 : 0;

    if (gridContainer) {
        gridContainer.querySelectorAll('.portfolio-card').forEach(card => {
            const categories = card.dataset.category?.split(' ') || [];
            const show = filter === 'all' || categories.includes(filter);
            card.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });
    }

    updateResultsCount(visibleCount, allCompanies.length);
}

/**
 * Setup filter event listeners
 */
function setupFilters() {
    if (!filterContainer) return;

    filterContainer.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.dataset.filter);
        });
    });
}

/**
 * Load company data from seeded JSON
 * @returns {Promise<Array>}
 */
async function loadCompanies() {
    try {
        const response = await fetch(SEEDED_DATA_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status}`);
        }

        const data = await response.json();
        return data.companies || [];
    } catch (error) {
        console.error('[Portfolio] Failed to load companies:', error.message);
        return [];
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Initialize portfolio page
 */
async function init() {
    console.log('[Portfolio] Initializing...');

    // Load companies
    allCompanies = await loadCompanies();
    console.log('[Portfolio] Loaded', allCompanies.length, 'companies');

    if (allCompanies.length === 0) {
        console.warn('[Portfolio] No company data available');
        return;
    }

    // Render featured card (first company)
    renderFeaturedCard(allCompanies[0]);

    // Render grid
    renderPortfolioGrid(allCompanies);

    // Setup filter listeners
    setupFilters();

    // Update initial count
    updateResultsCount(allCompanies.length, allCompanies.length);

    console.log('[Portfolio] Initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
