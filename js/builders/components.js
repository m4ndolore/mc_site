// js/builders/components.js
// UI components for builder directory

/**
 * Render a builder card (YC Launches style with rocket upvote)
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderCard(company) {
    // Random upvote count for demo (will be replaced with real data)
    const upvoteCount = company.upvotes || Math.floor(Math.random() * 50) + 5;

    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="builder-card__logo">`
        : `<div class="builder-card__logo-placeholder">${escapeHtml(company.name.charAt(0))}</div>`;

    const missionTags = (company.missionAreas || []).slice(0, 2)
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const techTags = (company.ctas || []).slice(0, 1)
        .map(c => `<span class="builder-tag tech">${escapeHtml(c)}</span>`)
        .join('');

    const cohortTag = company.cohort
        ? `<span class="builder-tag cohort">${escapeHtml(company.cohort)}</span>`
        : '';

    return `
        <article class="builder-card" data-id="${escapeHtml(company.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(company.name)} details">
            <div class="builder-card__upvote">
                <button class="builder-card__upvote-btn" onclick="event.stopPropagation(); this.classList.toggle('upvoted');" aria-label="Upvote ${escapeHtml(company.name)}">
                    <span class="rocket-icon">🚀</span>
                </button>
                <span class="builder-card__upvote-count">${upvoteCount}</span>
            </div>
            ${logoHtml}
            <div class="builder-card__content">
                <h3 class="builder-card__name">${escapeHtml(company.name)}</h3>
                <p class="builder-card__tagline">${escapeHtml(company.tagline)}</p>
                <div class="builder-card__tags">
                    ${missionTags}
                    ${techTags}
                    ${cohortTag}
                </div>
            </div>
        </article>
    `;
}

/**
 * Render the modal content for a company
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderModal(company) {
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="modal-logo">`
        : `<div class="modal-logo" style="display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;background:linear-gradient(135deg,#667eea,#764ba2);">${escapeHtml(company.name.charAt(0))}</div>`;

    const websiteUrl = company.website || '';
    const websiteDisplay = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const websiteHtml = websiteUrl
        ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener" class="modal-website">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            ${escapeHtml(websiteDisplay)}
           </a>`
        : '';

    const missionTags = (company.missionAreas || [])
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const techTags = (company.ctas || [])
        .map(c => `<span class="builder-tag tech">${escapeHtml(c)}</span>`)
        .join('');

    // Build sections
    const descriptionSection = `
        <div class="modal-section">
            <h4 class="modal-section-title">About</h4>
            <p>${escapeHtml(company.description || company.tagline)}</p>
        </div>
    `;

    const missionSection = missionTags ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Mission Areas</h4>
            <div class="modal-tags">${missionTags}</div>
        </div>
    ` : '';

    const techSection = techTags ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Technology Areas</h4>
            <div class="modal-tags">${techTags}</div>
        </div>
    ` : '';

    // CTA box - always shown to drive logins
    const ctaBox = `
        <div class="modal-cta-box">
            <div class="modal-cta-box__icon">🔒</div>
            <h4 class="modal-cta-box__title">Want to learn more?</h4>
            <p class="modal-cta-box__text">
                Login to access pitch decks, team details, and connect directly with founders.
            </p>
            <div class="modal-cta-box__actions">
                <a href="https://app.mergecombinator.com/login" class="modal-cta-btn modal-cta-btn--primary">
                    Login to Access
                </a>
                ${websiteUrl ? `
                    <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener" class="modal-cta-btn modal-cta-btn--secondary">
                        Visit Website →
                    </a>
                ` : ''}
            </div>
        </div>
    `;

    return `
        <div class="modal-header">
            ${logoHtml}
            <div class="modal-title-section">
                <h2 class="modal-title">${escapeHtml(company.name)}</h2>
                <div class="modal-cohort">${escapeHtml(company.cohort || '')}</div>
                ${websiteHtml}
            </div>
        </div>
        <div class="modal-body">
            ${descriptionSection}
            ${missionSection}
            ${techSection}
        </div>
        ${ctaBox}
    `;
}

/**
 * Render empty state
 * @returns {string} - HTML string
 */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No matching builders</h3>
            <p>Modify filters or clear search to see results.</p>
        </div>
    `;
}

/**
 * Render loading state
 * @returns {string} - HTML string
 */
export function renderLoadingState() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading builders...</p>
        </div>
    `;
}

/**
 * Render error state
 * @param {string} message - Error message
 * @returns {string} - HTML string
 */
export function renderErrorState(message) {
    return `
        <div class="empty-state">
            <h3>Failed to load builders</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
