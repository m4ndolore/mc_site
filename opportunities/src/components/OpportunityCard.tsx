import type { Opportunity } from "../types/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opportunity: Opportunity) => void;
}

function truncate(text: string | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function OpportunityCard({
  opportunity,
  onClick,
}: OpportunityCardProps): React.JSX.Element {
  const isDeadlineSoon = (): boolean => {
    if (!opportunity.closeDate && !opportunity.responseDeadline) return false;
    const deadline = opportunity.responseDeadline ?? opportunity.closeDate;
    if (!deadline) return false;
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysUntil >= 0 && daysUntil <= 14;
  };

  const deadline = opportunity.responseDeadline ?? opportunity.closeDate;

  return (
    <>
      <style>{`
        .opp-card {
          background-color: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 1.25rem;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .opp-card:hover {
          border-color: var(--mc-accent);
          transform: translateY(-1px);
        }
        .opp-card__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .opp-card__topic-code {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.02em;
        }
        .opp-card__component {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          background-color: var(--mc-bg-tertiary);
          padding: 0.125rem 0.5rem;
          border-radius: 2px;
        }
        .opp-card__title {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.4;
          color: var(--mc-text);
          margin: 0;
        }
        .opp-card__description {
          font-size: 0.875rem;
          color: var(--mc-text-muted);
          line-height: 1.5;
          flex: 1;
        }
        .opp-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--mc-border);
        }
        .opp-card__status {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--mc-success);
        }
        .opp-card__deadline {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
        }
        .opp-card__deadline--soon {
          color: var(--mc-warning);
          font-weight: 500;
        }
        .opp-card__detail-link {
          color: var(--mc-accent);
          font-size: 0.75rem;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
          margin-left: 0.5rem;
        }
      `}</style>
      <article
        className="opp-card"
        onClick={() => onClick(opportunity)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(opportunity);
          }
        }}
      >
        <div className="opp-card__meta">
          <span className="opp-card__topic-code">
            {opportunity.topicCode}
          </span>
          <span className="opp-card__component">{opportunity.component}</span>
        </div>

        <h3 className="opp-card__title">{opportunity.topicTitle}</h3>

        <p className="opp-card__description">
          {truncate(opportunity.description, 200)}
        </p>

        <div className="opp-card__footer">
          <div>
            <span className="opp-card__status">{opportunity.topicStatus}</span>
            <a
              href={`/opportunities/${opportunity.id || opportunity.topicId}`}
              className="opp-card__detail-link"
              onClick={(e) => e.stopPropagation()}
            >
              Details
            </a>
          </div>
          <div>
            {deadline && (
              <span
                className={`opp-card__deadline${isDeadlineSoon() ? " opp-card__deadline--soon" : ""}`}
              >
                Due: {formatDate(deadline)}
              </span>
            )}
          </div>
        </div>
      </article>
    </>
  );
}

export default OpportunityCard;
