import { useState, useEffect, useCallback } from "react";
import type { Opportunity } from "../types/opportunity";
import { fetchOpportunities } from "../lib/api";
import OpportunityCard from "./OpportunityCard";

interface OpportunityListProps {
  onSelect: (opportunity: Opportunity) => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "open", label: "Open" },
  { value: "pre-release", label: "Pre-Release" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
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
}: OpportunityListProps): React.JSX.Element {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("active");
  const [componentFilter, setComponentFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const pageSize = 25;

  const loadOpportunities = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchOpportunities({
          page: currentPage,
          size: pageSize,
          status: statusFilter,
          component: componentFilter,
          keyword: keyword,
          sort: sortBy,
        });
        setOpportunities(response.data);
        setTotal(response.pagination.total);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, componentFilter, keyword, sortBy],
  );

  useEffect(() => {
    void loadOpportunities(page);
  }, [page, loadOpportunities]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, componentFilter, keyword, sortBy]);

  const totalPages = Math.ceil(total / pageSize);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

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
          border-radius: 0.5rem;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
          border-radius: 9999px;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
          <span className="filters__label" style={{ marginLeft: "auto" }}>Component</span>
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
            onClick={() => void loadOpportunities(page)}
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
              {total.toLocaleString()} total &middot; Showing {opportunities.length} on this page
            </span>
          </div>
          <div className="opp-list__grid">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id || opp.topicId}
                opportunity={opp}
                onClick={onSelect}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="opp-list__pagination">
              <button
                className="opp-list__page-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                type="button"
              >
                Previous
              </button>
              <span className="opp-list__page-info">
                Page {page + 1} of {totalPages.toLocaleString()}
              </span>
              <button
                className="opp-list__page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default OpportunityList;
