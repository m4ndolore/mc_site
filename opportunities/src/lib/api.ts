import type {
  OpportunityListResponse,
  OpportunityDetailResponse,
} from "../types/opportunity";

// In dev, Vite proxies /api to the production worker (avoids CORS).
// In prod, use the full worker URL.
const API_BASE = import.meta.env.DEV
  ? ""
  : "https://opportunities-api.defensebuilders.workers.dev";

export interface FetchOptions {
  page?: number;
  size?: number;
  status?: string;
  component?: string;
  keyword?: string;
  sort?: string;
}

export async function fetchOpportunities(
  opts: FetchOptions = {},
): Promise<OpportunityListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 25));
  if (opts.status) params.set("status", opts.status);
  if (opts.component) params.set("component", opts.component);
  if (opts.keyword) params.set("keyword", opts.keyword);
  if (opts.sort) params.set("sort", opts.sort);

  const response = await fetch(
    `${API_BASE}/api/opportunities?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to fetch opportunities");
  return response.json();
}

export async function fetchOpportunity(
  id: string,
): Promise<OpportunityDetailResponse> {
  const response = await fetch(`${API_BASE}/api/opportunities/${id}`);
  if (!response.ok) throw new Error("Opportunity not found");
  return response.json();
}
