import type { Opportunity } from "../types/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opportunity: Opportunity) => void;
  onToggleSave?: (opportunity: Opportunity) => void;
  isSaved?: boolean;
  matchCount?: number;
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

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function getDaysUntil(deadline: string): number {
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

type DisplayStatus = "Open" | "Pre-Release" | "Closing Soon" | "Closed";

function deriveDisplayStatus(
  topicStatus: string,
  deadline: string | undefined,
): DisplayStatus {
  const normalized = topicStatus.trim().toLowerCase();

  if (
    (normalized === "open" || normalized === "active") &&
    deadline &&
    getDaysUntil(deadline) >= 0 &&
    getDaysUntil(deadline) <= 14
  ) {
    return "Closing Soon";
  }

  if (normalized === "closing-soon" || normalized === "closing soon") return "Closing Soon";
  if (normalized === "open" || normalized === "active") return "Open";
  if (normalized === "pre-release" || normalized === "upcoming" || normalized === "forecasted")
    return "Pre-Release";
  if (normalized === "closed" || normalized === "archived") return "Closed";

  // Fallback: treat unknown statuses as Open
  return "Open";
}

const STATUS_COLORS: Record<DisplayStatus, string> = {
  Open: "var(--mc-success)",
  "Pre-Release": "var(--mc-accent)",
  "Closing Soon": "var(--mc-warning)",
  Closed: "var(--gray-medium, #737373)",
};

function OpportunityCard({
  opportunity,
  onClick,
  onToggleSave,
  isSaved = false,
  matchCount,
}: OpportunityCardProps): React.JSX.Element {
  const sourceLabel = opportunity.source.toUpperCase();
  const codeLabel = normalizeTopicCode(opportunity.topicCode);
  const deadline = opportunity.responseDeadline ?? opportunity.closeDate;
  const displayStatus = deriveDisplayStatus(opportunity.topicStatus, deadline);
  const statusColor = STATUS_COLORS[displayStatus];
  const linkHref = getOpportunityHref(opportunity);
  const isExternalLink = isHumanReadableSourceUrl(opportunity.url);

  const daysLeft = deadline ? getDaysUntil(deadline) : null;
  const showDaysLeft = daysLeft !== null && daysLeft > 0 && daysLeft < 30;

  const estimatedValue = opportunity.estimatedValue;
  let valueLabel = "";
  if (estimatedValue) {
    const { min, max } = estimatedValue;
    if (min && max) {
      valueLabel = `${formatValue(min)}\u2013${formatValue(max)}`;
    } else if (max) {
      valueLabel = `Up to ${formatValue(max)}`;
    } else if (min) {
      valueLabel = `From ${formatValue(min)}`;
    }
  }

  return (
    <>
      <style>{`
        .opp-card {
          background-color: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 1.25rem;
          cursor: pointer;
          transition: border-color 200ms ease, transform 150ms ease;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .opp-card:hover {
          border-color: var(--mc-accent);
          transform: translateY(-1px);
        }

        /* 1. Header row */
        .opp-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .opp-card__source {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--mc-bg-tertiary);
          padding: 0.125rem 0.5rem;
          border-radius: 2px;
        }
        .opp-card__save-btn {
          padding: 0.3rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          background: var(--mc-bg-tertiary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
          flex-shrink: 0;
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

        /* 2. Title */
        .opp-card__title {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.4;
          color: var(--mc-text);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .opp-card__title-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .opp-card__match-count {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--mc-accent);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* 3. Description */
        .opp-card__description {
          font-size: 0.875rem;
          color: var(--mc-text-muted);
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 4. Signal strip */
        .opp-card__signal-strip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.625rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
          border-left: 3px solid var(--strip-accent, var(--mc-success));
          flex-wrap: wrap;
        }
        .opp-card__status-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 0.125rem 0.4375rem;
          border-radius: 2px;
          white-space: nowrap;
        }
        .opp-card__signal-sep {
          width: 1px;
          height: 0.875rem;
          background: var(--mc-border);
          flex-shrink: 0;
        }
        .opp-card__deadline {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          white-space: nowrap;
        }
        .opp-card__deadline--urgent {
          color: var(--mc-warning);
          font-weight: 600;
        }
        .opp-card__value {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--mc-text);
          white-space: nowrap;
        }

        /* 5. Footer */
        .opp-card__footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding-top: 0.5rem;
          border-top: 1px solid var(--mc-border);
        }
        .opp-card__component {
          font-size: 0.6875rem;
          color: var(--mc-text-muted);
          background-color: var(--mc-bg-tertiary);
          padding: 0.125rem 0.5rem;
          border-radius: 2px;
        }
        .opp-card__topic-code {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.02em;
        }
        .opp-card__detail-link {
          color: var(--mc-accent);
          font-size: 0.6875rem;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
          margin-left: auto;
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
        {/* 1. Header: source badge + save */}
        <div className="opp-card__header">
          <span className="opp-card__source">{sourceLabel}</span>
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

        {/* 2. Title + optional match count */}
        <div className="opp-card__title-row">
          <h3 className="opp-card__title">{opportunity.topicTitle}</h3>
          {matchCount != null && matchCount > 0 && (
            <span className="opp-card__match-count">
              {matchCount} {matchCount === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* 3. Description */}
        <p className="opp-card__description">
          {truncate(opportunity.description, 200)}
        </p>

        {/* 4. Signal strip */}
        <div
          className="opp-card__signal-strip"
          style={{ "--strip-accent": statusColor } as React.CSSProperties}
        >
          {/* Status badge */}
          <span
            className="opp-card__status-badge"
            style={{
              color: statusColor,
              background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
            }}
          >
            {displayStatus}
          </span>

          <span className="opp-card__signal-sep" />

          {/* Deadline */}
          {deadline ? (
            showDaysLeft ? (
              <span className="opp-card__deadline opp-card__deadline--urgent">
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left
              </span>
            ) : (
              <span className="opp-card__deadline">
                {daysLeft !== null && daysLeft <= 0 ? "Past due" : formatDate(deadline)}
              </span>
            )
          ) : (
            <span className="opp-card__deadline">No deadline</span>
          )}

          {/* Estimated value */}
          {valueLabel && (
            <>
              <span className="opp-card__signal-sep" />
              <span className="opp-card__value">{valueLabel}</span>
            </>
          )}
        </div>

        {/* 5. Footer: component / topic code / detail link */}
        <div className="opp-card__footer">
          <span className="opp-card__component">{opportunity.component}</span>
          {codeLabel && <span className="opp-card__topic-code">{codeLabel}</span>}
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
      </article>
    </>
  );
}

export default OpportunityCard;
