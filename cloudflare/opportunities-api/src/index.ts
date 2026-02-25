import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
    SBIR_API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── SBIR release status codes ────────────────────────────────────────────────
const RELEASE_STATUS_CODES: Record<string, number[]> = {
    open: [583],
    "pre-release": [592],
    closed: [593],
    active: [583, 592],
};

// ─── cUAS / AI keyword filter ─────────────────────────────────────────────────
const CUAS_AI_KEYWORDS = [
    "cuas", "c-uas", "counter uas", "counter-uas", "counter unmanned",
    "uncrewed", "uxs", "uas", "drone", "suas",
    "artificial intelligence", " ai ", "machine learning", "autonomous",
    "autonomy",
  ];

function matchesKeywords(text: string): boolean {
    const lower = text.toLowerCase();
    return CUAS_AI_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Cache helper ─────────────────────────────────────────────────────────────
const TTL = {
    darpa:     60 * 60,
    diu:       60 * 60,
    colosseum: 30 * 60,
};

async function cachedFetch(
    url: string,
    ttl: number,
    headers: Record<string, string> = {}
  ): Promise<string | null> {
    const cache = caches.default;
    const cacheKey = new Request(url, { method: "GET" });

  const cached = await cache.match(cacheKey);
    if (cached) return cached.text();

  try {
        const originRes = await fetch(url, {
                headers: { "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1", ...headers },
        });
        if (!originRes.ok) return null;

      const text = await originRes.text();
        await cache.put(
                cacheKey,
                new Response(text, {
                          headers: {
                                      "Content-Type": originRes.headers.get("Content-Type") ?? "text/plain",
                                      "Cache-Control": `s-maxage=${ttl}, max-age=${ttl}`,
                          },
                })
              );
        return text;
  } catch {
        return null;
  }
}

// ─── DARPA RSS parser ─────────────────────────────────────────────────────────
function parseDarpaRss(xml: string): unknown[] {
    const items: unknown[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title = block.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "";
          const description = block
            .match(/<description>([\s\S]*?)<\/description>/)?.[1]
            ?.replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ").trim() ?? "";
          const pubDate = block.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]?.trim() ?? "";
          const guid    = block.match(/<guid[^>]*>([^<]*)<\/guid>/)?.[1]?.trim() ?? "";
          const deepLink =
                  block.match(/href="(https:\/\/www\.darpa\.mil[^"]+)"/)?.[1] ??
                  "https://www.darpa.mil/work-with-us/opportunities";
          items.push({
                  source: "darpa",
                  topicCode: guid,
                  topicTitle: title,
                  topicStatus: "Open",
                  description,
                  topicStartDate: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : null,
                  url: deepLink,
                  component: "DARPA",
          });
    }
    return items;
}

// ─── DIU HTML parser ──────────────────────────────────────────────────────────
function parseDiuHtml(html: string): unknown[] {
    const items: unknown[] = [];
    const titleRegex = /<[^>]+class="[^"]*\btitle\b[^"]*"[^>]*>\s*<h4[^>]*>([\s\S]*?)<\/h4>/g;
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
          const title = m[1].replace(/<[^>]+>/g, "").trim();
          if (!title) continue;
          const surrounding = html.slice(m.index, m.index + 3000);
          const deadline = surrounding.match(/Responses Due By ([\d]{4}-[\d]{2}-[\d]{2})/)?.[1] ?? "";
          const submitLink =
                  surrounding.match(/href="(https:\/\/www\.diu\.mil\/work-with-us\/submit-solution\/[^"]+)"/)?.[1] ??
                  "https://www.diu.mil/work-with-us/open-solicitations";
          const plain = surrounding.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
          const deadlineIdx = deadline ? plain.indexOf(deadline) : -1;
          const desc = deadlineIdx >= 0
            ? plain.slice(deadlineIdx + deadline.length).trim().slice(0, 500)
                  : plain.trim().slice(0, 500);
          items.push({
                  source: "diu",
                  topicCode: submitLink.split("/").pop() ?? title.replace(/\s+/g, "-").toLowerCase(),
                  topicTitle: title,
                  topicStatus: deadline && new Date(deadline) > new Date() ? "Open" : "Closed",
                  topicEndDate: deadline ? Math.floor(new Date(deadline).getTime() / 1000) : null,
                  description: desc,
                  url: submitLink,
                  component: "DIU",
          });
    }
    return items;
}

