import { useState } from 'react'
import type { Stage } from '../types/curriculum'

interface Props {
  stage: Stage
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function AdvanceDialog({ stage, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const reasonOptions = [
    { id: 'mastered', label: 'I feel ready', icon: '✓' },
    { id: 'sufficient', label: 'This is sufficient for now', icon: '→' },
    { id: 'need-context', label: 'I need broader context first', icon: '?' },
    { id: 'already-know', label: "I already know this stage's material", icon: '★' },
    { id: 'other', label: 'Other reason', icon: '✎' },
  ]

  const selectedOption = reasonOptions.find(o => o.id === reason)
  const handleConfirm = () => {
    const finalReason = reason === 'other' ? customReason : reason
    if (finalReason) {
      onConfirm(finalReason)
    }
  }

  return (
    <div className="advance-dialog-backdrop" onClick={onCancel}>
      <div className="advance-dialog" onClick={e => e.stopPropagation()}>
        <h2>Ready to move forward?</h2>
        <p>Why are you advancing from <strong>{stage.title}</strong>?</p>

        <div className="advance-options">
          {reasonOptions.map(option => (
            <button
              key={option.id}
              className={`advance-option ${reason === option.id ? 'is-selected' : ''}`}
              onClick={() => setReason(option.id)}
            >
              <span className="advance-option-icon">{option.icon}</span>
              <span className="advance-option-label">{option.label}</span>
            </button>
          ))}
        </div>

        {reason === 'other' && (
          <textarea
            className="advance-textarea"
            placeholder="Tell us what's on your mind..."
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            rows={4}
          />
        )}

        <div className="advance-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={!reason || (reason === 'other' && !customReason)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
