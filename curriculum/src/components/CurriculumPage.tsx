import { useEffect, useState } from 'react'
import { useCurriculum } from '../hooks/useCurriculum'
import { useProgress } from '../hooks/useProgress'
import StageView from './StageView'
import '../styles/curriculum.css'

export default function CurriculumPage() {
  const { curriculum, loading: curriculumLoading } = useCurriculum()
  const { progress, updateProgress } = useProgress()
  const [currentStage, setCurrentStage] = useState(0)

  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('curriculum_session_id')
    if (stored) return stored
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem('curriculum_session_id', id)
    return id
  })

  useEffect(() => {
    if (!curriculumLoading && curriculum?.stages) {
      const stageIndex = curriculum.stages.findIndex(s => s.id === progress?.currentStage)
      if (stageIndex !== -1) {
        setCurrentStage(stageIndex)
      }
    }
  }, [curriculum, progress, curriculumLoading])

  if (curriculumLoading) {
    return <div className="curriculum-loading">Loading curriculum...</div>
  }

  if (!curriculum) {
    return <div className="curriculum-loading" style={{ color: '#fff' }}>No curriculum data found. Check /data/curriculum.json</div>
  }

  const stage = curriculum.stages[currentStage]
  if (!stage) return null

  const handleStageComplete = async (reason: string) => {
    const nextStageIndex = currentStage + 1
    if (nextStageIndex < curriculum.stages.length) {
      const nextStage = curriculum.stages[nextStageIndex]
      await updateProgress({
        currentStage: nextStage.id,
        completedStages: [...(progress?.completedStages || []), stage.id],
        advanceReason: reason,
      })
      setCurrentStage(nextStageIndex)

      await fetch('/api/curriculum/advance-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            stageId: nextStage.id,
            previousStage: stage.id,
            reason,
          }),
        }).catch(() => {})
    }
  }

  return (
    <div className="curriculum-page">
      <div className="curriculum-container">
        <StageView
          stage={stage}
          stageIndex={currentStage}
          totalStages={curriculum.stages.length}
          onComplete={handleStageComplete}
          progress={progress}
        />
      </div>
    </div>
  )
}
