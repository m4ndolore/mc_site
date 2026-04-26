import { useState } from "react";
import type { ViewMode } from "../types/profile";

interface IntakeFlowProps {
  onComplete: (techAreas: string[], problemAreas: string[], viewMode: ViewMode) => void;
  onSkip: () => void;
}

const TECH_AREAS = [
  "AI / Machine Learning",
  "Autonomous Systems",
  "Biotechnology",
  "Command & Control",
  "Communications",
  "Counter-UAS",
  "Cybersecurity",
  "Directed Energy",
  "Electronic Warfare",
  "Hypersonics",
  "Intelligence & Surveillance",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Materials & Composites",
  "Microelectronics",
  "Quantum",
  "Sensors",
  "Software & Data",
  "Space",
  "Unmanned Systems",
] as const;

const PROBLEM_AREAS = [
  "Administration",
  "Command and Control",
  "Communications",
  "Cyber",
  "Force Protection",
  "Information",
  "Intel & Battlespace Awareness",
  "Joint Fires",
  "Logistics",
  "Maintenance",
  "Planning",
] as const;

const VIEW_MODE_OPTIONS: { id: ViewMode; title: string; description: string }[] = [
  {
    id: "opportunity",
    title: "By Opportunity",
    description: "Show me open solicitations I can apply to now",
  },
  {
    id: "stakeholder",
    title: "By Stakeholder",
    description: "Show me which agencies are buying what I build",
  },
  {
    id: "mission",
    title: "By Mission Area",
    description: "Show me what problems need solving in my space",
  },
];

function IntakeFlow({ onComplete, onSkip }: IntakeFlowProps): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTechAreas, setSelectedTechAreas] = useState<string[]>([]);
  const [selectedProblemAreas, setSelectedProblemAreas] = useState<string[]>([]);
  const [selectedViewMode, setSelectedViewMode] = useState<ViewMode>("opportunity");

  function toggleTechArea(area: string): void {
    setSelectedTechAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  function toggleProblemArea(area: string): void {
    setSelectedProblemAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  function handleNext(): void {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function handleBack(): void {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function handleComplete(): void {
    onComplete(selectedTechAreas, selectedProblemAreas, selectedViewMode);
  }

  return (
    <>
      <style>{`
        .intake-container {
          max-width: 640px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .intake-step-title {
          font-family: var(--font-primary);
          font-size: clamp(22px, 2.5vw, 28px);
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--offwhite);
          text-align: center;
          margin-bottom: 8px;
        }
        .intake-step-subtitle {
          font-family: var(--font-primary);
          font-size: 16px;
          color: var(--gray-light);
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .intake-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          width: 100%;
          margin-bottom: 40px;
        }
        .intake-chip {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          color: var(--offwhite);
          background: var(--charcoal);
          border: 1px solid var(--ghost-gray);
          border-radius: 2px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
          user-select: none;
        }
        .intake-chip:hover {
          border-color: var(--blue);
        }
        .intake-chip--selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--blue);
          color: var(--offwhite);
        }
        .intake-card-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin-bottom: 40px;
        }
        .intake-card {
          background: var(--charcoal);
          border: 1px solid var(--ghost-gray);
          border-radius: 2px;
          padding: 24px;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
          text-align: left;
        }
        .intake-card:hover {
          border-color: var(--blue);
        }
        .intake-card--selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--blue);
        }
        .intake-card__title {
          font-family: var(--font-primary);
          font-size: 16px;
          font-weight: 600;
          color: var(--offwhite);
          margin-bottom: 4px;
        }
        .intake-card__description {
          font-family: var(--font-primary);
          font-size: 14px;
          color: var(--gray-light);
          line-height: 1.5;
        }
        .intake-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          margin-bottom: 24px;
        }
        .intake-btn-primary {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background: var(--blue);
          border: 1px solid var(--blue);
          border-radius: 2px;
          padding: 12px 24px;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .intake-btn-primary:hover {
          background: var(--blue-dark);
          border-color: var(--blue-dark);
        }
        .intake-btn-secondary {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          color: var(--offwhite);
          background: transparent;
          border: 1px solid var(--ghost-gray);
          border-radius: 2px;
          padding: 12px 24px;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease;
        }
        .intake-btn-secondary:hover {
          border-color: var(--offwhite);
          color: #ffffff;
        }
        .intake-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .intake-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ghost-gray);
          transition: background 150ms ease;
        }
        .intake-dot--active {
          background: var(--blue);
        }
        .intake-skip {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 400;
          color: var(--gray-light);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          transition: color 150ms ease;
        }
        .intake-skip:hover {
          color: var(--offwhite);
          text-decoration: underline;
        }
      `}</style>
      <div className="intake-container">
        {step === 1 && (
          <>
            <h2 className="intake-step-title">
              What technology areas are you working in?
            </h2>
            <p className="intake-step-subtitle">
              Select the areas relevant to your work. We will use this to surface
              the most relevant opportunities.
            </p>
            <div className="intake-chip-grid">
              {TECH_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  className={`intake-chip${selectedTechAreas.includes(area) ? " intake-chip--selected" : ""}`}
                  onClick={() => toggleTechArea(area)}
                  aria-pressed={selectedTechAreas.includes(area)}
                >
                  {area}
                </button>
              ))}
            </div>
            <div className="intake-nav">
              <button
                type="button"
                className="intake-btn-primary"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="intake-step-title">
              What problem areas are you focused on?
            </h2>
            <p className="intake-step-subtitle">
              Select the mission problem areas you are working to solve.
            </p>
            <div className="intake-chip-grid">
              {PROBLEM_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  className={`intake-chip${selectedProblemAreas.includes(area) ? " intake-chip--selected" : ""}`}
                  onClick={() => toggleProblemArea(area)}
                  aria-pressed={selectedProblemAreas.includes(area)}
                >
                  {area}
                </button>
              ))}
            </div>
            <div className="intake-nav">
              <button
                type="button"
                className="intake-btn-secondary"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="button"
                className="intake-btn-primary"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="intake-step-title">
              How do you want to explore?
            </h2>
            <p className="intake-step-subtitle">
              Choose how opportunities are organized for you.
            </p>
            <div className="intake-card-grid">
              {VIEW_MODE_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`intake-card${selectedViewMode === option.id ? " intake-card--selected" : ""}`}
                  onClick={() => setSelectedViewMode(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedViewMode(option.id);
                    }
                  }}
                  role="radio"
                  aria-checked={selectedViewMode === option.id}
                  tabIndex={0}
                >
                  <div className="intake-card__title">{option.title}</div>
                  <div className="intake-card__description">{option.description}</div>
                </div>
              ))}
            </div>
            <div className="intake-nav">
              <button
                type="button"
                className="intake-btn-secondary"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="button"
                className="intake-btn-primary"
                onClick={handleComplete}
              >
                Start exploring
              </button>
            </div>
          </>
        )}

        <div className="intake-progress">
          <div className={`intake-dot${step === 1 ? " intake-dot--active" : ""}`} />
          <div className={`intake-dot${step === 2 ? " intake-dot--active" : ""}`} />
          <div className={`intake-dot${step === 3 ? " intake-dot--active" : ""}`} />
        </div>
        <button
          type="button"
          className="intake-skip"
          onClick={onSkip}
        >
          Skip — show me everything
        </button>
      </div>
    </>
  );
}

export default IntakeFlow;