// ─── GoColosseum HTML parser ──────────────────────────────────────────────────
interface ColosseumChallenge { id: string; title: string; tags: string; desc: string; }

function parseColosseumHtml(html: string): ColosseumChallenge[] {
    const items: ColosseumChallenge[] = [];
    const seen = new Set<string>();
    const linkRegex = /\/public\/challenges\/([\w-]{36})/g;
    let m;
    while ((m = linkRegex.exec(html)) !== null) {
          const id = m[1];
          if (seen.has(id)) continue;
          seen.add(id);
          const block = html.slice(Math.max(0, m.index - 200), m.index + 2000);
          const title = block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
          const tagsArea = block.match(/class="[^"]*tag[^"]*"[\s\S]{0,2000}/)?.[0] ?? "";
          const tags = tagsArea.match(/<span[^>]*>([\s\S]*?)<\/span>/g)
            ?.map((s) => s.replace(/<[^>]+>/g, "").trim()).filter(Boolean).join(", ") ?? "";
          const desc = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
          if (title) items.push({ id, title, tags, desc });
    }
    return items;
}

// ─── SBIR fetch helper ────────────────────────────────────────────────────────
const SBIR_SEARCH_URL = "https://www.dodsbirsttr.mil/topics/api/public/topics/search";

function buildSbirParams(
    searchParam: Record<string, unknown>,
    page: number,
    size: number,
    sort: string
  ): URLSearchParams {
    const params = new URLSearchParams();
    params.set("searchParam", JSON.stringify(searchParam));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort === "newest")        params.set("sort", "topicStartDate,desc");
    else if (sort === "deadline") params.set("sort", "topicEndDate,asc");
    else if (sort === "alpha")    params.set("sort", "topicTitle,asc");
    return params;
}

const SBIR_HEADERS = {
    Accept: "application/json",
    "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1",
};

