// js/builders/components.js
// UI components for builder directory

/**
 * Render a builder card (YC Launches style with rocket upvote)
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderCard(company) {
    // Use real upvote count from API
    const upvoteCount = company.upvoteCount || 0;

    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="builder-card__logo">`
        : `<div class="builder-card__logo-placeholder">${escapeHtml(company.name.charAt(0))}</div>`;

    // Mission area tags
    const missionTags = (company.missionAreas || []).slice(0, 2)
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    // Warfare domain tag
    const domainTag = company.warfareDomain
        ? `<span class="builder-tag domain">${escapeHtml(company.warfareDomain)}</span>`
        : '';

    // TRL badge if available
    const trlBadge = company.trlLevel
        ? `<span class="builder-tag trl">TRL ${escapeHtml(company.trlLevel)}</span>`
        : '';

    // Cohort tag
    const cohortTag = company.cohort
        ? `<span class="builder-tag cohort">${escapeHtml(company.cohort)}</span>`
        : '';

    // Use displayName if available, otherwise name
    const displayName = company.displayName || company.name;

    return `
        <article class="builder-card" data-id="${escapeHtml(company.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(company.name)} details">
            <div class="builder-card__upvote">
                <button class="builder-card__upvote-btn" data-company-id="${escapeHtml(company.id)}" aria-label="Upvote ${escapeHtml(company.name)}">
                    <span class="track-icon">▲</span>
                </button>
                <span class="builder-card__upvote-count">${upvoteCount}</span>
            </div>
            ${logoHtml}
            <div class="builder-card__content">
                <h3 class="builder-card__name">${escapeHtml(displayName)}</h3>
                <p class="builder-card__tagline">${escapeHtml(company.tagline)}</p>
                <div class="builder-card__tags">
                    ${missionTags}
                    ${domainTag}
                    ${trlBadge}
                    ${cohortTag}
                </div>
            </div>
        </article>
    `;
}

/**
 * Render the modal content for a company
 * @param {Object} company - Company data
 * @param {Object} options - Render options
 * @param {boolean} options.authenticated - Whether user is authenticated
 * @param {Object} options.user - Current user info (if authenticated)
 * @returns {string} - HTML string
 */
