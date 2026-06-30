export interface CurriculumEvent {
  eventType: string
  stageId: string
  resourceId?: string
  reason?: string
  timestamp: string
}

let sessionId: string

export function getSessionId(): string {
  if (sessionId) return sessionId
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('curriculum_session_id', sessionId)
  }
  return sessionId
}

export async function logEvent(event: CurriculumEvent) {
  try {
    await fetch('/api/curriculum/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        sessionId: getSessionId(),
      }),
    })
  } catch (err) {
    console.error('Event logging error:', err)
  }
}
