import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import OpportunityList from "./components/OpportunityList";
import TabBar from "./components/TabBar";
import SavedPanel from "./components/SavedPanel";
import IntakeFlow from "./components/IntakeFlow";
import ProfileBar from "./components/ProfileBar";
import GroupedFeed from "./components/GroupedFeed";
import type { Opportunity } from "./types/opportunity";
import type { ViewMode } from "./types/profile";
import { fetchOpportunity, fetchOpportunities } from "./lib/api";
import { useProfile } from "./lib/profile";

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

function sanitizeText(text: string | undefined): string {
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&hellip;/gi, "...")
    .replace(/&ouml;/gi, "o");
}

function htmlToParagraphs(text: string | undefined): string[] {
  if (!text) return [];
  const normalized = decodeHtmlEntities(
    text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<\/li>\s*<li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/?(ul|ol)>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return [];
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function RichTextBlock({ text }: { text: string | undefined }): React.JSX.Element | null {
  const paragraphs = htmlToParagraphs(text);
  if (!paragraphs.length) return null;

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 32)}`}
          style={{ color: "var(--mc-text-muted)", lineHeight: 1.75, marginBottom: "0.85rem" }}
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

function normalizeTopicCode(topicCode: string | undefined): string {
  if (!topicCode) return "";
  const code = topicCode.trim();
  const hasLetters = /[A-Za-z]/.test(code);
  if (!hasLetters || code.length > 36) return "";
  return code;
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "closing-soon" || s.includes("closing")) return "var(--mc-warning)";
  if (s === "pre-release" || s.includes("pre")) return "var(--mc-accent)";
  if (s === "closed") return "var(--gray-medium, #737373)";
  return "var(--mc-success)"; // open, active, default
}

function getStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "closing-soon") return "Closing Soon";
  if (s === "pre-release") return "Pre-Release";
  if (s === "closed") return "Closed";
  return "Open";
}

function getDeadlineDisplay(deadline: string | undefined): { text: string; urgent: boolean } {
  if (!deadline) return { text: "No deadline listed", urgent: false };
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: "Past due", urgent: true };
  if (days < 30) return { text: `${days} days left`, urgent: true };
  return { text: formatDate(deadline), urgent: false };
}

function formatEstimatedValue(val: { min?: number; max?: number } | undefined): string | null {
  if (!val) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (val.min && val.max) return `${fmt(val.min)}\u2013${fmt(val.max)}`;
  if (val.max) return `Up to ${fmt(val.max)}`;
  if (val.min) return `From ${fmt(val.min)}`;
  return null;
}

function isHumanReadableSourceUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !/\/topics\/api\/public\/topics\/.+\/details$/i.test(url);
}

function getSourceUrl(opportunity: Opportunity): string | null {
  if (isHumanReadableSourceUrl(opportunity.url)) return opportunity.url as string;
  // For SBIR topics, link to the public website instead of the API endpoint
  if (opportunity.source === "sbir" && (opportunity.topicId || opportunity.id)) {
    return `https://www.dodsbirsttr.mil/topics-app/#/topics/${opportunity.topicId || opportunity.id}`;
  }
  return null;
}

function getOpportunityHref(opportunity: Opportunity): string {
  return getSourceUrl(opportunity) ?? `/opportunities/${opportunity.id || opportunity.topicId}`;
}

function getOpportunityLinkLabel(opportunity: Opportunity): string {
  return getSourceUrl(opportunity) ? "View source" : "Details";
}

function getOpportunityReturnPath(opportunity: Opportunity): string {
  return `/opportunities/${opportunity.id || opportunity.topicId}`;
}

function buildOpportunityAccessUrl(
  opportunity: Opportunity,
  source = "opportunity-match",
): string {
  const params = new URLSearchParams({
    context: "opportunities",
    source,
    returnTo: getOpportunityReturnPath(opportunity),
  });
  if (opportunity.topicId || opportunity.id) {
    params.set("opp_id", opportunity.topicId || opportunity.id);
  }
  if (opportunity.topicCode) {
    params.set("opp_code", opportunity.topicCode);
  }
  if (opportunity.topicTitle) {
    params.set("opp_title", opportunity.topicTitle);
  }
  return `/access?${params.toString()}`;
}

