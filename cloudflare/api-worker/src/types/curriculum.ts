export interface CurriculumEvent {
  id?: string;
  event: 'triage_complete' | 'curriculum_view' | 'content_click' | 'content_engaged' | 'content_saved' | 'signup_prompt_shown' | 'signup_click' | 'advance_request' | 'advisory_prompt_shown' | 'advisory_click' | 'curriculum_return';
  resourceId?: string;
  resourceType?: 'knowledge' | 'learn' | 'signal' | 'external' | 'gated';
  stage?: string;
  fromStage?: string;
  toStage?: string;
  reason?: string;
  funderId?: string;
  sessionId: string;
  timeSpent?: number;
  timestamp: string;
  createdAt?: string;
}

export interface TriageResponses {
  stage: string;
  brings: string[];
  constraints: string[];
  company: string;
}

export interface UserCurriculumProgress {
  funderId: string;
  currentStage: string;
  engagedResources: string[];
  completedResources: string[];
  savedResources: string[];
  triageResponses?: TriageResponses | null;
  advanceRequests: Array<{
    from: string;
    to: string;
    reason?: string;
    timestamp: string;
    allowed: boolean;
  }>;
  lastVisited: string;
}
