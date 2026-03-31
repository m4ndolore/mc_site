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
    renderBuilderEditForm,
    renderEmptyState,
    renderLoadingState,
    renderErrorState,
    isAdmin
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
let staticGridHtml = null; // Preserved static HTML for filter reset

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
 * Format a timestamp for the status rail (date + time)
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
 * Create a human-readable summary of active filters
 * @param {Object} filters
 * @param {number} resultsCount
 * @returns {string}
 */
function summarizeFilters(filters, resultsCount) {
    const parts = [];
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.ctas && filters.ctas.length > 0) parts.push(filters.ctas.join(', '));
    if (filters.missionArea) parts.push(filters.missionArea);
    if (filters.warfareDomains && filters.warfareDomains.length > 0) {
        parts.push(filters.warfareDomains.join(', '));
    } else if (filters.warfareDomain) {
        parts.push(filters.warfareDomain);
    }
    if (filters.fundingStage) parts.push(filters.fundingStage);

    if (parts.length === 0) return 'Showing all companies';
    return `Filtered by ${parts.join(' + ')}`;
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
 * Enhance existing static cards with modal click handlers.
 * Static cards are <a> tags with data-company-id attributes injected at build time.
 * We add click interception so they open modals when JS data is available,
 * but preserve the link as a fallback if JS fails or data hasn't loaded.
 */
function enhanceStaticCards() {
    if (!grid) return;
    const staticCards = grid.querySelectorAll('a.builder-card[data-company-id]');
    if (staticCards.length === 0) return;

    staticCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const companyId = card.dataset.companyId;
            // Only intercept if we have JS data loaded for this company
            const company = allCompanies.find(c => c.id === companyId);
            if (company) {
                e.preventDefault();
                openModal(companyId);
            }
            // Otherwise let the <a> navigate to entity page
        });
    });
}

/**
 * Initialize the builder directory
 */