function buildOpportunityEmailHref(opportunity: Opportunity): string {
  const sourceUrl = getOpportunityHref(opportunity);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://mergecombinator.com";
  const accessUrl = `${origin}${buildOpportunityAccessUrl(opportunity, "opportunity-email")}`;
  const subject = `Opportunity worth reviewing: ${opportunity.topicTitle}`;
  const lines = [
    opportunity.topicTitle,
    opportunity.topicCode ? `Code: ${opportunity.topicCode}` : null,
    `Component: ${opportunity.component}`,
    `Program: ${opportunity.program}`,
    `Status: ${opportunity.topicStatus}`,
    `Source: ${sourceUrl}`,
    "",
    `Want operator access or help getting matched to the right path? ${accessUrl}`,
  ].filter(Boolean);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function buildSavedOpportunitiesEmailHref(saved: Opportunity[]): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://mergecombinator.com";
  const subject = `Saved opportunities from Merge Combinator`;
  const lines = [
    "Saved opportunities:",
    "",
    ...saved.flatMap((opportunity, index) => {
      const sourceUrl = getOpportunityHref(opportunity);
      const accessUrl = `${origin}${buildOpportunityAccessUrl(opportunity, "saved-email")}`;
      return [
        `${index + 1}. ${opportunity.topicTitle}`,
        opportunity.topicCode ? `Code: ${opportunity.topicCode}` : null,
        `Component: ${opportunity.component} | Program: ${opportunity.program}`,
        `Source: ${sourceUrl}`,
        `Get matched: ${accessUrl}`,
        "",
      ].filter(Boolean) as string[];
    }),
  ];
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function OpportunityModal({
  opportunity,
  onClose,
  onToggleSave,
  isSaved,
}: {
  opportunity: Opportunity;
  onClose: () => void;
  onToggleSave: (opportunity: Opportunity) => void;
  isSaved: boolean;
}): React.JSX.Element {
  const linkHref = getOpportunityHref(opportunity);
  const isExternalLink = isHumanReadableSourceUrl(opportunity.url);
  const accessHref = buildOpportunityAccessUrl(opportunity);
  const emailHref = buildOpportunityEmailHref(opportunity);
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
        .modal-status-strip {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: var(--mc-bg-tertiary);
          border-radius: 2px;
          font-size: 0.8125rem;
          flex-wrap: wrap;
        }
        .modal-status-strip__badge {
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 2px;
        }
        .modal-status-strip__separator {
          width: 1px;
          height: 1rem;
          background: var(--mc-border);
        }
        .modal-status-strip__item {
          color: var(--mc-text-muted);
        }
        .modal-status-strip__item--urgent {
          color: var(--mc-warning);
          font-weight: 600;
        }
        .modal-phase-details {
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          margin-bottom: 0.5rem;
        }
        .modal-phase-details summary {
          padding: 0.625rem 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--mc-text);
          cursor: pointer;
          list-style: none;
        }
        .modal-phase-details summary::-webkit-details-marker { display: none; }
        .modal-phase-details[open] summary {
          border-bottom: 1px solid var(--mc-border);
        }
        .modal-phase-details .modal-description {
          padding: 0.75rem 1rem;
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
          gap: 1rem;
          flex-wrap: wrap;
        }
        .modal-footer-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
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
              <h2 className="modal-title">{opportunity.topicTitle}</h2>
              <div className="modal-topic-code" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
                {opportunity.source.toUpperCase()}
                {normalizeTopicCode(opportunity.topicCode) ? ` • ${normalizeTopicCode(opportunity.topicCode)}` : ""}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--mc-text-muted)", marginTop: "0.125rem" }}>
                {opportunity.component}{opportunity.program ? ` / ${opportunity.program}` : ""}
              </div>
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
            {(() => {
              const statusColor = getStatusColor(opportunity.topicStatus);
              const statusLabel = getStatusLabel(opportunity.topicStatus);
              const deadline = getDeadlineDisplay(opportunity.responseDeadline ?? opportunity.closeDate);
              const estValue = formatEstimatedValue(opportunity.estimatedValue);
              return (
                <div className="modal-status-strip" style={{ borderLeft: `3px solid ${statusColor}` }}>
                  <span
                    className="modal-status-strip__badge"
                    style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 15%, transparent)` }}
                  >
                    {statusLabel}
                  </span>
                  <span className="modal-status-strip__separator" />
                  <span className={deadline.urgent ? "modal-status-strip__item--urgent" : "modal-status-strip__item"}>
                    {deadline.text}
                  </span>
                  <span className="modal-status-strip__separator" />
                  <span className="modal-status-strip__item">
                    Posted {formatDate(opportunity.postedDate)}
                  </span>
                  {estValue && (
                    <>
                      <span className="modal-status-strip__separator" />
                      <span className="modal-status-strip__item" style={{ fontWeight: 500, color: "var(--mc-text)" }}>
                        {estValue}
                      </span>
                    </>
                  )}
                </div>
              );
            })()}

            {opportunity.objective && (
              <div>
                <div className="modal-section-label">Objective</div>
                <RichTextBlock text={opportunity.objective} />
                {!htmlToParagraphs(opportunity.objective).length && (
                  <p className="modal-description">
                    {sanitizeText(opportunity.objective)}
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="modal-section-label">Description</div>
              <RichTextBlock text={opportunity.description} />
              {!htmlToParagraphs(opportunity.description).length && (
                <p className="modal-description">
                  {sanitizeText(opportunity.description)}
                </p>
              )}
            </div>

            {(opportunity.phase1Description || opportunity.phase2Description || opportunity.phase3Description) && (
              <div>
                <div className="modal-section-label">Phase Breakdown</div>
                {opportunity.phase1Description && (
                  <details className="modal-phase-details">
                    <summary>Phase I</summary>
                    <div className="modal-description">
                      <RichTextBlock text={opportunity.phase1Description} />
                      {!htmlToParagraphs(opportunity.phase1Description).length && (
                        <p style={{ color: "var(--mc-text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                          {sanitizeText(opportunity.phase1Description)}
                        </p>
                      )}
                    </div>
                  </details>
                )}
                {opportunity.phase2Description && (
                  <details className="modal-phase-details">
                    <summary>Phase II</summary>
                    <div className="modal-description">
                      <RichTextBlock text={opportunity.phase2Description} />
                      {!htmlToParagraphs(opportunity.phase2Description).length && (
                        <p style={{ color: "var(--mc-text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                          {sanitizeText(opportunity.phase2Description)}
                        </p>
                      )}
                    </div>
                  </details>
                )}
                {opportunity.phase3Description && (
                  <details className="modal-phase-details">
                    <summary>Phase III</summary>
                    <div className="modal-description">
                      <RichTextBlock text={opportunity.phase3Description} />
                      {!htmlToParagraphs(opportunity.phase3Description).length && (
                        <p style={{ color: "var(--mc-text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                          {sanitizeText(opportunity.phase3Description)}
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}

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
            <div className="modal-footer-actions">
              <a
                className="modal-footer-link"
                href={linkHref}
                {...(isExternalLink
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {getOpportunityLinkLabel(opportunity)}
              </a>
              <a className="modal-footer-link" href={emailHref}>
                Email this
              </a>
              <button
                className="modal-footer-link"
                type="button"
                onClick={() => onToggleSave(opportunity)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {isSaved ? "Remove saved" : "Save"}
              </button>
              <a className="modal-footer-link" href={accessHref}>
                Get matched
              </a>
            </div>
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

  // Profile hook replaces old useSavedOpportunities
  const { profile, hasProfile, createProfile, updateProfile, clearProfile, toggleSavedId, isSaved } = useProfile();

  // Intake/skip state (persisted so migrated users don't see intake every page load)
  const [skippedIntake, setSkippedIntake] = useState(() => {
    try { return localStorage.getItem("mc-opportunity-skip-intake") === "1"; } catch { return false; }
  });
  const persistSkip = (): void => {
    setSkippedIntake(true);
    try { localStorage.setItem("mc-opportunity-skip-intake", "1"); } catch { /* ignore */ }
  };

  // Auto-skip intake for /sbir and /sttr routes
  useEffect(() => {
    if (mode === "sbir" || mode === "sttr") {
      persistSkip();
    }
  }, [mode]);

  const isFullProfile = hasProfile && (profile!.techAreas.length > 0 || profile!.problemAreas.length > 0);
  const showIntake = !isFullProfile && !skippedIntake;

  // All-opportunities cache for grouped views and saved-tab resolution
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [allOppsLoading, setAllOppsLoading] = useState(false);

  const needsAllOpps =
    (isFullProfile && profile!.viewMode !== "opportunity") ||
    activeTab === "saved";

  useEffect(() => {
    if (!needsAllOpps || allOpportunities.length > 0 || allOppsLoading) return;
    let cancelled = false;
    setAllOppsLoading(true);
    void fetchOpportunities({ size: 200, status: "active" }).then(
      (res) => {
        if (!cancelled) {
          setAllOpportunities(res.data);
          setAllOppsLoading(false);
        }
      },
      () => {
        if (!cancelled) setAllOppsLoading(false);
      },
    );
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAllOpps]);

  // Bridge: resolve savedIds to full Opportunity objects for SavedPanel
  const savedCount = profile?.savedIds.length ?? 0;
  const savedOpportunities = useMemo(() => {
    if (!profile || profile.savedIds.length === 0) return [];
    const idSet = new Set(profile.savedIds);
    return allOpportunities.filter((opp) => idSet.has(opp.id) || idSet.has(opp.topicId));
  }, [profile, allOpportunities]);
  const savedEmailHref = useMemo(() => buildSavedOpportunitiesEmailHref(savedOpportunities), [savedOpportunities]);

  // Bridge functions for components that expect (opportunity: Opportunity) signatures
  const handleToggleSave = (opp: Opportunity): void => toggleSavedId(opp.id || opp.topicId);
  const handleIsSaved = (opp: Opportunity): boolean => isSaved(opp.id) || isSaved(opp.topicId);
  const handleClearSaved = (): void => {
    if (!profile) return;
    // Clear all saved IDs by toggling each one off
    for (const id of [...profile.savedIds]) {
      toggleSavedId(id);
    }
  };

  useEffect(() => {
    if (!selectedOpportunity) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setSelectedOpportunity(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOpportunity]);

  const tabs = [
    { id: "solicitations", label: "Solicitations" },
    { id: "saved", label: "Saved", count: savedCount || undefined },
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

  // Intake flow — first-time visitors without a full profile
  if (showIntake) {
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
        <IntakeFlow
          onComplete={createProfile}
          onSkip={persistSkip}
        />
      </div>
    );
  }

  // Determine active view mode for personalized feed
  const viewMode: ViewMode = isFullProfile ? profile!.viewMode : "opportunity";

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

      {isFullProfile && (
        <ProfileBar
          profile={profile!}
          onEditPreferences={() => updateProfile({ techAreas: [], problemAreas: [] })}
          onClearProfile={() => { clearProfile(); setSkippedIntake(false); try { localStorage.removeItem("mc-opportunity-skip-intake"); } catch { /* ignore */ } }}
          onChangeViewMode={(m) => updateProfile({ viewMode: m })}
        />
      )}

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "solicitations" && viewMode === "opportunity" && (
        <OpportunityList
          onSelect={setSelectedOpportunity}
          initialKeyword={seo.keyword}
          onToggleSave={handleToggleSave}
          isSaved={handleIsSaved}
        />
      )}

      {activeTab === "solicitations" && viewMode === "stakeholder" && (
        allOppsLoading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--mc-text-muted)" }}>
            Loading opportunities...
          </div>
        ) : (
          <GroupedFeed
            opportunities={allOpportunities}
            groupBy="component"
            profile={profile!}
            onSelectOpportunity={setSelectedOpportunity}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )
      )}

      {activeTab === "solicitations" && viewMode === "mission" && (
        allOppsLoading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--mc-text-muted)" }}>
            Loading opportunities...
          </div>
        ) : (
          <GroupedFeed
            opportunities={allOpportunities}
            groupBy="problemArea"
            profile={profile!}
            onSelectOpportunity={setSelectedOpportunity}
            onToggleSave={handleToggleSave}
            isSaved={isSaved}
          />
        )
      )}

      {activeTab === "saved" && (
        <SavedPanel
          saved={savedOpportunities}
          onSelect={setSelectedOpportunity}
          onToggleSave={handleToggleSave}
          onClearSaved={handleClearSaved}
          emailSavedHref={savedEmailHref}
        />
      )}

      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onToggleSave={handleToggleSave}
          isSaved={handleIsSaved(selectedOpportunity)}
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
  const { isSaved, toggleSavedId } = useProfile();

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
  const externalSourceUrl = getSourceUrl(opportunity);
  const sourceLabel = "View primary source";
  const accessHref = buildOpportunityAccessUrl(opportunity);
  const emailHref = buildOpportunityEmailHref(opportunity);
  const saved = isSaved(opportunity.id) || isSaved(opportunity.topicId);
  const hasPhases = opportunity.phase1Description || opportunity.phase2Description || opportunity.phase3Description;

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
        {opportunity.source.toUpperCase()}
        {normalizeTopicCode(opportunity.topicCode) ? ` • ${normalizeTopicCode(opportunity.topicCode)}` : ""}
        {" • "}{opportunity.component}
        {opportunity.program ? ` • ${opportunity.program}` : ""}
      </p>
      {opportunity.solicitationTitle && (
        <p style={{ color: "var(--mc-text-muted)", marginTop: "-0.5rem", marginBottom: "1.25rem" }}>
          {opportunity.solicitationTitle}
        </p>
      )}

      {(() => {
        const statusColor = getStatusColor(opportunity.topicStatus);
        const statusLabel = getStatusLabel(opportunity.topicStatus);
        const deadlineInfo = getDeadlineDisplay(dueDate);
        const estValue = formatEstimatedValue(opportunity.estimatedValue);
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.75rem 1rem",
              background: "var(--mc-bg-tertiary)",
              borderRadius: "2px",
              borderLeft: `3px solid ${statusColor}`,
              fontSize: "0.8125rem",
              flexWrap: "wrap",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.75rem",
                padding: "0.125rem 0.5rem",
                borderRadius: "2px",
                color: statusColor,
                background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              }}
            >
              {statusLabel}
            </span>
            <span style={{ width: "1px", height: "1rem", background: "var(--mc-border)" }} />
            <span style={deadlineInfo.urgent ? { color: "var(--mc-warning)", fontWeight: 600 } : { color: "var(--mc-text-muted)" }}>
              {deadlineInfo.text}
            </span>
            <span style={{ width: "1px", height: "1rem", background: "var(--mc-border)" }} />
            <span style={{ color: "var(--mc-text-muted)" }}>
              Posted {formatDate(opportunity.postedDate)}
            </span>
            {estValue && (
              <>
                <span style={{ width: "1px", height: "1rem", background: "var(--mc-border)" }} />
                <span style={{ fontWeight: 500, color: "var(--mc-text)" }}>
                  {estValue}
                </span>
              </>
            )}
          </div>
        );
      })()}

      {externalSourceUrl && (
        <p style={{ marginBottom: "0.75rem" }}>
          <a
            href={externalSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--mc-accent)" }}
          >
            {sourceLabel}
          </a>
        </p>
      )}
      <p
        style={{
          marginBottom: "1.25rem",
          display: "flex",
          gap: "0.9rem",
          flexWrap: "wrap",
        }}
      >
        <a href={emailHref} style={{ color: "var(--mc-accent)" }}>
          Email this
        </a>
        <a href={accessHref} style={{ color: "var(--mc-accent)" }}>
          Get matched through Merge
        </a>
        <button
          type="button"
          onClick={() => toggleSavedId(opportunity.id || opportunity.topicId)}
          style={{
            color: "var(--mc-accent)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            font: "inherit",
          }}
        >
          {saved ? "Remove saved" : "Save"}
        </button>
      </p>

      {opportunity.objective && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>Objective</h2>
          <RichTextBlock text={opportunity.objective} />
        </section>
      )}

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>Description</h2>
        <RichTextBlock text={opportunity.description} />
      </section>

      {hasPhases && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>Phase Breakdown</h2>
          {opportunity.phase1Description && (
            <details
              style={{
                border: "1px solid var(--mc-border)",
                borderRadius: "2px",
                marginBottom: "0.5rem",
              }}
            >
              <summary
                style={{
                  padding: "0.625rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--mc-text)",
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                Phase I
              </summary>
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--mc-border)" }}>
                <RichTextBlock text={opportunity.phase1Description} />
              </div>
            </details>
          )}
          {opportunity.phase2Description && (
            <details
              style={{
                border: "1px solid var(--mc-border)",
                borderRadius: "2px",
                marginBottom: "0.5rem",
              }}
            >
              <summary
                style={{
                  padding: "0.625rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--mc-text)",
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                Phase II
              </summary>
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--mc-border)" }}>
                <RichTextBlock text={opportunity.phase2Description} />
              </div>
            </details>
          )}
          {opportunity.phase3Description && (
            <details
              style={{
                border: "1px solid var(--mc-border)",
                borderRadius: "2px",
                marginBottom: "0.5rem",
              }}
            >
              <summary
                style={{
                  padding: "0.625rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--mc-text)",
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                Phase III
              </summary>
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--mc-border)" }}>
                <RichTextBlock text={opportunity.phase3Description} />
              </div>
            </details>
          )}
        </section>
      )}

      {opportunity.technologyAreas && opportunity.technologyAreas.length > 0 && (
        <section style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>Technology Areas</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {opportunity.technologyAreas.map((area) => (
              <span
                key={area}
                style={{
                  fontSize: "0.75rem",
                  color: "var(--mc-text-muted)",
                  background: "var(--mc-bg-tertiary)",
                  border: "1px solid var(--mc-border)",
                  padding: "0.25rem 0.55rem",
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {opportunity.focusAreas && opportunity.focusAreas.length > 0 && (
        <section style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>Focus Areas</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {opportunity.focusAreas.map((area) => (
              <span
                key={area}
                style={{
                  fontSize: "0.75rem",
                  color: "var(--mc-text-muted)",
                  background: "var(--mc-bg-tertiary)",
                  border: "1px solid var(--mc-border)",
                  padding: "0.25rem 0.55rem",
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {opportunity.referenceDocuments && opportunity.referenceDocuments.length > 0 && (
        <section style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.65rem" }}>References</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {opportunity.referenceDocuments.map((document, index) => (
              <div
                key={`${document.title}-${index}`}
                style={{
                  padding: "0.9rem 1rem",
                  border: "1px solid var(--mc-border)",
                  background: "var(--charcoal)",
                }}
              >
                <div style={{ color: "var(--mc-text-muted)", lineHeight: 1.65 }}>
                  {sanitizeText(document.title)}
                </div>
                {document.url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--mc-accent)" }}
                    >
                      Open reference
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
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
