export interface Opportunity {
  id: string;
  topicId: string;
  topicCode: string;
  topicTitle: string;
  description: string;
  objective?: string;
  component: string;
  program: string;
  topicStatus: string;
  openDate?: string;
  closeDate?: string;
  technologyAreas?: string[];
  focusAreas?: string[];
  keywords?: string[];
  source: "sbir" | "sam" | "grants" | "diu" | "afwerx";
  postedDate: string;
  responseDeadline?: string;
  estimatedValue?: {
    min?: number;
    max?: number;
  };
}

export interface OpportunityListResponse {
  success: boolean;
  data: Opportunity[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  source: string;
}

export interface OpportunityDetailResponse {
  success: boolean;
  data: Opportunity;
}
