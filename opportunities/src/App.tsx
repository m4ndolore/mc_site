import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import OpportunityList from "./components/OpportunityList";
import type { Opportunity } from "./types/opportunity";

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function OpportunityModal({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          animation: modal-fade-in 0.2s ease;
        }
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          width: 100%;
          max-width: 40rem;
          max-height: 80vh;
          overflow-y: auto;
          background-color: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 0.75rem;
          animation: modal-slide-up 0.2s ease;
        }
        @keyframes modal-slide-up {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem 1.5rem 0;
        }
        .modal-topic-code {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.02em;
          margin-bottom: 0.25rem;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--mc-text);
          line-height: 1.4;
          margin: 0;
        }
        .modal-close-btn {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid var(--mc-border);
          border-radius: 0.375rem;
          color: var(--mc-text-muted);
          cursor: pointer;
          font-size: 1.125rem;
          line-height: 1;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .modal-close-btn:hover {
          border-color: var(--mc-accent);
          color: var(--mc-text);
        }
        .modal-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .modal-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .modal-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .modal-meta-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .modal-meta-value {
          font-size: 0.875rem;
          color: var(--mc-text);
        }
        .modal-meta-value--success {
          color: var(--mc-success);
          font-weight: 500;
        }
        .modal-meta-value--warning {
          color: var(--mc-warning);
          font-weight: 500;
        }
        .modal-section-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .modal-description {
          font-size: 0.875rem;
          color: var(--mc-text);
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .modal-tag {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          background-color: var(--mc-bg-tertiary);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          border: 1px solid var(--mc-border);
        }
        .modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid var(--mc-border);
          display: flex;
          justify-content: flex-end;
        }
        .modal-footer-source {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={opportunity.topicTitle}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <div className="modal-topic-code">{opportunity.topicCode}</div>
              <h2 className="modal-title">{opportunity.topicTitle}</h2>
            </div>
            <button
              className="modal-close-btn"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              x
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-meta-grid">
              <div className="modal-meta-item">
                <span className="modal-meta-label">Component</span>
                <span className="modal-meta-value">
                  {opportunity.component}
                </span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Program</span>
                <span className="modal-meta-value">{opportunity.program}</span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Status</span>
                <span className="modal-meta-value modal-meta-value--success">
                  {opportunity.topicStatus}
                </span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Deadline</span>
                <span className="modal-meta-value modal-meta-value--warning">
                  {formatDate(
                    opportunity.responseDeadline ?? opportunity.closeDate,
                  )}
                </span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Open Date</span>
                <span className="modal-meta-value">
                  {formatDate(opportunity.openDate)}
                </span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Posted</span>
                <span className="modal-meta-value">
                  {formatDate(opportunity.postedDate)}
                </span>
              </div>
            </div>

            {opportunity.objective && (
              <div>
                <div className="modal-section-label">Objective</div>
                <p className="modal-description">{opportunity.objective}</p>
              </div>
            )}

            <div>
              <div className="modal-section-label">Description</div>
              <p className="modal-description">{opportunity.description}</p>
            </div>

            {opportunity.technologyAreas &&
              opportunity.technologyAreas.length > 0 && (
                <div>
                  <div className="modal-section-label">Technology Areas</div>
                  <div className="modal-tags">
                    {opportunity.technologyAreas.map((area) => (
                      <span key={area} className="modal-tag">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {opportunity.focusAreas && opportunity.focusAreas.length > 0 && (
              <div>
                <div className="modal-section-label">Focus Areas</div>
                <div className="modal-tags">
                  {opportunity.focusAreas.map((area) => (
                    <span key={area} className="modal-tag">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {opportunity.keywords && opportunity.keywords.length > 0 && (
              <div>
                <div className="modal-section-label">Keywords</div>
                <div className="modal-tags">
                  {opportunity.keywords.map((keyword) => (
                    <span key={keyword} className="modal-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <span className="modal-footer-source">
              Source: {opportunity.source}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function HomePage(): React.JSX.Element {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          Opportunities
        </h1>
        <p style={{ color: "var(--mc-text-muted)", maxWidth: "36rem" }}>
          Discover and pursue high-impact opportunities curated by the Merge
          Combinator network.
        </p>
      </div>

      <OpportunityList onSelect={setSelectedOpportunity} />

      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;
