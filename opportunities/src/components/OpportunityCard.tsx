import type { Opportunity } from "../types/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opportunity: Opportunity) => void;
  onToggleSave?: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function stripHtml(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTopicCode(topicCode: string | undefined): string {
  if (!topicCode) return "";
  const code = topicCode.trim();
  const hasLetters = /[A-Za-z]/.test(code);
  const isReasonableLength = code.length <= 36;
  if (!hasLetters || !isReasonableLength) return "";
  return code;
}

function truncate(text: string | undefined, maxLength: number): string {
  const normalized = stripHtml(text);
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).trimEnd() + "...";
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

function isHumanReadableSourceUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !/\/topics\/api\/public\/topics\/.+\/details$/i.test(url);
}

function getOpportunityHref(opportunity: Opportunity): string {
  if (isHumanReadableSourceUrl(opportunity.url)) return opportunity.url as string;
  return `/opportunities/${opportunity.id || opportunity.topicId}`;
}

function getOpportunityLinkLabel(opportunity: Opportunity): string {
  return isHumanReadableSourceUrl(opportunity.url) ? "Source" : "Summary";
}

function OpportunityCard({
  opportunity,
  onClick,
  onToggleSave,
  isSaved = false,
}: OpportunityCardProps): React.JSX.Element {
  const sourceLabel = opportunity.source.toUpperCase();
  const codeLabel = normalizeTopicCode(opportunity.topicCode);
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
  const linkHref = getOpportunityHref(opportunity);
  const isExternalLink = isHumanReadableSourceUrl(opportunity.url);

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
        .opp-card__meta-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .opp-card__save-btn {
          margin-left: auto;
          padding: 0.3rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          background: var(--mc-bg-tertiary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .opp-card__save-btn:hover {
          border-color: var(--mc-accent);
          color: var(--mc-text);
        }
        .opp-card__save-btn--active {
          border-color: var(--mc-accent);
          color: var(--mc-accent);
          background: rgba(59, 130, 246, 0.12);
        }
        .opp-card__topic-code {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.02em;
        }
        .opp-card__source {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
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
          <div className="opp-card__meta-main">
            <span className="opp-card__source">{sourceLabel}</span>
            {codeLabel && <span className="opp-card__topic-code">{codeLabel}</span>}
            <span className="opp-card__component">{opportunity.component}</span>
          </div>
          {onToggleSave && (
            <button
              className={`opp-card__save-btn${isSaved ? " opp-card__save-btn--active" : ""}`}
              type="button"
              aria-pressed={isSaved}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(opportunity);
              }}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          )}
        </div>

        <h3 className="opp-card__title">{opportunity.topicTitle}</h3>

        <p className="opp-card__description">
          {truncate(opportunity.description, 200)}
        </p>

        <div className="opp-card__footer">
          <div>
            <span className="opp-card__status">{opportunity.topicStatus}</span>
            <a
              href={linkHref}
              {...(isExternalLink
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="opp-card__detail-link"
              onClick={(e) => e.stopPropagation()}
            >
              {getOpportunityLinkLabel(opportunity)}
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
