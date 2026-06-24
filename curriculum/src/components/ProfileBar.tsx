import { useState } from "react";
import type { OpportunityProfile, ViewMode } from "../types/profile";

interface ProfileBarProps {
  profile: OpportunityProfile;
  onEditPreferences: () => void;
  onClearProfile: () => void;
  onChangeViewMode: (mode: ViewMode) => void;
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "opportunity", label: "Opportunities" },
  { id: "stakeholder", label: "Stakeholders" },
  { id: "mission", label: "Missions" },
];

const CHIP_DISPLAY_LIMIT = 4;

function ProfileBar({
  profile,
  onEditPreferences,
  onClearProfile,
  onChangeViewMode,
}: ProfileBarProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const techChips = profile.techAreas;
  const problemChips = profile.problemAreas;
  const allChips = [
    ...techChips.map((label) => ({ label, type: "tech" as const })),
    ...problemChips.map((label) => ({ label, type: "problem" as const })),
  ];

  const hasOverflow = allChips.length > CHIP_DISPLAY_LIMIT;
  const visibleChips = expanded ? allChips : allChips.slice(0, CHIP_DISPLAY_LIMIT);
  const overflowCount = allChips.length - CHIP_DISPLAY_LIMIT;

  return (
    <>
      <style>{`
        .pbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          flex-wrap: wrap;
        }
        .pbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .pbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .pbar-chip {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          padding: 4px 6px;
          border-radius: 2px;
          background: transparent;
          border: 1px solid;
          cursor: default;
          white-space: nowrap;
          line-height: 1;
          user-select: none;
        }
        .pbar-chip--tech {
          border-color: var(--blue);
          color: var(--blue);
        }
        .pbar-chip--problem {
          border-color: var(--ghost-gray);
          color: var(--gray-light);
        }
        .pbar-chip--more {
          border-color: var(--ghost-gray);
          color: var(--gray-light);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease;
        }
        .pbar-chip--more:hover {
          border-color: var(--blue);
          color: var(--offwhite);
        }
        .pbar-modes {
          display: flex;
          gap: 0;
        }
        .pbar-mode-btn {
          font-family: var(--font-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border: 1px solid var(--ghost-gray);
          background: transparent;
          color: var(--gray-light);
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
          border-radius: 0;
          line-height: 1;
        }
        .pbar-mode-btn:first-child {
          border-radius: 2px 0 0 2px;
        }
        .pbar-mode-btn:last-child {
          border-radius: 0 2px 2px 0;
        }
        .pbar-mode-btn + .pbar-mode-btn {
          border-left: none;
        }
        .pbar-mode-btn:hover {
          color: var(--offwhite);
          border-color: var(--blue);
        }
        .pbar-mode-btn + .pbar-mode-btn:hover {
          border-left: 1px solid var(--blue);
          margin-left: -1px;
          padding-left: 13px;
        }
        .pbar-mode-btn--active {
          background: var(--blue);
          color: #ffffff;
          border-color: var(--blue);
        }
        .pbar-mode-btn--active:hover {
          background: var(--blue);
          color: #ffffff;
          border-color: var(--blue);
        }
        .pbar-mode-btn--active + .pbar-mode-btn {
          border-left-color: var(--blue);
        }
        .pbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pbar-action {
          font-family: var(--font-primary);
          font-size: 12px;
          font-weight: 400;
          color: var(--gray-medium);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 150ms ease;
          text-decoration: none;
        }
        .pbar-action:hover {
          color: var(--offwhite);
          text-decoration: underline;
        }
        @media (max-width: 640px) {
          .pbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .pbar-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
      <div className="pbar" role="toolbar" aria-label="Profile and view controls">
        <div className="pbar-left">
          {visibleChips.map((chip) => (
            <span
              key={`${chip.type}-${chip.label}`}
              className={`pbar-chip pbar-chip--${chip.type}`}
            >
              {chip.label}
            </span>
          ))}
          {hasOverflow && !expanded && (
            <button
              type="button"
              className="pbar-chip pbar-chip--more"
              onClick={() => setExpanded(true)}
              aria-label={`Show ${overflowCount} more selections`}
            >
              +{overflowCount} more
            </button>
          )}
          {expanded && hasOverflow && (
            <button
              type="button"
              className="pbar-chip pbar-chip--more"
              onClick={() => setExpanded(false)}
              aria-label="Show fewer selections"
            >
              less
            </button>
          )}
          <div className="pbar-actions">
            <button
              type="button"
              className="pbar-action"
              onClick={onEditPreferences}
            >
              Edit preferences
            </button>
            <button
              type="button"
              className="pbar-action"
              onClick={onClearProfile}
            >
              Clear profile
            </button>
          </div>
        </div>
        <div className="pbar-right">
          <div className="pbar-modes" role="group" aria-label="View mode">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`pbar-mode-btn${profile.viewMode === mode.id ? " pbar-mode-btn--active" : ""}`}
                onClick={() => onChangeViewMode(mode.id)}
                aria-pressed={profile.viewMode === mode.id}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileBar;
