import type { OutlookEvent } from "../types/opportunity";

interface EventsPanelProps {
  events: OutlookEvent[];
  loading: boolean;
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

function formatDateRange(start: string, end: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(end)}, ${new Date(end + "T12:00:00").getFullYear()}`;
}

function EventCard({ event }: { event: OutlookEvent }): React.JSX.Element {
  const isHighPriority = event.priority === "high";

  return (
    <article
      className={`event-card${isHighPriority ? " event-card--high" : ""}`}
    >
      <div className="event-card__header">
        <span className="event-card__type">{event.type.toUpperCase()}</span>
        <span className="event-card__date-range">
          {formatDateRange(event.dates.start, event.dates.end)}
        </span>
      </div>

      <h3 className="event-card__title">{event.title}</h3>
      <p className="event-card__organizer">{event.organizer}</p>
      <p className="event-card__description">{event.description}</p>

      {event.locations.length > 0 && (
        <div className="event-card__locations">
          <div className="event-card__locations-label">LOCATIONS</div>
          <div className="event-card__locations-list">
            {event.locations.map((loc) => (
              <div key={loc.city} className="event-card__location-row">
                <span className="event-card__location-city">{loc.city}</span>
                <span className="event-card__location-date">
                  {formatShortDate(loc.date)}
                </span>
                <a
                  href={loc.register}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-card__register-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Register
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 12L12 4M12 4H6M12 4V10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="event-card__tags">
        {event.tags.map((tag) => (
          <span key={tag} className="event-card__tag">
            {tag}
          </span>
        ))}
      </div>

      {event.links.length > 0 && (
        <div className="event-card__links">
          {event.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-card__link"
            >
              {link.label}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 12L12 4M12 4H6M12 4V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function EventsPanel({ events, loading }: EventsPanelProps): React.JSX.Element {
  return (
    <>
      <style>{`
        .events-panel__empty {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--mc-text-muted);
          font-size: 0.875rem;
        }
        .events-panel__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 1rem;
          gap: 1rem;
        }
        .events-panel__spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid var(--mc-border);
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: opp-spin 0.8s linear infinite;
        }
        .events-panel__grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Event Card */
        .event-card {
          background: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .event-card--high {
          border-left: 3px solid var(--mc-accent);
        }
        .event-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .event-card__type {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-accent);
          letter-spacing: 0.08em;
        }
        .event-card__date-range {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          font-variant-numeric: tabular-nums;
        }
        .event-card__title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--mc-text);
          line-height: 1.4;
          margin: 0;
        }
        .event-card__organizer {
          font-size: 0.8125rem;
          color: var(--mc-text-muted);
          margin: -0.25rem 0 0;
        }
        .event-card__description {
          font-size: 0.875rem;
          color: var(--mc-text);
          line-height: 1.6;
          opacity: 0.85;
        }

        /* Locations */
        .event-card__locations {
          background: var(--mc-bg);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .event-card__locations-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--mc-text-muted);
          letter-spacing: 0.08em;
          padding: 0.625rem 0.875rem;
          border-bottom: 1px solid var(--mc-border);
        }
        .event-card__locations-list {
          display: flex;
          flex-direction: column;
        }
        .event-card__location-row {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.875rem;
          gap: 0.75rem;
          border-bottom: 1px solid var(--mc-border);
        }
        .event-card__location-row:last-child {
          border-bottom: none;
        }
        .event-card__location-city {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--mc-text);
          min-width: 120px;
        }
        .event-card__location-date {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          font-variant-numeric: tabular-nums;
          flex: 1;
        }
        .event-card__register-link {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--mc-accent);
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: opacity 150ms ease;
        }
        .event-card__register-link:hover {
          opacity: 0.8;
        }

        /* Tags */
        .event-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .event-card__tag {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          background: var(--mc-bg-tertiary);
          padding: 2px 8px;
          border-radius: 2px;
          border: 1px solid var(--mc-border);
        }

        /* Links */
        .event-card__links {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--mc-border);
        }
        .event-card__link {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--mc-accent);
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: opacity 150ms ease;
        }
        .event-card__link:hover {
          opacity: 0.8;
        }

        @media (max-width: 640px) {
          .event-card__location-city {
            min-width: 90px;
          }
          .event-card__header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>

      {loading ? (
        <div className="events-panel__loading">
          <div className="events-panel__spinner" />
          <span style={{ fontSize: "0.875rem", color: "var(--gray-light)" }}>
            Loading events...
          </span>
        </div>
      ) : events.length === 0 ? (
        <div className="events-panel__empty">
          No upcoming events. Check back soon.
        </div>
      ) : (
        <div className="events-panel__grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}

export default EventsPanel;
