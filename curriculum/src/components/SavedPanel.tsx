import type { Opportunity } from "../types/opportunity";
import OpportunityCard from "./OpportunityCard";

interface SavedPanelProps {
  saved: Opportunity[];
  onSelect: (opportunity: Opportunity) => void;
  onToggleSave: (opportunity: Opportunity) => void;
  onClearSaved: () => void;
  emailSavedHref: string;
}

function SavedPanel({
  saved,
  onSelect,
  onToggleSave,
  onClearSaved,
  emailSavedHref,
}: SavedPanelProps): React.JSX.Element {
  return (
    <>
      <style>{`
        .saved-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .saved-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 1.25rem;
          background: var(--charcoal);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
        }
        .saved-panel__title {
          font-size: 1rem;
          color: var(--mc-text);
          margin-bottom: 0.25rem;
        }
        .saved-panel__subtitle {
          font-size: 0.875rem;
          color: var(--mc-text-muted);
          max-width: 42rem;
        }
        .saved-panel__actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .saved-panel__action {
          padding: 0.55rem 0.9rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--mc-text);
          background: var(--mc-bg-tertiary);
          border: 1px solid var(--mc-border);
          border-radius: 2px;
          cursor: pointer;
        }
        .saved-panel__action:hover {
          border-color: var(--mc-accent);
          color: var(--mc-accent);
        }
        .saved-panel__empty {
          padding: 3rem 1rem;
          text-align: center;
          color: var(--mc-text-muted);
          border: 1px dashed var(--mc-border);
          border-radius: 2px;
        }
        .saved-panel__grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .saved-panel__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .saved-panel__grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="saved-panel">
        <div className="saved-panel__header">
          <div>
            <div className="saved-panel__title">Saved opportunities</div>
            <div className="saved-panel__subtitle">
              Keep the deals you want to revisit, then email the list to yourself or a teammate.
            </div>
          </div>
          {saved.length > 0 && (
            <div className="saved-panel__actions">
              <a className="saved-panel__action" href={emailSavedHref}>
                Email saved list
              </a>
              <button className="saved-panel__action" type="button" onClick={onClearSaved}>
                Clear saved
              </button>
            </div>
          )}
        </div>

        {saved.length === 0 ? (
          <div className="saved-panel__empty">
            Nothing saved yet. Save a few opportunities from the main feed and they’ll show up here.
          </div>
        ) : (
          <div className="saved-panel__grid">
            {saved.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id || opportunity.topicId}
                opportunity={opportunity}
                onClick={onSelect}
                onToggleSave={onToggleSave}
                isSaved
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SavedPanel;
