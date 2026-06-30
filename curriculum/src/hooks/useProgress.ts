import { useEffect, useState } from 'react'

interface Progress {
  currentStage: string
  completedStages: string[]
  advanceReason?: string
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({
    currentStage: 'preflight',
    completedStages: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = localStorage.getItem('curriculum_progress')
        if (stored) {
          setProgress(JSON.parse(stored))
        }

        const response = await fetch('/api/curriculum/progress', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('mc_session')}` },
        })
        if (response.ok) {
          const data = await response.json()
          setProgress(data)
          localStorage.setItem('curriculum_progress', JSON.stringify(data))
        }
      } catch (err) {
        console.error('Progress load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  const updateProgress = async (newProgress: Partial<Progress>) => {
    const updated = { ...progress, ...newProgress }
    setProgress(updated)
    localStorage.setItem('curriculum_progress', JSON.stringify(updated))

    try {
      await fetch('/api/curriculum/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mc_session')}`,
        },
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error('Progress update error:', err)
    }
  }

  return { progress, loading, updateProgress }
}
