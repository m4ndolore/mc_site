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
  sources?: string;
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
  if (value === "sam" || value === "grants" || value === "diu" || value === "afwerx" || value === "darpa" || value === "colosseum" || value === "ratio") {
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
    qaStatus: asString(raw.topicQAStatusDisplay) ?? undefined,
    qaStartDate: toIsoDate(raw.topicQAStartDate),
    qaEndDate: toIsoDate(raw.topicQAEndDate),
    qaQuestionCount:
      typeof raw.noOfPublishedQuestions === "number"
        ? raw.noOfPublishedQuestions
        : typeof raw.topicQuestionCount === "number"
          ? raw.topicQuestionCount
          : undefined,
    qaOpen: typeof raw.topicQAOpen === "boolean" ? raw.topicQAOpen : undefined,
    estimatedValue: normalizeEstimatedValue(raw),
  };
}

function normalizeEstimatedValue(
  raw: RawOpportunity,
): Opportunity["estimatedValue"] {
  // Use API-provided value if present
  if (raw.estimatedValue && typeof raw.estimatedValue === "object") {
    const ev = raw.estimatedValue as Record<string, unknown>;
    const min = typeof ev.min === "number" ? ev.min : undefined;
    const max = typeof ev.max === "number" ? ev.max : undefined;
    if (min || max) return { min, max };
  }

  // Fallback: infer from phaseHierarchy for SBIR/STTR
  const program = String(raw.program ?? raw.solicitationType ?? "").toUpperCase();
  if (!program.includes("SBIR") && !program.includes("STTR")) return undefined;

  let phase = "";
  if (typeof raw.phaseHierarchy === "string") {
    try {
      const ph = JSON.parse(raw.phaseHierarchy) as { config?: { phase?: string; displayValue?: string }[] };
      const first = Array.isArray(ph?.config) ? ph.config?.[0] : undefined;
      if (first) {
        phase = String(first.phase ?? first.displayValue ?? "");
      }
    } catch { /* skip */ }
  }
  if (!phase) phase = String(raw.phase ?? raw.topicPhase ?? raw.currentPhase ?? "");
  if (!phase) return undefined;

  if (/^[1I]$|phase\s*i$/i.test(phase)) return { min: 50000, max: 275000 };
  if (/^[2]$|^II$|^D2$|phase\s*ii$/i.test(phase)) return { min: 750000, max: 1750000 };
  return undefined;
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
  if (opts.sources) params.set("sources", opts.sources);

  const response = await fetch(
    `${API_BASE}/api/opportunities?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to fetch opportunities");
  const payload = (await response.json()) as {
    data: RawOpportunity[];
    pagination: OpportunityListResponse["pagination"];
    success: boolean;
    source: string;
  };
  return {
    success: payload.success,
    data: payload.data.map(normalizeOpportunity),
    pagination: payload.pagination,
    source: payload.source,
  };
}

// ── Opportunity cache ────────────────────────────────────────────────────────
// The detail endpoint /api/opportunities/:id is SBIR-only and 404s for darpa/diu/
// ratio (which have no stable id) and for legacy SBIR topics that fall outside the
// live search window. To keep the detail page reliable, list loads cache every
// opportunity in sessionStorage keyed by id||topicId; the detail page reads from
// the cache first and only falls back to the network for direct/cold loads.
const CACHE_KEY = "mc-opportunities-cache";

function opportunityKey(opp: Opportunity): string {
  return opp.id || opp.topicId;
}

export function cacheOpportunities(items: Opportunity[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const existing = readOpportunityCache();
    for (const item of items) {
      const key = opportunityKey(item);
      if (key) existing[key] = item;
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(existing));
  } catch {
    /* sessionStorage unavailable or quota exceeded — skip caching */
  }
}

function readOpportunityCache(): Record<string, Opportunity> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Opportunity>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getCachedOpportunity(id: string): Opportunity | null {
  if (!id) return null;
  return readOpportunityCache()[id] ?? null;
}

export async function fetchOpportunity(
  id: string,
): Promise<OpportunityDetailResponse> {
  // Prefer the cache so detail pages resolve for every source, not just SBIR.
  const cached = getCachedOpportunity(id);
  if (cached) {
    return { success: true, data: cached };
  }
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
