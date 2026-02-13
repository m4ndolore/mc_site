import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  SBIR_API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use(
  "*",
  cors({
    origin: [
      "https://mergecombinator.com",
      "https://www.mergecombinator.com",
      "https://mc-opportunities.pages.dev",
      "http://localhost:5174",
    ],
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// SBIR API uses `topicReleaseStatus` (not `topicStatuses`) for filtering.
// These are the actual numeric codes that the API respects:
const RELEASE_STATUS_CODES: Record<string, number[]> = {
  open: [583],              // "Ready for Release"
  "pre-release": [592],     // "Pre-Release"
  closed: [593],            // "Closed"
  active: [583, 592],       // Open + Pre-Release (non-closed)
};

// List opportunities
// Query: page, size, status (open|closed|pre-release|active|all), component, keyword, sort (newest|deadline|alpha)
app.get("/api/opportunities", async (c) => {
  const page = Number(c.req.query("page") ?? "0");
  const size = Number(c.req.query("size") ?? "25");
  const statusFilter = c.req.query("status") ?? "active";
  const component = c.req.query("component") ?? "";
  const keyword = c.req.query("keyword") ?? "";
  const sort = c.req.query("sort") ?? "newest";

  const SBIR_SEARCH_URL =
    "https://www.dodsbirsttr.mil/topics/api/public/topics/search";

  // Build the SBIR searchParam JSON (uses the actual field names the API expects)
  const searchParam: Record<string, unknown> = {};

  // Apply status filter via topicReleaseStatus — the field SBIR actually respects
  if (statusFilter !== "all" && statusFilter in RELEASE_STATUS_CODES) {
    searchParam.topicReleaseStatus = RELEASE_STATUS_CODES[statusFilter];
  }

  if (component) {
    searchParam.components = [component];
  }
  if (keyword) {
    searchParam.searchText = keyword;
  }

  try {
    const params = new URLSearchParams();
    params.set("searchParam", JSON.stringify(searchParam));
    params.set("page", String(page));
    params.set("size", String(size));

    // Sort
    if (sort === "newest") {
      params.set("sort", "topicStartDate,desc");
    } else if (sort === "deadline") {
      params.set("sort", "topicEndDate,asc");
    } else if (sort === "alpha") {
      params.set("sort", "topicTitle,asc");
    }

    const response = await fetch(`${SBIR_SEARCH_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1",
      },
    });

    if (!response.ok) {
      return c.json(
        { success: false, error: `SBIR API returned ${response.status}` },
        502
      );
    }

    const data = await response.json();
    const result = data as Record<string, unknown>;

    const total =
      typeof result.totalElements === "number"
        ? result.totalElements
        : typeof result.total === "number"
          ? result.total
          : 0;

    const content = Array.isArray(result.content)
      ? result.content
      : Array.isArray(result.data)
        ? result.data
        : Array.isArray(data)
          ? data
          : [];

    return c.json({
      success: true,
      data: content,
      pagination: { page, size, total },
      source: "sbir",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json(
      { success: false, error: `Failed to fetch opportunities: ${message}` },
      500
    );
  }
});

// Get single opportunity by ID
app.get("/api/opportunities/:id", async (c) => {
  const id = c.req.param("id");
  const SBIR_DETAILS_URL = `https://www.dodsbirsttr.mil/topics/api/public/topics/${id}/details`;

  try {
    const response = await fetch(SBIR_DETAILS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1",
      },
    });

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      return c.json(
        {
          success: false,
          error: status === 404 ? `Opportunity ${id} not found` : `SBIR API returned ${response.status}`,
        },
        status
      );
    }

    const data = await response.json();
    return c.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json(
      { success: false, error: `Failed to fetch opportunity: ${message}` },
      500
    );
  }
});

export default app;
