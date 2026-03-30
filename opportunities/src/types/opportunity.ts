export interface Opportunity {
  id: string;
  topicId: string;
  topicCode: string;
  topicTitle: string;
  description: string;
  objective?: string;
  solicitationTitle?: string;
  phase1Description?: string;
  phase2Description?: string;
  phase3Description?: string;
  component: string;
  program: string;
  topicStatus: string;
  openDate?: string;
  closeDate?: string;
  technologyAreas?: string[];
  focusAreas?: string[];
  keywords?: string[];
  source: "sbir" | "sam" | "grants" | "diu" | "afwerx";
  url?: string;
  postedDate: string;
  responseDeadline?: string;
  referenceDocuments?: Array<{
    title: string;
    url?: string;
  }>;
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

export interface EventLocation {
  city: string;
  date: string;
  register: string;
}

export interface OutlookEvent {
  id: string;
  title: string;
  organizer: string;
  description: string;
  dates: { start: string; end: string };
  locations: EventLocation[];
  tags: string[];
  links: { label: string; url: string }[];
  priority: "high" | "normal";
  type: string;
}

export interface OutlookResponse {
  month: string;
  events: OutlookEvent[];
}
