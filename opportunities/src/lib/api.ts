import type {
  Opportunity,
  OpportunityListResponse,
  OpportunityDetailResponse,
  OutlookResponse,
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

type RawOpportunity = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toIsoDate(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d+$/.test(trimmed)) {
      return toIsoDate(Number(trimmed));
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => asString(item))
      .filter((item): item is string => Boolean(item));
    return items.length ? items : undefined;
  }

  if (typeof value === "string") {
    const items = value
      .split(/[;,]\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }

  return undefined;
}

function normalizeSource(value: unknown): Opportunity["source"] {
  if (value === "sam" || value === "grants" || value === "diu" || value === "afwerx") {
    return value;
  }
  return "sbir";
}

function normalizeReferenceDocuments(value: unknown): Opportunity["referenceDocuments"] {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const title = asString(record.referenceTitle) ?? asString(record.title);
      const url = asString(record.url);
      if (!title && !url) return null;
      return {
        title: title ?? url ?? "Reference",
        url,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return items.length ? items : undefined;
}

function normalizeOpportunity(raw: RawOpportunity): Opportunity {
  const topicId = asString(raw.topicId) ?? asString(raw.id) ?? "";
  const id = asString(raw.id) ?? topicId;
  const topicCode =
    asString(raw.topicCode) ??
    asString(raw.noticeId) ??
    asString(raw.solicitationNumber) ??
    "";
  const topicTitle =
    asString(raw.topicTitle) ??
    asString(raw.title) ??
    asString(raw.name) ??
    "Untitled opportunity";
  const topicStatus =
    asString(raw.topicStatus) ??
    asString(raw.status) ??
    asString(raw.topicQAStatusDisplay) ??
    "Active";
  const openDate =
    toIsoDate(raw.openDate) ??
    toIsoDate(raw.topicStartDate) ??
    toIsoDate(raw.topicPreReleaseStartDate);
  const closeDate =
    toIsoDate(raw.closeDate) ??
    toIsoDate(raw.topicEndDate) ??
    toIsoDate(raw.responseDeadline);
  const postedDate =
    toIsoDate(raw.postedDate) ??
    openDate ??
    toIsoDate(raw.topicQAStartDate) ??
    "";

  return {
    id,
    topicId,
    topicCode,
    topicTitle,
    description:
      asString(raw.description) ??
      asString(raw.summary) ??
      asString(raw.synopsis) ??
      "",
    objective: asString(raw.objective),
    solicitationTitle: asString(raw.solicitationTitle),
    phase1Description: asString(raw.phase1Description),
    phase2Description: asString(raw.phase2Description),
    phase3Description: asString(raw.phase3Description),
    component:
      asString(raw.component) ??
      asString(raw.command) ??
      asString(raw.agency) ??
      asString(raw.organization) ??
      normalizeSource(raw.source).toUpperCase(),
    program:
      asString(raw.program) ??
      asString(raw.solicitationTitle) ??
      asString(raw.opportunityType) ??
      "Opportunity",
    topicStatus,
    openDate,
    closeDate,
    technologyAreas: toStringArray(raw.technologyAreas),
    focusAreas: toStringArray(raw.focusAreas),
    keywords: toStringArray(raw.keywords),
    source: normalizeSource(raw.source),
    url: asString(raw.url),
    postedDate,
    responseDeadline:
      toIsoDate(raw.responseDeadline) ??
      closeDate ??
      toIsoDate(raw.topicQAEndDate),
    referenceDocuments: normalizeReferenceDocuments(raw.referenceDocuments),
  };
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
  const payload = (await response.json()) as OpportunityDetailResponse;
  return {
    ...payload,
    data: normalizeOpportunity(payload.data as unknown as RawOpportunity),
  };
}

export async function fetchOutlookEvents(): Promise<OutlookResponse> {
  const response = await fetch(`${API_BASE}/api/outlook`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}