export function renderBuilderModal(company, options = {}) {
    const { authenticated = false, user = null } = options;
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

    // Mission area tags
    const missionTags = (company.missionAreas || [])
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    // Domain tag
    const domainTag = company.warfareDomain
        ? `<span class="builder-tag domain">${escapeHtml(company.warfareDomain)}</span>`
        : '';

    // Structured synopsis sections (matches entity page order)
    const SYNOPSIS_ORDER = [
        { key: 'problem', label: 'Problem' },
        { key: 'solution', label: 'Solution' },
        { key: 'fieldValidation', label: 'Field Validation' },
        { key: 'technologyMaturity', label: 'Technology Maturity' },
        { key: 'strategicAdvantage', label: 'Strategic Advantage' },
        { key: 'goToMarketAccess', label: 'Go-to-Market Access' },
        { key: 'dualUsePotential', label: 'Dual-Use Potential' },
        { key: 'team', label: 'Team' },
        { key: 'competitiveLandscape', label: 'Competitive Landscape' },
        { key: 'primaryUser', label: 'Primary User' },
        { key: 'userCriticalProblem', label: 'User-Critical Problem' },
    ];

    // Build content section — structured synopsis or plain description fallback
    let contentSection = '';
    const sections = company.synopsisSections;

    if (sections && typeof sections === 'object') {
        contentSection = SYNOPSIS_ORDER
            .filter(({ key }) => sections[key])
            .map(({ key, label }) => `
                <div class="modal-synopsis-entry">
                    <h4 class="modal-section-title">${escapeHtml(label)}</h4>
                    <p>${escapeHtml(sections[key])}</p>
                </div>
            `).join('');
    }

    if (!contentSection) {
        contentSection = `
            <div class="modal-section">
                <h4 class="modal-section-title">About</h4>
                <p>${escapeHtml(company.description || company.tagline)}</p>
            </div>
        `;
    }

    // Classification tags — mission areas and warfare domains inline
    const classificationTags = [missionTags, domainTag].filter(Boolean).join('');
    const classificationSection = classificationTags ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Classification</h4>
            <div class="modal-tags">${classificationTags}</div>
        </div>
    ` : '';

    // Company details section — enriched with new fields
    const detailItems = [];
    if (company.trlLevel) {
        const maturity = company.technicalMaturity ? ` (${escapeHtml(company.technicalMaturity)})` : '';
        detailItems.push(`<span class="modal-detail-item"><strong>TRL:</strong> ${escapeHtml(company.trlLevel)}${maturity}</span>`);
    }
    if (company.fundingStage) detailItems.push(`<span class="modal-detail-item"><strong>Stage:</strong> ${escapeHtml(company.fundingStage)}</span>`);
    if (company.teamSize) detailItems.push(`<span class="modal-detail-item"><strong>Team:</strong> ${escapeHtml(company.teamSize)}</span>`);
    if (company.productType) detailItems.push(`<span class="modal-detail-item"><strong>Type:</strong> ${escapeHtml(company.productType)}</span>`);
    if (company.technologyArea) detailItems.push(`<span class="modal-detail-item"><strong>Tech:</strong> ${escapeHtml(company.technologyArea)}</span>`);
    if (company.location) detailItems.push(`<span class="modal-detail-item"><strong>Location:</strong> ${escapeHtml(company.location)}</span>`);
    if (company.pipelineStage) detailItems.push(`<span class="modal-detail-item"><strong>Status:</strong> ${escapeHtml(company.pipelineStage === 'alumni' ? 'Alumni' : 'Applicant')}</span>`);

    const detailsSection = detailItems.length > 0 ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Details</h4>
            <div class="modal-details">${detailItems.join('')}</div>
        </div>
    ` : '';

    // Video/Pitch links - private content, requires authentication
    // Show placeholder for unauthenticated users to indicate restricted content
    let linksSection = '';
    const hasPrivateResources = company.videoUrl || company.pitchUrl;

    if (hasPrivateResources) {
        if (authenticated && user) {
            // Authenticated: show actual resource links
            const linksHtml = [];
            if (company.videoUrl) {
                linksHtml.push(`<a href="${escapeHtml(company.videoUrl)}" target="_blank" rel="noopener" class="modal-link">View Demo</a>`);
            }
            if (company.pitchUrl) {
                linksHtml.push(`<a href="${escapeHtml(company.pitchUrl)}" target="_blank" rel="noopener" class="modal-link">View Pitch</a>`);
            }
            linksSection = `
                <div class="modal-section">
                    <h4 class="modal-section-title">Resources</h4>
                    <div class="modal-links">${linksHtml.join('')}</div>
                </div>
            `;
        } else {
            // Unauthenticated: show restricted access placeholder
            // C2UX: operational language, no consumer terms
            const resourceCount = (company.videoUrl ? 1 : 0) + (company.pitchUrl ? 1 : 0);
            const resourceText = resourceCount === 1
                ? (company.videoUrl ? 'Demo video' : 'Pitch materials')
                : 'Demo video and pitch materials';
            linksSection = `
                <div class="modal-section modal-section--restricted">
                    <h4 class="modal-section-title">Resources</h4>
                    <div class="modal-restricted-placeholder">
                        <span class="modal-restricted-placeholder__icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </span>
                        <span class="modal-restricted-placeholder__text">
                            ${escapeHtml(resourceText)} available after authentication
                        </span>
                    </div>
                </div>
            `;
        }
    }

    // Access control box - operational language per C2UX
    // Show different content based on authentication status
    let ctaBox;
    if (authenticated && user) {
        // Authenticated user: show contact/coordination options
        ctaBox = `
            <div class="modal-cta-box modal-cta-box--authenticated">
                <h4 class="modal-cta-box__title">Authorized Access</h4>
                <p class="modal-cta-box__text">
                    Authenticated as ${escapeHtml(user.email || user.name || 'user')}. Contact and coordination available.
                </p>
                <div class="modal-cta-box__actions">
                    ${company.founders ? `
                        <button class="modal-cta-btn modal-cta-btn--primary" onclick="navigator.clipboard.writeText('${escapeHtml(company.founders)}')">
                            Copy Contact
                        </button>
                    ` : ''}
                    ${websiteUrl ? `
                        <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener" class="modal-cta-btn modal-cta-btn--secondary">
                            External Site
                        </a>
                    ` : ''}
                    <a href="/auth/logout?returnTo=/builders" class="modal-cta-btn modal-cta-btn--tertiary">
                        Sign Out
                    </a>
                </div>
            </div>
        `;
    } else {
        // Not authenticated: show login prompt
        ctaBox = `
            <div class="modal-cta-box">
                <h4 class="modal-cta-box__title">Restricted Access</h4>
                <p class="modal-cta-box__text">
                    Authentication required for pitch materials, team roster, and direct coordination.
                </p>
                <div class="modal-cta-box__actions">
                    <a href="/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}" class="modal-cta-btn modal-cta-btn--primary">
                        Authenticate
                    </a>
                    ${websiteUrl ? `
                        <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener" class="modal-cta-btn modal-cta-btn--secondary">
                            External Site
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Use displayName if available
    const displayName = company.displayName || company.name;
    const entitySlug = toSlug(company.name);
    const entityLink = `<a href="/companies/${entitySlug}" class="modal-entity-link">Full profile</a>`;

    return `
        <div class="modal-header">
            ${logoHtml}
            <div class="modal-title-section">
                <h2 class="modal-title">${escapeHtml(displayName)}</h2>
                <div class="modal-cohort">${escapeHtml(company.cohort || '')} · ${entityLink}</div>
                ${websiteHtml}
            </div>
        </div>
        <div class="modal-body">
            ${detailsSection}
            ${classificationSection}
            ${contentSection}
            ${linksSection}
        </div>
        ${ctaBox}
    `;
}

/**
 * Render empty state - operational language per C2UX
 * @returns {string} - HTML string
 */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No results</h3>
            <p>Adjust filter parameters.</p>
        </div>
    `;
}

/**
 * Render loading state - operational language per C2UX
 * @returns {string} - HTML string
 */
export function renderLoadingState() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Retrieving data...</p>
        </div>
    `;
}

/**
 * Render error state - operational language per C2UX
 * @param {string} message - Error message
 * @returns {string} - HTML string
 */
export function renderErrorState(message) {
    return `
        <div class="empty-state">
            <h3>Data unavailable</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Generate URL slug from company name (matches optimize-static.mjs)
 * @param {string} name - Company name
 * @returns {string} - URL slug
 */
function toSlug(name) {
    return name
        .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
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
