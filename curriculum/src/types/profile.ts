export type ViewMode = "opportunity" | "stakeholder" | "mission";

export interface OpportunityProfile {
  techAreas: string[];
  problemAreas: string[];
  viewMode: ViewMode;
  savedIds: string[];
  createdAt: string;
  updatedAt: string;
}
