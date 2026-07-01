import { useEffect, useState } from 'react'
import type { Curriculum } from '../types/curriculum'

export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        console.log('Fetching curriculum...')
        const response = await fetch('/data/curriculum.json')
        console.log('Fetch response:', response.status)
        if (!response.ok) throw new Error('Failed to load curriculum: ' + response.status)
        const data = await response.json()
        console.log('Curriculum loaded:', data)
        setCurriculum(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Curriculum error:', message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchCurriculum()
  }, [])

  return { curriculum, loading, error }
}
