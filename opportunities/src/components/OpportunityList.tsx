import React, { useState, useEffect, useCallback } from "react";
import type { Opportunity } from "../types/opportunity";
import type { OpportunityProfile } from "../types/profile";
import { fetchOpportunities, cacheOpportunities } from "../lib/api";
import OpportunityCard from "./OpportunityCard";

interface OpportunityListProps {
  onSelect: (opportunity: Opportunity) => void;
  initialKeyword?: string;
  onToggleSave?: (opportunity: Opportunity) => void;
  isSaved?: (opportunity: Opportunity) => boolean;
  profile?: OpportunityProfile | null;
  savedCount?: number;
}

const DIGEST_DISMISSED_KEY = "mc-opp-digest-dismissed";

function EmailCaptureBanner({
  savedCount,
  cardCount,
  profile,
}: {
  savedCount: number;
  cardCount: number;
  profile?: OpportunityProfile | null;
}): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DIGEST_DISMISSED_KEY) === "1"; } catch { return false; }
  });

  const qualified = cardCount >= 10 || savedCount >= 2;
  if (!qualified || dismissed) return null;

  const params = new URLSearchParams({
    context: "opportunities",
    source: "opportunity-digest",
    returnTo: "/opportunities",
  });
  if (profile?.techAreas.length) {
    params.set("techAreas", profile.techAreas.join(","));
  }
  if (profile?.problemAreas.length) {
    params.set("problemAreas", profile.problemAreas.join(","));
  }

  const handleDismiss = (): void => {
    setDismissed(true);
    try { sessionStorage.setItem(DIGEST_DISMISSED_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <>
      <style>{`
        .digest-banner {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--charcoal);
          border: 1px solid var(--mc-border);
          border-left: 3px solid var(--blue);
          border-radius: 2px;
        }
        .digest-banner__text {
          flex: 1;
          min-width: 0;
        }
        .digest-banner__headline {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--offwhite);
          margin-bottom: 0.125rem;
        }
        .digest-banner__sub {
          font-size: 0.75rem;
          color: var(--gray-light);
        }
        .digest-banner__cta {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: var(--font-primary);
          color: var(--white);
          background: var(--blue);
          border: 1px solid var(--blue);
          border-radius: 2px;
          text-decoration: none;
          transition: background 150ms ease;
        }
        .digest-banner__cta:hover {
          background: var(--blue-dark);
          border-color: var(--blue-dark);
        }
        .digest-banner__dismiss {
          flex-shrink: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--gray-medium);
          cursor: pointer;
          transition: color 150ms ease;
          padding: 0;
        }
        .digest-banner__dismiss:hover {
          color: var(--offwhite);
        }
      `}</style>
      <div className="digest-banner">
        <div className="digest-banner__text">
          <div className="digest-banner__headline">Get weekly matches in your inbox</div>
          <div className="digest-banner__sub">Opportunities matching your profile, delivered weekly. No spam.</div>
        </div>
        <a className="digest-banner__cta" href={`/access?${params.toString()}`}>
          Subscribe
        </a>
        <button
          className="digest-banner__dismiss"
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </>
  );
}

function computeMatchCount(
  opp: Opportunity,
  profile: OpportunityProfile,
): number {
  if (!profile.techAreas.length && !profile.problemAreas.length) return 0;
  const oppTerms = [
    ...(opp.technologyAreas ?? []),
    ...(opp.focusAreas ?? []),
    ...(opp.keywords ?? []),
  ].map((t) => t.toLowerCase());
  const profileTerms = [...profile.techAreas, ...profile.problemAreas].map(
    (t) => t.toLowerCase(),
  );
  let count = 0;
  for (const pt of profileTerms) {
    if (oppTerms.some((ot) => ot.includes(pt) || pt.includes(ot))) count++;
  }
  return count;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active (Open + Pre-Release)" },
  { value: "open", label: "Open only" },
  { value: "pre-release", label: "Pre-Release only" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All statuses" },
];

// Opportunity type maps to the worker's `sources` param. Each source is a distinct
// vehicle: SBIR/STTR (sbir), DARPA BAAs (darpa), DIU CSOs/OTAs (diu), Ratio
// challenges (ratio). Empty value = all types.
const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "sbir", label: "SBIR / STTR" },
  { value: "darpa", label: "DARPA (BAA)" },
  { value: "diu", label: "DIU (CSO / OTA)" },
  { value: "ratio", label: "Ratio Challenges" },
];

