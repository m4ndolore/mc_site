import { Database } from '@/types';
import { CurriculumEvent, UserCurriculumProgress } from '@/types/curriculum';

export async function logCurriculumEvent(db: Database, event: CurriculumEvent): Promise<void> {
  await db
    .from('curriculum_events')
    .insert({
      event: event.event,
      resource_id: event.resourceId,
      resource_type: event.resourceType,
      stage: event.stage,
      from_stage: event.fromStage,
      to_stage: event.toStage,
      reason: event.reason,
      founder_id: event.funderId,
      session_id: event.sessionId,
      time_spent: event.timeSpent,
      timestamp: event.timestamp,
    });
}

export async function getUserProgress(db: Database, funderId: string): Promise<UserCurriculumProgress | null> {
  const { data } = await db
    .from('curriculum_progress')
    .select('*')
    .eq('founder_id', funderId)
    .single();

  if (!data) return null;

  return {
    funderId: data.founder_id,
    currentStage: data.current_stage,
    engagedResources: data.engaged_resources || [],
    completedResources: data.completed_resources || [],
    savedResources: data.saved_resources || [],
    triageResponses: data.triage_responses,
    advanceRequests: data.advance_requests || [],
    lastVisited: data.last_visited,
  };
}

export async function updateUserProgress(db: Database, funderId: string, updates: Partial<UserCurriculumProgress>): Promise<UserCurriculumProgress> {
  const { data } = await db
    .from('curriculum_progress')
    .upsert({
      founder_id: funderId,
      current_stage: updates.currentStage,
      engaged_resources: updates.engagedResources,
      completed_resources: updates.completedResources,
      saved_resources: updates.savedResources,
      triage_responses: updates.triageResponses,
      advance_requests: updates.advanceRequests,
      last_visited: updates.lastVisited,
    })
    .eq('founder_id', funderId)
    .select()
    .single();

  return {
    funderId: data.founder_id,
    currentStage: data.current_stage,
    engagedResources: data.engaged_resources || [],
    completedResources: data.completed_resources || [],
    savedResources: data.saved_resources || [],
    triageResponses: data.triage_responses,
    advanceRequests: data.advance_requests || [],
    lastVisited: data.last_visited,
  };
}
