export type CurriculumEventType =
  | "content_click"
  | "resource_view"
  | "stage_complete"
  | "advance_request"
  | "progress_update"
  | "session_start"
  | "session_end";

export interface LogEventOptions {
  eventType: CurriculumEventType;
  stageId?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

const SESSION_ID_STORAGE_KEY = "curriculum-session-id";

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export async function logEvent(options: LogEventOptions): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const timestamp = new Date().toISOString();

  const payload = {
    sessionId,
    timestamp,
    eventType: options.eventType,
    stageId: options.stageId,
    resourceId: options.resourceId,
    metadata: options.metadata,
  };

  try {
    const response = await fetch("/api/curriculum/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to log event: ${response.statusText}`);
    }
  } catch (err) {
    console.error("Error logging event:", err);
  }
}