const COMPONENT_OPTIONS = [
  { value: "", label: "All Components" },
  { value: "USAF", label: "USAF" },
  { value: "ARMY", label: "Army" },
  { value: "NAVY", label: "Navy" },
  { value: "SOCOM", label: "SOCOM" },
  { value: "DLA", label: "DLA" },
  { value: "DTRA", label: "DTRA" },
  { value: "OSD", label: "OSD" },
  { value: "MDA", label: "MDA" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "deadline", label: "Deadline (Soonest)" },
  { value: "alpha", label: "A-Z" },
];

function OpportunityList({
  onSelect,
  initialKeyword = "",
  onToggleSave,
  isSaved,
  profile,
  savedCount = 0,
}: OpportunityListProps): React.JSX.Element {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [pendingKeyword, setPendingKeyword] = useState(initialKeyword);
  const [sortBy, setSortBy] = useState("deadline");

  const pageSize = 25;

  const loadOpportunities = useCallback(
    async (currentPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetchOpportunities({
          page: currentPage,
          size: pageSize,
          status: statusFilter,
          component: componentFilter,
          keyword: keyword,
          sort: sortBy,
          sources: typeFilter || undefined,
        });
        // Cache so the detail page resolves for every source (not just SBIR).
        cacheOpportunities(response.data);
        setOpportunities((prev) =>
          append ? [...prev, ...response.data] : response.data,
        );
        setTotal(response.pagination.total);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, typeFilter, componentFilter, keyword, sortBy],
  );

  useEffect(() => {
    void loadOpportunities(page, page > 0);
  }, [page, loadOpportunities]);

  // Reset page and list when filters change
  useEffect(() => {
    setOpportunities([]);
    setPage(0);
  }, [statusFilter, typeFilter, componentFilter, keyword, sortBy]);

  useEffect(() => {
    setKeyword(initialKeyword);
    setPendingKeyword(initialKeyword);
    setPage(0);
  }, [initialKeyword]);

  const handleKeywordSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setKeyword(pendingKeyword);
  };

  return (
    <>
      <style>{`
        .filters {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          background: var(--charcoal);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
        }
        .filters__row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .filters__search-form {
          display: flex;
          flex: 1;
          min-width: 200px;
          gap: 0.5rem;
        }
        .filters__search {
          flex: 1;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-family: var(--font-primary);
          color: var(--offwhite);
          background: var(--black);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          outline: none;
          transition: border-color 150ms ease;
        }
        .filters__search:focus { border-color: var(--blue); }
        .filters__search::placeholder { color: var(--gray-medium); }
        .filters__search-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-primary);
          color: var(--white);
          background: var(--blue);
          border: 1px solid var(--blue);
          border-radius: 2px;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .filters__search-btn:hover { background: var(--blue-dark); }
        .filters__chips {
          display: flex;
          gap: 0.375rem;
        }
        .filters__chip {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: var(--font-primary);
          color: var(--gray-light);
          background: var(--black);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .filters__chip:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--offwhite);
        }
        .filters__chip--active {
          background: var(--blue);
          border-color: var(--blue);
          color: var(--white);
        }
        .filters__chip--active:hover {
          background: var(--blue-dark);
          border-color: var(--blue-dark);
        }
        .filters__select {
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          font-family: var(--font-primary);
          color: var(--offwhite);
          background: var(--black);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
          outline: none;
        }
        .filters__select:focus { border-color: var(--blue); }
        .filters__label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--gray-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .opp-list__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .opp-list__count {
          font-size: 0.875rem;
          color: var(--gray-light);
        }
        .opp-list__grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .opp-list__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .opp-list__grid { grid-template-columns: repeat(3, 1fr); }
        }
        .opp-list__pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--mc-border);
        }
        .opp-list__page-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-primary);
          color: var(--offwhite);
          background: var(--charcoal);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 150ms ease;
        }
        .opp-list__page-btn:hover:not(:disabled) { border-color: var(--blue); }
        .opp-list__page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .opp-list__page-info {
          font-size: 0.875rem;
          color: var(--gray-light);
        }
        .opp-list__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 1rem;
          gap: 1rem;
        }
        .opp-list__spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid var(--mc-border);
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: opp-spin 0.8s linear infinite;
        }
        @keyframes opp-spin { to { transform: rotate(360deg); } }
        .opp-list__loading-text { font-size: 0.875rem; color: var(--gray-light); }
        .opp-list__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 1rem;
          gap: 1rem;
        }
        .opp-list__error-message { font-size: 0.875rem; color: var(--mc-error); }
        .opp-list__retry-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-primary);
          color: var(--offwhite);
          background: var(--charcoal);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
        }
        .opp-list__retry-btn:hover { border-color: var(--blue); }
        .opp-list__empty {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--gray-medium);
        }
      `}</style>

      <div className="filters">
        <div className="filters__row">
          <form className="filters__search-form" onSubmit={handleKeywordSubmit}>
            <input
              className="filters__search"
              type="text"
              placeholder="Search topics, keywords..."
              value={pendingKeyword}
              onChange={(e) => setPendingKeyword(e.target.value)}
            />
            <button className="filters__search-btn" type="submit">Search</button>
          </form>
        </div>
        <div className="filters__row">
          <span className="filters__label">Status</span>
          <div className="filters__chips">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`filters__chip${statusFilter === opt.value ? " filters__chip--active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="filters__label" style={{ marginLeft: "auto" }}>Type</span>
          <select
            className="filters__select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="filters__label">Component</span>
          <select
            className="filters__select"
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
          >
            {COMPONENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="filters__label">Sort</span>
          <select
            className="filters__select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="opp-list__loading">
          <div className="opp-list__spinner" />
          <span className="opp-list__loading-text">Loading opportunities...</span>
        </div>
      ) : error ? (
        <div className="opp-list__error">
          <span className="opp-list__error-message">{error}</span>
          <button
            className="opp-list__retry-btn"
            onClick={() => void loadOpportunities(page, page > 0)}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="opp-list__empty">
          No opportunities match your filters. Try adjusting your search.
        </div>
      ) : (
        <div>
          <div className="opp-list__header">
            <span className="opp-list__count">
              Showing {opportunities.length.toLocaleString()} of{" "}
              {total.toLocaleString()}
            </span>
          </div>
          <div className="opp-list__grid">
            {opportunities.map((opp, index) => (
              <React.Fragment key={opp.id || opp.topicId}>
                <OpportunityCard
                  opportunity={opp}
                  onClick={onSelect}
                  onToggleSave={onToggleSave}
                  isSaved={isSaved?.(opp)}
                  matchCount={
                    profile ? computeMatchCount(opp, profile) : undefined
                  }
                />
                {index === 9 && (
                  <EmailCaptureBanner
                    savedCount={savedCount}
                    cardCount={opportunities.length}
                    profile={profile}
                  />
                )}
              </React.Fragment>
            ))}
            {opportunities.length < 10 && savedCount >= 2 && (
              <EmailCaptureBanner
                savedCount={savedCount}
                cardCount={opportunities.length}
                profile={profile}
              />
            )}
          </div>
          {opportunities.length < total && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button
                className="opp-list__page-btn"
                onClick={() => {
                  setPage((p) => p + 1);
                }}
                disabled={loadingMore}
                type="button"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default OpportunityList;