async function init() {
    // Detect if static cards exist from build-time injection
    const hasStaticCards = grid && grid.querySelectorAll('a.builder-card[data-company-id]').length > 0;

    // Preserve original static HTML so we can restore it when filters are cleared
    if (hasStaticCards) {
        staticGridHtml = grid.innerHTML;
    }

    // Only show loading spinner if no static content exists
    if (grid && !hasStaticCards) {
        grid.innerHTML = renderLoadingState();
    }

    // Check auth status in parallel with data fetch
    checkAuth().then(state => {
        authState = state;
        updateRailAuth(authState);
    }).catch(err => {
        console.warn('[Builders] Auth check failed:', err.message);
        updateRailAuth({ authenticated: false, user: null });
    });

    // Setup event listeners early so filters work immediately
    setupEventListeners();

    // If static cards exist, enhance them with modal handlers immediately
    if (hasStaticCards) {
        enhanceStaticCards();
    }

    try {
        // Fetch companies — prefers seeded/enriched data, falls back to API
        const data = await fetchCompanies();

        // Extract and normalize all companies (alumni + applicants)
        allCompanies = extractCompanies(data, { filterAttended: false });

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

        // Re-enhance static cards now that allCompanies is populated
        // (modal handlers now have data to render)
        if (hasStaticCards) {
            enhanceStaticCards();
            updateResultsCount(allCompanies.length);
            updateRailFilters(getFilterState(), allCompanies.length);
        } else {
            // No static cards — render JS cards
            renderBuilders(allCompanies);
            updateRailFilters(getFilterState(), allCompanies.length);
        }

    } catch (error) {
        console.error('[Builders] Failed to initialize:', error);
        // Only show error state if there are no static cards to fall back on
        if (grid && !hasStaticCards) {
            grid.innerHTML = renderErrorState(error.message);
        }
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
 * Check if any filters are actively set
 * @param {Object} filters
 * @returns {boolean}
 */
function hasActiveFilters(filters) {
    return !!(filters.search || filters.missionArea || filters.warfareDomain || filters.fundingStage || (filters.ctas && filters.ctas.length > 0) || (filters.warfareDomains && filters.warfareDomains.length > 0));
}

/**
 * Apply filters and re-render.
 * When filters are active, replaces static cards with filtered JS cards.
 * When filters are cleared, restores original static HTML if available.
 */
function applyFilters() {
    const filters = getFilterState();
    const filtered = filterCompanies(allCompanies, filters);
    updateRailRefresh();

    if (!hasActiveFilters(filters) && staticGridHtml) {
        // Filters cleared — restore static cards
        if (grid) grid.innerHTML = staticGridHtml;
        enhanceStaticCards();
        updateResultsCount(allCompanies.length);
        updateRailFilters(filters, allCompanies.length);
    } else {
        // Filters active — render JS cards for filtered set
        renderBuilders(filtered);
    }
}

/**
 * Open the modal for a company
 * @param {string} companyId - Company ID
 */
function openModal(companyId) {
    currentCompany = allCompanies.find(c => c.id === companyId);
    if (!currentCompany) return;

    const adminUser = isAdmin(authState.user);

    // Pass auth state to modal renderer
    if (modalBody) {
        modalBody.innerHTML = renderBuilderModal(currentCompany, {
            authenticated: authState.authenticated,
            user: authState.user,
            isAdminUser: adminUser,
        });

        // Wire edit toggle for admins
        if (adminUser) {
            const editBtn = modalBody.querySelector('#modal-edit-toggle');
            if (editBtn) {
                editBtn.addEventListener('click', () => enterEditMode(currentCompany));
            }
        }
    }
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
}

/**
 * Switch modal to edit mode
 * @param {Object} company - Company to edit
 */
function enterEditMode(company) {
    if (!modalBody) return;
    modalBody.innerHTML = renderBuilderEditForm(company);

    // Wire CTA chip toggles
    const ctaContainer = modalBody.querySelector('#edit-cta-chips');
    const ctaHidden = modalBody.querySelector('#edit-ctas-value');
    if (ctaContainer && ctaHidden) {
        ctaContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.edit-cta-chip');
            if (!chip) return;
            chip.classList.toggle('active');
            const selected = Array.from(ctaContainer.querySelectorAll('.edit-cta-chip.active'))
                .map(c => c.dataset.cta);
            ctaHidden.value = JSON.stringify(selected);
        });
    }

    // Wire cancel
    const cancelBtn = modalBody.querySelector('#edit-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => openModal(company.id));
    }

    // Wire save
    const form = modalBody.querySelector('#company-edit-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusEl = modalBody.querySelector('#edit-status');
            const saveBtn = form.querySelector('.edit-form__save');

            const formData = new FormData(form);
            const payload = {};
            for (const [key, value] of formData.entries()) {
                if (key === 'ctas') {
                    payload.ctas = JSON.parse(value);
                } else if (key === 'trlLevel') {
                    payload.trlLevel = value ? parseInt(value, 10) : null;
                } else {
                    payload[key] = value || null;
                }
            }

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving\u2026';
            if (statusEl) { statusEl.textContent = ''; statusEl.className = 'edit-form__status'; }

            try {
                const res = await fetch(`https://api.mergecombinator.com/guild/companies/${company.id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.error?.message || `HTTP ${res.status}`);
                }

                const { data } = await res.json();

                // Update local state
                Object.assign(company, data.company);
                const idx = allCompanies.findIndex(c => c.id === company.id);
                if (idx >= 0) allCompanies[idx] = { ...allCompanies[idx], ...data.company };

                if (statusEl) {
                    statusEl.textContent = 'Saved.';
                    statusEl.classList.add('edit-form__status--ok');
                }
                saveBtn.textContent = 'Saved';

                // Return to view mode after brief delay
                setTimeout(() => openModal(company.id), 800);

            } catch (err) {
                if (statusEl) {
                    statusEl.textContent = err.message || 'Save failed.';
                    statusEl.classList.add('edit-form__status--err');
                }
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        });
    }
}

/**
 * Close the modal
 */
function closeModal() {
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
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

    // Filter dropdowns (filter-tech is the legacy domain select in builders.html)
    const filterIds = ['filter-mission', 'filter-funding', 'filter-tech'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // CTA chip multi-select (OR logic)
    const ctaContainer = document.getElementById('filter-cta-chips');
    if (ctaContainer) {
        ctaContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.builders-filters__chip');
            if (!chip) return;
            chip.classList.toggle('active');
            applyFilters();
        });
    }

    // Domain chip multi-select (OR logic)
    const domainsContainer = document.getElementById('filter-domains-multi');
    if (domainsContainer) {
        domainsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.domain-chip');
            if (!chip) return;
            chip.classList.toggle('active');
            applyFilters();
        });
    }

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
