import { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import OpportunityList from "./components/OpportunityList";
import TabBar from "./components/TabBar";
import EventsPanel from "./components/EventsPanel";
import RadarPanel from "./components/RadarPanel";
import type { Opportunity, OutlookEvent } from "./types/opportunity";
import { fetchOutlookEvents, fetchOpportunity } from "./lib/api";

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
          border-radius: 2px;
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
          border-radius: 2px;
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
          border-radius: 2px;
          border: 1px solid var(--mc-border);
        }
        .modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid var(--mc-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-footer-source {
          font-size: 0.75rem;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .modal-footer-link {
          font-size: 0.75rem;
          color: var(--mc-accent);
          text-decoration: underline;
          text-underline-offset: 2px;
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
            <a
              className="modal-footer-link"
              href={`/opportunities/${opportunity.id || opportunity.topicId}`}
            >
              Permalink
            </a>
            <span className="modal-footer-source">
              Source: {opportunity.source}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

type OpportunityRouteMode = "all" | "sbir" | "sttr";

function upsertMeta(name: string, content: string, isProperty = false): void {
  const selector = isProperty
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let node = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement("meta");
    if (isProperty) node.setAttribute("property", name);
    else node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let node = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, unknown>): void {
  const selector = `script[data-jsonld-id="${id}"]`;
  let node = document.head.querySelector(selector) as HTMLScriptElement | null;
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.setAttribute("data-jsonld-id", id);
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

function HomePage({ mode = "all" }: { mode?: OpportunityRouteMode }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState("solicitations");
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [events, setEvents] = useState<OutlookEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await fetchOutlookEvents();
      setEvents(data.events);
    } catch {
      // Events are supplementary — fail silently
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const tabs = [
    { id: "solicitations", label: "Solicitations" },
    { id: "events", label: "Events", count: events.length || undefined },
    { id: "radar", label: "Radar" },
  ];

  const seo = useMemo(() => {
    if (mode === "sbir") {
      return {
        title: "SBIR Opportunities | Merge Combinator",
        description:
          "Live SBIR opportunities for defense startups, including active solicitations, timelines, and mission-relevant focus areas.",
        canonical: "https://mergecombinator.com/opportunities/sbir",
        keyword: "sbir",
        heading: "SBIR Opportunities",
        subtitle:
          "Curated SBIR solicitations, events, and intelligence for defense tech builders.",
      };
    }
    if (mode === "sttr") {
      return {
        title: "STTR Opportunities | Merge Combinator",
        description:
          "Live STTR opportunities for defense startups and research teams, with deadlines, components, and transition context.",
        canonical: "https://mergecombinator.com/opportunities/sttr",
        keyword: "sttr",
        heading: "STTR Opportunities",
        subtitle:
          "Curated STTR solicitations, events, and intelligence for teams pursuing research-to-transition pathways.",
      };
    }
    return {
      title: "Opportunities | Merge Combinator",
      description:
        "Solicitations, SBIR/STTR opportunities, events, and defense market intelligence for national security builders.",
      canonical: "https://mergecombinator.com/opportunities",
      keyword: "",
      heading: "Opportunities",
      subtitle: "Solicitations, events, and intel for defense tech builders.",
    };
  }, [mode]);

  useEffect(() => {
    document.title = seo.title;
    upsertMeta("description", seo.description);
    upsertMeta("og:title", seo.title, true);
    upsertMeta("og:description", seo.description, true);
    upsertMeta("og:url", seo.canonical, true);
    upsertMeta("twitter:title", seo.title);
    upsertMeta("twitter:description", seo.description);
    upsertCanonical(seo.canonical);
  }, [seo]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "0.375rem",
          }}
        >
          {seo.heading}
        </h1>
        <p style={{ color: "var(--mc-text-muted)", maxWidth: "36rem", fontSize: "0.875rem" }}>
          {seo.subtitle}
        </p>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "solicitations" && (
        <OpportunityList onSelect={setSelectedOpportunity} initialKeyword={seo.keyword} />
      )}

      {activeTab === "events" && (
        <EventsPanel events={events} loading={eventsLoading} />
      )}

      {activeTab === "radar" && (
        <RadarPanel
          events={events}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}

      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid var(--mc-border)",
          borderRadius: "2px",
          background: "var(--charcoal)",
        }}
      >
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>How to use this data</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--mc-text-muted)", marginBottom: "0.5rem" }}>
          Opportunities are aggregated from public sources and normalized for faster triage. Always verify source details before submission.
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--mc-text-muted)" }}>
          Related guidance: <a href="https://mergecombinator.com/knowledge/sbir">SBIR/STTR Playbook</a> •{" "}
          <a href="https://mergecombinator.com/ai/overview">AI Overview</a>
        </p>
      </section>
    </div>
  );
}

