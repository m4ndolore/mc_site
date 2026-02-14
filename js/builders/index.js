// js/builders/index.js
// Main entry point for builder directory

import {
    fetchCompanies,
    fetchFilterOptions,
    extractCompanies,
    extractFilterOptions,
    upvoteCompany
} from './api.js';
import {
    renderBuilderCard,
    renderBuilderModal,
    renderEmptyState,
    renderLoadingState,
    renderErrorState
} from './components.js';
import {
    filterCompanies,
    populateFilters,
    getFilterState,
    updateStats,
    updateResultsCount
} from './filters.js';
import { checkAuth } from './auth.js';

// State
let allCompanies = [];
let currentCompany = null;
let authState = { authenticated: false, user: null };
let totalBuildersCount = 0;

// DOM Elements
const grid = document.getElementById('builders-grid');
const modal = document.getElementById('builder-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const railAuthState = document.getElementById('builders-auth-state');
const railLastRefresh = document.getElementById('builders-last-refresh');
const railTotalCount = document.getElementById('builders-total-count');
const railFilterSummary = document.getElementById('builders-filter-summary');

/**
 * Format a timestamp for the status rail
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    } catch (error) {
        console.warn('[Builders] Failed to format time:', error);
        return '--:--:--';
    }
}

/**
 * Update auth status in the rail
 * @param {{authenticated: boolean, user: Object|null}} state
 */
function updateRailAuth(state) {
    if (!railAuthState) return;
    const label = state.authenticated ? 'Authenticated' : 'Anonymous';
    const actor = state.user?.email || state.user?.name || 'operator';
    railAuthState.textContent = `${label} (${actor})`;
}

/**
 * Update last refresh timestamp in the rail
 */
function updateRailRefresh() {
    if (!railLastRefresh) return;
    railLastRefresh.textContent = formatTime(new Date());
}

/**
 * Update total record count in the rail
 * @param {number} count
 */
function updateRailTotal(count) {
    if (!railTotalCount) return;
    railTotalCount.textContent = String(count);
}

/**
 * Create an operational summary of active filters
 * @param {Object} filters
 * @param {number} resultsCount
 * @returns {string}
 */
function summarizeFilters(filters, resultsCount) {
    const parts = [];
    if (filters.search) parts.push(`search=${filters.search}`);
    if (filters.missionArea) parts.push(`mission=${filters.missionArea}`);
    if (filters.warfareDomain) parts.push(`domain=${filters.warfareDomain}`);
    if (filters.fundingStage) parts.push(`stage=${filters.fundingStage}`);
    if (filters.cohort) parts.push(`cohort=${filters.cohort}`);

    const filterText = parts.length > 0 ? parts.join(' · ') : 'No filters applied.';
    return `${filterText} Results=${resultsCount}`;
}

/**
 * Update filter summary in the rail
 * @param {Object} filters
 * @param {number} resultsCount
 */
function updateRailFilters(filters, resultsCount) {
    if (!railFilterSummary) return;
    railFilterSummary.textContent = summarizeFilters(filters, resultsCount);
}

/**
 * Initialize the builder directory
 */
async function init() {
    // Show loading state
    if (grid) grid.innerHTML = renderLoadingState();

    // Check auth status in parallel with data fetch
    checkAuth().then(state => {
        authState = state;
        updateRailAuth(authState);
    }).catch(err => {
        console.warn('[Builders] Auth check failed:', err.message);
        updateRailAuth({ authenticated: false, user: null });
    });

    try {
        // Fetch companies from API
        const data = await fetchCompanies({ limit: 100 });

        // Extract and normalize companies (filter to only SigmaBlox attendees)
        allCompanies = extractCompanies(data, { filterAttended: true });

        // Try to get filter options from API, fall back to extracting from data
        let filterOptions;
        try {
            filterOptions = await fetchFilterOptions();
        } catch (filterError) {
            console.warn('[Builders] Filter API unavailable, extracting from data');
            filterOptions = extractFilterOptions(allCompanies);
        }

        // Update stats
        totalBuildersCount = data.total || allCompanies.length;
        updateStats({
            builders: totalBuildersCount,
            missionAreas: filterOptions.missionAreas?.length || 0,
            warfareDomains: filterOptions.warfareDomains?.length || 0,
            fundingStages: filterOptions.fundingStages?.length || 0,
            cohorts: filterOptions.cohorts?.length || 0,
            // Legacy support
            ctas: filterOptions.warfareDomains?.length || filterOptions.ctas?.length || 0
        });
        updateRailTotal(totalBuildersCount);
        updateRailRefresh();

        // Populate filter dropdowns
        populateFilters(filterOptions);

        // Render initial view
        renderBuilders(allCompanies);
        updateRailFilters(getFilterState(), allCompanies.length);

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('[Builders] Failed to initialize:', error);
        if (grid) grid.innerHTML = renderErrorState(error.message);
    }
}

/**
 * Render the builder cards
 * @param {Array} companies - Companies to render
 */
function renderBuilders(companies) {
    if (!grid) return;

    updateResultsCount(companies.length);
    updateRailFilters(getFilterState(), companies.length);

    if (companies.length === 0) {
        grid.innerHTML = renderEmptyState();
        return;
    }

    grid.innerHTML = companies.map(renderBuilderCard).join('');

    // Add click handlers to cards
    grid.querySelectorAll('.builder-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card.dataset.id);
            }
        });
    });

    // Add upvote button handlers
    grid.querySelectorAll('.builder-card__upvote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent card click
            const companyId = btn.dataset.companyId;
            if (!companyId) return;

            // Optimistically update UI
            btn.classList.add('upvoted');
            const countEl = btn.parentElement.querySelector('.builder-card__upvote-count');
            const currentCount = parseInt(countEl.textContent, 10) || 0;
            countEl.textContent = currentCount + 1;

            try {
                const result = await upvoteCompany(companyId);
                // Update with actual count from server
                countEl.textContent = result.upvoteCount;
                // Update local state
                const company = allCompanies.find(c => c.id === companyId);
                if (company) company.upvoteCount = result.upvoteCount;
            } catch (error) {
                console.error('Failed to upvote:', error);
                // Revert optimistic update on error
                btn.classList.remove('upvoted');
                countEl.textContent = currentCount;
            }
        });
    });
}

/**
 * Apply filters and re-render
 */
function applyFilters() {
    const filters = getFilterState();
    const filtered = filterCompanies(allCompanies, filters);
    updateRailRefresh();
    renderBuilders(filtered);
}

/**
 * Open the modal for a company
 * @param {string} companyId - Company ID
 */
function openModal(companyId) {
    currentCompany = allCompanies.find(c => c.id === companyId);
    if (!currentCompany) return;

    // Pass auth state to modal renderer
    if (modalBody) {
        modalBody.innerHTML = renderBuilderModal(currentCompany, {
            authenticated: authState.authenticated,
            user: authState.user
        });
    }
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the modal
 */
function closeModal() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCompany = null;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input (debounced)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 300);
        });
    }

    // Filter dropdowns - support both new and legacy IDs
    const filterIds = [
        'filter-mission',
        'filter-domain',
        'filter-funding',
        'filter-tech'  // Legacy
    ];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Modal close button
    if (modalClose) modalClose.addEventListener('click', closeModal);

    // Modal overlay click (close when clicking outside modal-content)
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
