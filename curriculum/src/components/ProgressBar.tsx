import React from "react";

interface ProgressBarProps {
  engaged: number;
  total: number;
  timeSpent?: number;
}

function ProgressBar({ engaged, total, timeSpent }: ProgressBarProps): React.JSX.Element {
  const percentage = total > 0 ? (engaged / total) * 100 : 0;
  const displayTime = timeSpent ? `${Math.floor(timeSpent / 60)}h ${timeSpent % 60}m` : "";

  return (
    <>
      <style>{`
        .progress-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .progress-bar-track {
          width: 100%;
          height: 6px;
          background: var(--ghost-gray);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--blue);
          border-radius: 2px;
          transition: width 200ms ease;
        }
        .progress-bar-label {
          font-family: var(--font-primary);
          font-size: 12px;
          color: var(--gray-medium);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .progress-bar-text {
          flex: 1;
        }
        .progress-bar-time {
          white-space: nowrap;
          margin-left: 12px;
        }
      `}</style>
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={engaged}
            aria-valuemin={0}
            aria-valuemax={total}
          />
        </div>
        <div className="progress-bar-label">
          <span className="progress-bar-text">
            {engaged} of {total} resources
          </span>
          {displayTime && <span className="progress-bar-time">{displayTime}</span>}
        </div>
      </div>
    </>
  );
}

export default ProgressBar;