function OpportunityDetailPage(): React.JSX.Element {
  const { opportunityId = "" } = useParams();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchOpportunity(opportunityId);
        if (!isMounted) return;
        setOpportunity(response.data);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load opportunity";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
    };
  }, [opportunityId]);

  useEffect(() => {
    const canonical = `https://mergecombinator.com/opportunities/${opportunityId}`;
    if (loading) {
      document.title = "Opportunity Detail | Merge Combinator";
      upsertMeta("description", "Opportunity details for defense builders.");
      upsertCanonical(canonical);
      return;
    }
    if (!opportunity) {
      document.title = "Opportunity Not Found | Merge Combinator";
      upsertMeta(
        "description",
        "This opportunity was not found or is no longer available.",
      );
      upsertCanonical(canonical);
      return;
    }

    const title = `${opportunity.topicTitle} | Opportunity | Merge Combinator`;
    const description = (
      opportunity.description || "Opportunity details for defense builders."
    ).slice(0, 300);
    document.title = title;
    upsertMeta("description", description);
    upsertMeta("og:title", title, true);
    upsertMeta("og:description", description, true);
    upsertMeta("og:url", canonical, true);
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertCanonical(canonical);

    const dueDate = opportunity.responseDeadline ?? opportunity.closeDate;
    upsertJsonLd("opportunity-detail", {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: opportunity.topicTitle,
      url: canonical,
      identifier: opportunity.topicCode || opportunity.id || opportunity.topicId,
      description: opportunity.description,
      datePublished: opportunity.postedDate,
      expires: dueDate,
      publisher: {
        "@type": "Organization",
        name: "Merge Combinator",
        url: "https://mergecombinator.com",
      },
      about: [
        "defense solicitations",
        "SBIR",
        "STTR",
        opportunity.component,
        opportunity.program,
      ].filter(Boolean),
      isBasedOn: opportunity.url || undefined,
    });
  }, [loading, opportunity, opportunityId]);

  if (loading) {
    return <p style={{ color: "var(--mc-text-muted)" }}>Loading opportunity...</p>;
  }
  if (error || !opportunity) {
    return (
      <div>
        <h1 style={{ marginBottom: "0.5rem" }}>Opportunity Not Found</h1>
        <p style={{ color: "var(--mc-text-muted)", marginBottom: "1rem" }}>
          {error || "This opportunity could not be loaded."}
        </p>
        <Link to="/" style={{ color: "var(--mc-accent)" }}>
          Back to opportunities
        </Link>
      </div>
    );
  }

  const dueDate = opportunity.responseDeadline ?? opportunity.closeDate;
  const sourceUrl = opportunity.url;

  return (
    <article style={{ maxWidth: "860px", margin: "0 auto" }}>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link to="/" style={{ color: "var(--mc-accent)" }}>
          ← Back to opportunities
        </Link>
      </p>
      <h1 style={{ fontSize: "1.9rem", lineHeight: 1.3, marginBottom: "0.5rem" }}>
        {opportunity.topicTitle}
      </h1>
      <p style={{ color: "var(--mc-text-muted)", marginBottom: "1.25rem" }}>
        {opportunity.topicCode} • {opportunity.component} • {opportunity.program}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ color: "var(--mc-text-muted)", fontSize: "0.75rem" }}>Status</div>
          <div>{opportunity.topicStatus}</div>
        </div>
        <div>
          <div style={{ color: "var(--mc-text-muted)", fontSize: "0.75rem" }}>Posted</div>
          <div>{formatDate(opportunity.postedDate)}</div>
        </div>
        <div>
          <div style={{ color: "var(--mc-text-muted)", fontSize: "0.75rem" }}>Deadline</div>
          <div>{formatDate(dueDate)}</div>
        </div>
      </div>

      {sourceUrl && (
        <p style={{ marginBottom: "1.25rem" }}>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--mc-accent)" }}>
            View primary source
          </a>
        </p>
      )}

      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Description</h2>
        <p style={{ color: "var(--mc-text-muted)", lineHeight: 1.7 }}>
          {opportunity.description || "No description provided."}
        </p>
      </section>

      {opportunity.objective && (
        <section style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Objective</h2>
          <p style={{ color: "var(--mc-text-muted)", lineHeight: 1.7 }}>
            {opportunity.objective}
          </p>
        </section>
      )}
    </article>
  );
}

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage mode="all" />} />
        <Route path="/sbir" element={<HomePage mode="sbir" />} />
        <Route path="/sttr" element={<HomePage mode="sttr" />} />
        <Route path="/:opportunityId" element={<OpportunityDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
