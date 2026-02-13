import type {
  OpportunityListResponse,
  OpportunityDetailResponse,
} from "../types/opportunity";

// In dev, Vite proxies /api to the production worker (avoids CORS).
// In prod, use the full worker URL.
const API_BASE = import.meta.env.DEV
  ? ""
  : "https://opportunities-api.defensebuilders.workers.dev";

export async function fetchOpportunities(
  page = 0,
  size = 25,
): Promise<OpportunityListResponse> {
  const response = await fetch(
    `${API_BASE}/api/opportunities?page=${page}&size=${size}`,
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
