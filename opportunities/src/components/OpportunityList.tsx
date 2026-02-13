import { useState, useEffect, useCallback } from "react";
import type { Opportunity } from "../types/opportunity";
import { fetchOpportunities } from "../lib/api";
import OpportunityCard from "./OpportunityCard";

interface OpportunityListProps {
  onSelect: (opportunity: Opportunity) => void;
}

function OpportunityList({
  onSelect,
}: OpportunityListProps): React.JSX.Element {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 25;

  const loadOpportunities = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchOpportunities(currentPage, pageSize);
      setOpportunities(response.data);
      setTotal(response.pagination.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOpportunities(page);
  }, [page, loadOpportunities]);

  const totalPages = Math.ceil(total / pageSize);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  if (loading) {
    return (
      <>
        <style>{`
          .opp-list__loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 1rem;
            gap: 1rem;
          }
          .opp-list__spinner {
            width: 2rem;
            height: 2rem;
            border: 2px solid var(--mc-border);
            border-top-color: var(--mc-accent);
            border-radius: 50%;
            animation: opp-spin 0.8s linear infinite;
          }
          @keyframes opp-spin {
            to { transform: rotate(360deg); }
          }
          .opp-list__loading-text {
            font-size: 0.875rem;
            color: var(--mc-text-muted);
          }
        `}</style>
        <div className="opp-list__loading">
          <div className="opp-list__spinner" />
          <span className="opp-list__loading-text">
            Loading opportunities...
          </span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`
          .opp-list__error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 1rem;
            gap: 1rem;
          }
          .opp-list__error-icon {
            font-size: 2rem;
          }
          .opp-list__error-message {
            font-size: 0.875rem;
            color: var(--mc-error);
          }
          .opp-list__retry-btn {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--mc-text);
            background-color: var(--mc-bg-tertiary);
            border: 1px solid var(--mc-border);
            border-radius: 0.375rem;
            cursor: pointer;
            transition: border-color 0.2s ease;
          }
          .opp-list__retry-btn:hover {
            border-color: var(--mc-accent);
          }
        `}</style>
        <div className="opp-list__error">
          <span className="opp-list__error-icon" role="img" aria-label="Error">
            !
          </span>
          <span className="opp-list__error-message">{error}</span>
          <button
            className="opp-list__retry-btn"
            onClick={() => void loadOpportunities(page)}
            type="button"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .opp-list__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .opp-list__count {
          font-size: 0.875rem;
          color: var(--mc-text-muted);
        }
        .opp-list__grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .opp-list__grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .opp-list__grid {
            grid-template-columns: repeat(3, 1fr);
          }
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
          color: var(--mc-text);
          background-color: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: border-color 0.2s ease, opacity 0.2s ease;
        }
        .opp-list__page-btn:hover:not(:disabled) {
          border-color: var(--mc-accent);
        }
        .opp-list__page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .opp-list__page-info {
          font-size: 0.875rem;
          color: var(--mc-text-muted);
        }
      `}</style>
      <div>
        <div className="opp-list__header">
          <span className="opp-list__count">
            {total.toLocaleString()} opportunit{total === 1 ? "y" : "ies"}{" "}
            found
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
              Page {page + 1} of {totalPages}
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
    </>
  );
}

export default OpportunityList;