// ─── Main opportunities endpoint ──────────────────────────────────────────────
// Query params:
//   page, size, status, component, keyword, sort  — same as before
//   sources — comma-separated: "sbir,darpa,diu,colosseum" (default: all)
app.get("/api/opportunities", async (c) => {
    const page         = Number(c.req.query("page") ?? "0");
    const size         = Number(c.req.query("size") ?? "25");
    const statusFilter = c.req.query("status") ?? "active";
    const component    = c.req.query("component") ?? "";
    const keyword      = c.req.query("keyword") ?? "";
    const sort         = c.req.query("sort") ?? "newest";
    const sourceFilter = c.req.query("sources") ?? "all";

          const sources = sourceFilter === "all"
      ? ["sbir", "darpa", "diu", "colosseum"]
                : sourceFilter.split(",").map((s) => s.trim());

          const pageResults: unknown[] = [];
    let sbirTotal      = 0;
    let darpaTotal     = 0;
    let diuTotal       = 0;
    let colosseumTotal = 0;

          // ── SBIR ──────────────────────────────────────────────────────────────────
          if (sources.includes("sbir")) {
                const searchParam: Record<string, unknown> = {};
                if (statusFilter !== "all" && statusFilter in RELEASE_STATUS_CODES) {
                        searchParam.topicReleaseStatus = RELEASE_STATUS_CODES[statusFilter];
                }
                if (component) searchParam.components = [component];
                if (keyword)   searchParam.searchText  = keyword;

      try {
              const [pageResp, countResp] = await Promise.all([
                        fetch(`${SBIR_SEARCH_URL}?${buildSbirParams(searchParam, page, size, sort)}`, {
                                    headers: SBIR_HEADERS,
                        }),
                        fetch(`${SBIR_SEARCH_URL}?${buildSbirParams(searchParam, 0, 0, sort)}`, {
                                    headers: SBIR_HEADERS,
                        }),
                      ]);

                  if (pageResp.ok) {
                            const data = await pageResp.json() as Record<string, unknown>;
                            const content = Array.isArray(data.content) ? data.content : [];
                            content.forEach((item: unknown) => {
                                        (item as Record<string, unknown>).source = "sbir";
                            });
                            pageResults.push(...content);
                  }

                  if (countResp.ok) {
                            const countData = await countResp.json() as Record<string, unknown>;
                            sbirTotal =
                                        typeof countData.totalElements === "number" ? countData.totalElements :
                                        typeof countData.total         === "number" ? countData.total : 0;
                  }
      } catch { /* skip */ }
          }

          // ── DARPA RSS (cached 1 hour) ─────────────────────────────────────────────
          if (sources.includes("darpa")) {
                const xml = await cachedFetch("https://www.darpa.mil/rss/opportunities.xml", TTL.darpa);
                if (xml) {
                        const filtered = parseDarpaRss(xml).filter((item) => {
                                  const i = item as Record<string, unknown>;
                                  return matchesKeywords(`${i.topicTitle} ${i.description}`);
                        });
                        darpaTotal = filtered.length;
                        pageResults.push(...filtered);
                }
          }

          // ── DIU (cached 1 hour) ───────────────────────────────────────────────────
          if (sources.includes("diu")) {
                const html = await cachedFetch("https://www.diu.mil/work-with-us/open-solicitations", TTL.diu);
                if (html) {
                        const filtered = parseDiuHtml(html).filter((item) => {
                                  const i = item as Record<string, unknown>;
                                  return matchesKeywords(`${i.topicTitle} ${i.description}`);
                        });
                        diuTotal = filtered.length;
                        pageResults.push(...filtered);
                }
          }

          // ── GoColosseum (cached 30 min) ───────────────────────────────────────────
          if (sources.includes("colosseum")) {
                const html = await cachedFetch("https://marketplace.gocolosseum.org/", TTL.colosseum);
                if (html) {
                        const filtered = parseColosseumHtml(html).filter((ch) =>
                                  matchesKeywords(`${ch.title} ${ch.tags} ${ch.desc}`)
                                                                               );
                        colosseumTotal = filtered.length;
                        filtered.forEach((ch) => {
                                  pageResults.push({
                                              source: "colosseum",
                                              topicCode: ch.id,
                                              topicTitle: ch.title,
                                              topicStatus: "Open",
                                              description: ch.desc,
                                              url: `https://marketplace.gocolosseum.org/public/challenges/${ch.id}`,
                                              component: "GoColosseum / ONI",
                                              tags: ch.tags,
                                  });
                        });
                }
          }

          // ── Accurate combined total ───────────────────────────────────────────────
          const total = sbirTotal + darpaTotal + diuTotal + colosseumTotal;

          return c.json({
                success: true,
                data: pageResults,
                pagination: {
                        page,
                        size,
                        total,
                        totals: {
                                  sbir:      sbirTotal,
                                  darpa:     darpaTotal,
                                  diu:       diuTotal,
                                  colosseum: colosseumTotal,
                        },
                },
                sources,
          });
});

// ─── Single opportunity by ID (SBIR only) ────────────────────────────────────
app.get("/api/opportunities/:id", async (c) => {
    const id = c.req.param("id");
    const SBIR_DETAILS_URL = `https://www.dodsbirsttr.mil/topics/api/public/topics/${id}/details`;
    try {
          const response = await fetch(SBIR_DETAILS_URL, { headers: SBIR_HEADERS });
          if (!response.ok) {
                  const status = response.status === 404 ? 404 : 502;
                  return c.json({
                            success: false,
                            error: status === 404
                              ? `Opportunity ${id} not found`
                                        : `SBIR API returned ${response.status}`,
                  }, status);
          }
          const data = await response.json();
          return c.json({ success: true, data });
    } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return c.json({ success: false, error: `Failed to fetch opportunity: ${message}` }, 500);
    }
});

export default app;
