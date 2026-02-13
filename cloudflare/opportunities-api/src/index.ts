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

// List opportunities
app.get("/api/opportunities", async (c) => {
  const page = Number(c.req.query("page") ?? "0");
  const size = Number(c.req.query("size") ?? "25");

  const SBIR_SEARCH_URL =
    "https://www.dodsbirsttr.mil/topics/api/public/topics/search";

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("topicStatuses", "591");
    searchParams.append("topicStatuses", "592");
    searchParams.set("page", String(page));
    searchParams.set("size", String(size));

    const response = await fetch(`${SBIR_SEARCH_URL}?${searchParams.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1",
      },
    });

    if (!response.ok) {
      return c.json(
        {
          success: false,
          error: `SBIR API returned ${response.status}`,
        },
        502
      );
    }

    const data = await response.json();

    // The SBIR API returns paginated results; extract total from response
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
      pagination: {
        page,
        size,
        total,
      },
      source: "sbir",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json(
      {
        success: false,
        error: `Failed to fetch opportunities: ${message}`,
      },
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
      if (response.status === 404) {
        return c.json(
          {
            success: false,
            error: `Opportunity ${id} not found`,
          },
          404
        );
      }
      return c.json(
        {
          success: false,
          error: `SBIR API returned ${response.status}`,
        },
        502
      );
    }

    const data = await response.json();

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json(
      {
        success: false,
        error: `Failed to fetch opportunity: ${message}`,
      },
      500
    );
  }
});

export default app;
