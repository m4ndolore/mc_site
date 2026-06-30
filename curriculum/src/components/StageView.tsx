import { useState } from 'react'
import type { Stage, Resource } from '../types/curriculum'
import ResourceCard from './ResourceCard'
import AdvanceDialog from './AdvanceDialog'
import { logEvent } from '../lib/events'

interface Props {
  stage: Stage
  stageIndex: number
  totalStages: number
  onComplete: (reason: string) => void
  progress: any
}

export default function StageView({ stage, stageIndex, totalStages, onComplete, progress }: Props) {
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [engagedResources, setEngagedResources] = useState(0)
  const canAdvance = engagedResources >= 2 || stageIndex === totalStages - 1

  const handleResourceEngaged = (resource: Resource) => {
    logEvent({
      eventType: 'resource_viewed',
      stageId: stage.id,
      resourceId: resource.id,
      timestamp: new Date().toISOString(),
    })
    setEngagedResources(e => e + 1)
  }

  const handleAdvance = (reason: string) => {
    logEvent({
      eventType: 'stage_advanced',
      stageId: stage.id,
      reason,
      timestamp: new Date().toISOString(),
    })
    onComplete(reason)
  }

  return (
    <div className="stage-view">
      <div className="stage-header">
        <div className="stage-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((stageIndex + 1) / totalStages) * 100}%` }} />
          </div>
          <p className="progress-label">Stage {stageIndex + 1} of {totalStages}</p>
        </div>
        <h1 className="stage-title">{stage.title}</h1>
        <p className="stage-description">{stage.description}</p>
      </div>

      <div className="resources-grid">
        {stage.resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onEngage={handleResourceEngaged}
          />
        ))}
      </div>

      <div className="stage-actions">
        {canAdvance && stageIndex < totalStages - 1 && (
          <>
            <button
              className="btn btn--primary"
              onClick={() => setShowAdvanceDialog(true)}
            >
              I'm ready to advance →
            </button>
            {engagedResources < 2 && (
              <p className="stage-hint">View {2 - engagedResources} more resource(s) to advance</p>
            )}
          </>
        )}
        {stageIndex === totalStages - 1 && (
          <button className="btn btn--primary" disabled>
            🎉 Curriculum Complete
          </button>
        )}
      </div>

      {showAdvanceDialog && (
        <AdvanceDialog
          stage={stage}
          onConfirm={handleAdvance}
          onCancel={() => setShowAdvanceDialog(false)}
        />
      )}
    </div>
  )
}
