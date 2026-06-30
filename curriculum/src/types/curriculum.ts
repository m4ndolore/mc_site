export interface Resource {
  id: string
  title: string
  description: string
  url: string
  category: 'systems' | 'compliance' | 'market' | 'execution'
  type: 'article' | 'video' | 'tool' | 'guide'
  duration?: string
}

export interface Stage {
  id: string
  title: string
  description: string
  resources: Resource[]
}

export interface Curriculum {
  stages: Stage[]
  version: string
  lastUpdated: string
}

export interface CurriculumEvent {
  sessionId: string
  eventType: string
  stageId: string
  resourceId?: string
  reason?: string
  timestamp: string
}

export interface UserCurriculumProgress {
  userId?: string
  currentStage: string
  completedStages: string[]
  advanceReason?: string
  lastUpdated: string
}
