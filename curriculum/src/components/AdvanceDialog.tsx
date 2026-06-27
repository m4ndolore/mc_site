import React, { useState } from "react";
import { logEvent } from "../lib/events";

interface AdvanceDialogProps {
  onSubmit: (reason: string) => void;
  onCancel?: () => void;
  stageId?: string;
}

const ADVANCE_REASONS = [
  "I understood the content",
  "I already know this material",
  "I want to explore advanced topics",
  "I need a break",
  "Other",
];

function AdvanceDialog({ onSubmit, onCancel, stageId }: AdvanceDialogProps): React.JSX.Element {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");

  const handleSubmit = async () => {
    const reason = selectedReason === "Other" ? otherReason : selectedReason;

    if (!reason.trim()) {
      return;
    }

    await logEvent({
      eventType: "advance_request",
      stageId,
      metadata: { reason },
    });

    onSubmit(reason);
  };

  const isOtherSelected = selectedReason === "Other";
  const canSubmit = selectedReason && (!isOtherSelected || otherReason.trim());

  return (
    <>
      <style>{`
        .advance-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .advance-dialog-modal {
          background: var(--bg-primary);
          border: 1px solid var(--ghost-gray);
          border-radius: 4px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        .advance-dialog-title {
          font-family: var(--font-primary);
          font-size: 18px;
          font-weight: 600;
          color: var(--offwhite);
          margin-bottom: 20px;
        }
        .advance-dialog-subtitle {
          font-family: var(--font-primary);
          font-size: 13px;
          color: var(--gray-medium);
          margin-bottom: 16px;
        }
        .advance-dialog-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .advance-dialog-option {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 8px;
          border-radius: 2px;
          transition: background 150ms ease;
        }
        .advance-dialog-option:hover {
          background: rgba(59, 130, 246, 0.05);
        }
        .advance-dialog-radio {
          width: 18px;
          height: 18px;
          border: 2px solid var(--gray-medium);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 150ms ease;
          cursor: pointer;
        }
        .advance-dialog-option:hover .advance-dialog-radio {
          border-color: var(--blue);
        }
        .advance-dialog-option input[type="radio"]:checked ~ .advance-dialog-radio {
          border-color: var(--blue);
        }
        .advance-dialog-radio::after {
          content: "";
          width: 8px;
          height: 8px;
          background: var(--blue);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 150ms ease;
        }
        .advance-dialog-option input[type="radio"]:checked ~ .advance-dialog-radio::after {
          opacity: 1;
        }
        .advance-dialog-label {
          font-family: var(--font-primary);
          font-size: 14px;
          color: var(--offwhite);
          cursor: pointer;
          flex: 1;
        }
        .advance-dialog-input {
          width: 100%;
          padding: 10px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid var(--ghost-gray);
          border-radius: 2px;
          color: var(--offwhite);
          font-family: var(--font-primary);
          font-size: 14px;
          margin-top: 8px;
        }
        .advance-dialog-input::placeholder {
          color: var(--gray-medium);
        }
        .advance-dialog-input:focus {
          outline: none;
          border-color: var(--blue);
        }
        .advance-dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .advance-dialog-button {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          padding: 10px 16px;
          border-radius: 2px;
          border: 1px solid var(--ghost-gray);
          background: transparent;
          color: var(--gray-light);
          cursor: pointer;
          transition: all 150ms ease;
        }
        .advance-dialog-button:hover:not(:disabled) {
          border-color: var(--blue);
          color: var(--offwhite);
        }
        .advance-dialog-button--primary {
          background: var(--blue);
          color: #ffffff;
          border-color: var(--blue);
        }
        .advance-dialog-button--primary:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }
        .advance-dialog-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="advance-dialog-overlay" onClick={onCancel}>
        <div
          className="advance-dialog-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="advance-dialog-title">Ready to Advance?</h2>
          <p className="advance-dialog-subtitle">
            Tell us why you'd like to move to the next stage
          </p>

          <div className="advance-dialog-options">
            {ADVANCE_REASONS.map((reason) => (
              <label key={reason} className="advance-dialog-option">
                <input
                  type="radio"
                  name="advance-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{ display: "none" }}
                />
                <div className="advance-dialog-radio" />
                <span className="advance-dialog-label">{reason}</span>
              </label>
            ))}
          </div>

          {isOtherSelected && (
            <input
              type="text"
              className="advance-dialog-input"
              placeholder="Please describe your reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
            />
          )}

          <div className="advance-dialog-actions">
            <button
              type="button"
              className="advance-dialog-button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="advance-dialog-button advance-dialog-button--primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Advance to Next Stage
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdvanceDialog;
