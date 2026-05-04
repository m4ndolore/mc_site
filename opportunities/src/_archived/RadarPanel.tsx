import { useState, useEffect, useCallback } from "react";
import type { Opportunity, OutlookEvent } from "../types/opportunity";
import { fetchOpportunities } from "../lib/api";

interface RadarPanelProps {
  events: OutlookEvent[];
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

function matchTags(event: OutlookEvent, opp: Opportunity): string[] {
  const eventTerms = event.tags.map((t) => t.toLowerCase());
  const oppTerms = [
    ...(opp.keywords || []),
    ...(opp.technologyAreas || []),
    ...(opp.focusAreas || []),
  ].map((t) => t.toLowerCase());

  return eventTerms.filter((et) =>
    oppTerms.some((ot) => ot.includes(et) || et.includes(ot)),
  );
}

function formatShortDate(dateString: string): string {
  try {
    return new Date(dateString + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatDeadline(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function RadarPanel({
  events,
  onSelectOpportunity,
}: RadarPanelProps): React.JSX.Element {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  // Auto-select first event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]!.id);
    }
  }, [events, selectedEventId]);

  // Load all opportunities once for matching (larger page size, all statuses)
  const loadOpportunities = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const response = await fetchOpportunities({
        page: 0,
        size: 100,
        status: "all",
        sort: "newest",
      });
      setOpportunities(response.data);
      setLoaded(true);
    } catch {
      // Fail silently — radar is supplementary
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  // Compute matches for selected event
  const matches = selectedEvent
    ? opportunities
        .map((opp) => ({
          opportunity: opp,
          matchedTags: matchTags(selectedEvent, opp),
        }))
        .filter((m) => m.matchedTags.length > 0)
        .sort((a, b) => b.matchedTags.length - a.matchedTags.length)
    : [];

  return (
    <>
      <style>{`
        .radar {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1rem;
          min-height: 400px;
        }

        /* Event sidebar */
        .radar__events {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          overflow: hidden;
          align-self: start;
        }
        .radar__events-header {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.75rem 1rem;
          background: var(--mc-bg-secondary);
          border-bottom: 1px solid var(--mc-border);
        }
        .radar__event-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid var(--mc-border);
          background: var(--mc-bg);
          transition: background 150ms ease;
          border: none;
          width: 100%;
          text-align: left;
          font-family: var(--font-primary);
        }
        .radar__event-item:last-child {
          border-bottom: none;
        }
        .radar__event-item:hover {
          background: var(--mc-bg-secondary);
        }
        .radar__event-item--active {
          background: var(--mc-bg-secondary);
          border-left: 3px solid var(--mc-accent);
          padding-left: calc(1rem - 3px);
        }
        .radar__event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--mc-border);
          margin-top: 5px;
          flex-shrink: 0;
        }
        .radar__event-item--active .radar__event-dot {
          background: var(--mc-accent);
        }
        .radar__event-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .radar__event-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--mc-text);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .radar__event-meta {
          font-size: 0.6875rem;
          color: var(--mc-text-muted);
          font-variant-numeric: tabular-nums;
        }

        /* Results panel */
        .radar__results {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          overflow: hidden;
          align-self: start;
        }
        .radar__results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--mc-bg-secondary);
          border-bottom: 1px solid var(--mc-border);
        }
        .radar__results-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .radar__results-count {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          font-variant-numeric: tabular-nums;
        }
        .radar__match-list {
          display: flex;
          flex-direction: column;
        }
        .radar__match-item {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--mc-border);
          cursor: pointer;
          background: var(--mc-bg);
          transition: background 150ms ease;
        }
        .radar__match-item:last-child {
          border-bottom: none;
        }
        .radar__match-item:hover {
          background: var(--mc-bg-secondary);
        }
        .radar__match-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .radar__match-code {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.02em;
        }
        .radar__match-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--mc-text);
          line-height: 1.3;
        }
        .radar__match-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: var(--mc-text-muted);
        }
        .radar__match-status {
          color: var(--mc-success);
          font-weight: 500;
        }
        .radar__match-deadline--soon {
          color: var(--mc-warning);
          font-weight: 500;
        }
        .radar__match-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .radar__match-tag {
          font-size: 0.6875rem;
          color: var(--mc-accent);
          background: rgba(59, 130, 246, 0.12);
          padding: 1px 6px;
          border-radius: 2px;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        /* Empty / loading states */
        .radar__empty {
          padding: 3rem 1rem;
          text-align: center;
          color: var(--mc-text-muted);
          font-size: 0.875rem;
        }
        .radar__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 1rem;
          gap: 0.75rem;
        }
        .radar__spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid var(--mc-border);
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: opp-spin 0.8s linear infinite;
        }
        .radar__no-events {
          grid-column: 1 / -1;
          padding: 4rem 1rem;
          text-align: center;
          color: var(--mc-text-muted);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .radar {
            grid-template-columns: 1fr;
          }
          .radar__events {
            flex-direction: row;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .radar__events-header {
            display: none;
          }
          .radar__event-item {
            border-bottom: none;
            border-right: 1px solid var(--mc-border);
            min-width: 180px;
          }
          .radar__event-item--active {
            border-left: none;
            border-bottom: 3px solid var(--mc-accent);
            padding-left: 1rem;
            padding-bottom: calc(0.75rem - 3px);
          }
        }
      `}</style>

      {events.length === 0 ? (
        <div className="radar__no-events">
          No events loaded. Events are needed to map solicitation relationships.
        </div>
      ) : (
        <div className="radar">
          <div className="radar__events">
            <div className="radar__events-header">Events</div>
            {events.map((event) => (
              <button
                key={event.id}
                className={`radar__event-item${selectedEventId === event.id ? " radar__event-item--active" : ""}`}
                onClick={() => setSelectedEventId(event.id)}
                type="button"
              >
                <span className="radar__event-dot" />
                <div className="radar__event-info">
                  <span className="radar__event-title">{event.title}</span>
                  <span className="radar__event-meta">
                    {formatShortDate(event.dates.start)} –{" "}
                    {formatShortDate(event.dates.end)} &middot;{" "}
                    {event.locations.length} cities
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="radar__results">
            <div className="radar__results-header">
              <span className="radar__results-label">
                Related Solicitations
              </span>
              {!loading && (
                <span className="radar__results-count">
                  {matches.length} matches
                </span>
              )}
            </div>

            {loading ? (
              <div className="radar__loading">
                <div className="radar__spinner" />
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--gray-light)" }}
                >
                  Scanning solicitations...
                </span>
              </div>
            ) : matches.length === 0 ? (
              <div className="radar__empty">
                {selectedEvent
                  ? `No solicitations match the tags for "${selectedEvent.title}". Tags searched: ${selectedEvent.tags.join(", ")}`
                  : "Select an event to find related solicitations."}
              </div>
            ) : (
              <div className="radar__match-list">
                {matches.slice(0, 25).map(({ opportunity, matchedTags }) => {
                  const deadline =
                    opportunity.responseDeadline ?? opportunity.closeDate;
                  const daysUntil = deadline
                    ? Math.ceil(
                        (new Date(deadline).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;
                  const isSoon =
                    daysUntil !== null && daysUntil >= 0 && daysUntil <= 14;

                  return (
                    <div
                      key={opportunity.id || opportunity.topicId}
                      className="radar__match-item"
                      onClick={() => onSelectOpportunity(opportunity)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectOpportunity(opportunity);
                        }
                      }}
                    >
                      <div className="radar__match-header">
                        <span className="radar__match-code">
                          {opportunity.topicCode}
                        </span>
                        <span className="radar__match-title">
                          {opportunity.topicTitle}
                        </span>
                      </div>
                      <div className="radar__match-meta">
                        <span>{opportunity.component}</span>
                        <span className="radar__match-status">
                          {opportunity.topicStatus}
                        </span>
                        {deadline && (
                          <span
                            className={
                              isSoon ? "radar__match-deadline--soon" : ""
                            }
                          >
                            Due: {formatDeadline(deadline)}
                          </span>
                        )}
                      </div>
                      <div className="radar__match-tags">
                        {matchedTags.map((tag) => (
                          <span key={tag} className="radar__match-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {matches.length > 25 && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "0.8125rem",
                      color: "var(--mc-text-muted)",
                      textAlign: "center",
                    }}
                  >
                    Showing 25 of {matches.length} matches
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default RadarPanel;
