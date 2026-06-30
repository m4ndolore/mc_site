import { useEffect, useState } from 'react'
import type { Curriculum } from '../types/curriculum'

export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        const response = await fetch('/data/curriculum.json')
        if (!response.ok) throw new Error('Failed to load curriculum')
        const data = await response.json()
        setCurriculum(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCurriculum()
  }, [])

  return { curriculum, loading, error }
}
