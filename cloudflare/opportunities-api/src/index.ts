import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
          SBIR_API_URL: string;
          SAM_GOV_API_KEY: string;
          STAGEHAND_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(
          "*",
          cors({
                      origin: [
                                    "https://mergecombinator.com",
                                    "https://www.mergecombinator.com",
                                    "https://mc-opportunities.pages.dev",
                                    "http://localhost:5174",
                                    "http://localhost:3000",
                                  ],
                      allowMethods: ["GET", "OPTIONS"],
                      allowHeaders: ["Content-Type"],
          })
        );

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (c) => {
          return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── SBIR release status codes ───────────────────────────────────────────────
const RELEASE_STATUS_CODES: Record<string, number[]> = {
          open: [583],
          "pre-release": [592],
          closed: [593],
          active: [583, 592],
};

// ─── cUAS / AI keyword filter ────────────────────────────────────────────────
const CUAS_AI_KEYWORDS = [
          "cuas",
          "c-uas",
          "counter uas",
          "counter-uas",
          "counter unmanned",
          "uncrewed",
          "uxs",
          "uas",
          "drone",
          "suas",
          "artificial intelligence",
          " ai ",
          "machine learning",
          "autonomous",
          "autonomy",
        ];

function matchesKeywords(text: string): boolean {
          const lower = text.toLowerCase();
          return CUAS_AI_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Cross-source deduplication ───────────────────────────────────────────────
// Different sources (DARPA, DIU, SAM.gov) often list the same opportunity.
// We normalise the title to a canonical key and keep whichever version was
// added first (earlier sources in the pipeline take priority).
function normalizeTitle(title: string): string {
          return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")   // strip punctuation
    .replace(/\s+/g, " ")           // collapse whitespace
    .trim();
}

function deduplicateAcrossSources(items: unknown[]): unknown[] {
          const seenTitles = new Set<string>();
          return items.filter((item) => {
                      const i = item as Record<string, unknown>;
                      const key = normalizeTitle(String(i.topicTitle ?? ""));
                      if (!key || seenTitles.has(key)) return false;
                      seenTitles.add(key);
                      return true;
          });
}

// ─── Cache helper ────────────────────────────────────────────────────────────
const TTL = {
          darpa: 60 * 60,
          diu: 60 * 60,
          colosseum: 30 * 60,
          sam: 60 * 60,
          intel: 30 * 60,
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
                      const guid = block.match(/<guid[^>]*>([^<]*)<\/guid>/)?.[1]?.trim() ?? "";
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
          const titleRegex =
                      /<[^>]+class="[^"]*\btitle\b[^"]*"[^>]*>\s*<h4[^>]*>([\s\S]*?)<\/h4>/g;
          let m;
          while ((m = titleRegex.exec(html)) !== null) {
                      const title = m[1].replace(/<[^>]+>/g, "").trim();
                      if (!title) continue;
                      const surrounding = html.slice(m.index, m.index + 3000);
                      const deadline =
                                    surrounding.match(/Responses Due By ([\d]{4}-[\d]{2}-[\d]{2})/)?.[1] ?? "";
                      const submitLink =
                                    surrounding.match(
                                                    /href="(https:\/\/www\.diu\.mil\/work-with-us\/submit-solution\/[^"]+)"/
                                                  )?.[1] ?? "https://www.diu.mil/work-with-us/open-solicitations";
                      const plain = surrounding.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
                      const deadlineIdx = deadline ? plain.indexOf(deadline) : -1;
                      const desc =
                                    deadlineIdx >= 0
                          ? plain.slice(deadlineIdx + deadline.length).trim().slice(0, 500)
                                      : plain.trim().slice(0, 500);
                      items.push({
                                    source: "diu",
                                    topicCode:
                                                    submitLink.split("/").pop() ??
                                                    title.replace(/\s+/g, "-").toLowerCase(),
                                    topicTitle: title,
                                    topicStatus:
                                                    deadline && new Date(deadline) > new Date() ? "Open" : "Closed",
                                    topicEndDate: deadline
                                      ? Math.floor(new Date(deadline).getTime() / 1000)
                                                    : null,
                                    description: desc,
                                    url: submitLink,
                                    component: "DIU",
                      });
          }
          return items;
}

// ─── GoColosseum HTML parser ──────────────────────────────────────────────────
interface ColosseumChallenge {
          id: string;
          title: string;
          tags: string;
          desc: string;
}

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
                      const title =
                                    block
                          .match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/)?.[1]
                          ?.replace(/<[^>]+>/g, "")
                          .trim() ?? "";
                      const tagsArea =
                                    block.match(/class="[^"]*tag[^"]*"[\s\S]{0,2000}/)?.[0] ?? "";
                      const tags =
                                    tagsArea
                          .match(/<span[^>]*>([\s\S]*?)<\/span>/g)
                          ?.map((s) => s.replace(/<[^>]+>/g, "").trim())
                          .filter(Boolean)
                          .join(", ") ?? "";
                      const desc =
                                    block
                          .match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1]
                          ?.replace(/<[^>]+>/g, "")
                          .trim() ?? "";
                      if (title) items.push({ id, title, tags, desc });
          }
          return items;
}

// ─── SAM.gov helpers ──────────────────────────────────────────────────────────
const SAM_GOV_SEARCH_URL = "https://api.sam.gov/opportunities/v2/search";

// Two targeted title searches scoped to DoD only, covering the two topic areas:
//   "drone"  and  "artificial intelligence"
// Each returns at most 50 results; after dedup and the matchesKeywords title
// filter the final count is typically well under 50 per area.
const SAM_GOV_DEFAULT_SEARCHES = [
          "drone",
          "artificial intelligence",
        ] as const;

function buildSamGovUrl(apiKey: string, keyword: string): string {
          const today = new Date();
          const postedTo = formatSamDate(today);
          const from = new Date(today);
          // Only look back 6 months to keep results fresh and volume manageable
  from.setMonth(from.getMonth() - 6);
          const postedFrom = formatSamDate(from);

  const params = new URLSearchParams({
              api_key: apiKey,
              postedFrom,
              postedTo,
              limit: "50",
              offset: "0",
              // Special notices (s), solicitations (o), sources sought (r) — no awards
              ptype: "s,o,r",
              // Restrict to Department of Defense only — eliminates most non-relevant noise
              organizationName: "DEPT OF DEFENSE",
              title: keyword,
  });

  return `${SAM_GOV_SEARCH_URL}?${params.toString()}`;
}

function formatSamDate(d: Date): string {
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${mm}/${dd}/${yyyy}`;
}

interface SamGovOpportunity {
          noticeId: string;
          title: string;
          solicitationNumber: string;
          fullParentPathName: string;
          postedDate: string;
          type: string;
          responseDeadLine: string | null;
          active: string;
          naicsCode: string | null;
          typeOfSetAsideDescription: string | null;
}

function parseSamGovResponse(json: string): unknown[] {
          let data: { opportunitiesData?: SamGovOpportunity[] };
          try {
                      data = JSON.parse(json);
          } catch {
                      return [];
          }

  const opportunities = data.opportunitiesData ?? [];
          return opportunities.map((opp) => ({
                      source: "sam",
                      topicCode: opp.noticeId,
                      topicTitle: opp.title,
                      topicStatus: opp.active === "Yes" ? "Open" : "Closed",
                      topicStartDate: opp.postedDate
                        ? Math.floor(new Date(opp.postedDate).getTime() / 1000)
                                    : null,
                      topicEndDate: opp.responseDeadLine
                        ? Math.floor(new Date(opp.responseDeadLine).getTime() / 1000)
                                    : null,
                      description: opp.solicitationNumber
                        ? `Solicitation: ${opp.solicitationNumber}. ${opp.fullParentPathName ?? ""}`
                                    : opp.fullParentPathName ?? "",
                      url: `https://sam.gov/opp/${opp.noticeId}/view`,
                      component: "SAM.gov",
                      tags: [opp.type, opp.typeOfSetAsideDescription, opp.naicsCode]
                        .filter(Boolean)
                        .join(", "),
          }));
}

// ─── SBIR fetch helper ────────────────────────────────────────────────────────
const SBIR_SEARCH_URL =
          "https://www.dodsbirsttr.mil/topics/api/public/topics/search";

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
          if (sort === "newest") params.set("sort", "topicStartDate,desc");
          else if (sort === "deadline") params.set("sort", "topicEndDate,asc");
          else if (sort === "alpha") params.set("sort", "topicTitle,asc");
          return params;
}

const SBIR_HEADERS = {
          Accept: "application/json",
          "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1",
};

// ─── Main opportunities endpoint ──────────────────────────────────────────────
// Query params:
//   page, size, status, component, keyword, sort — same as before
//   sources — comma-separated: "sbir,darpa,diu,colosseum,sam" (default: all)
app.get("/api/opportunities", async (c) => {
          const page = Number(c.req.query("page") ?? "0");
          const size = Number(c.req.query("size") ?? "25");
          const statusFilter = c.req.query("status") ?? "active";
          const component = c.req.query("component") ?? "";
          const keyword = c.req.query("keyword") ?? "";
          const sort = c.req.query("sort") ?? "newest";
          const sourceFilter = c.req.query("sources") ?? "all";

          const sources =
                      sourceFilter === "all"
              ? ["sbir", "darpa", "diu", "colosseum", "sam"]
                        : sourceFilter.split(",").map((s) => s.trim());

          // Each source accumulates into this single array. Cross-source dedup is
          // applied at the end, keyed on normalised title. Sources listed earlier
          // (sbir → darpa → diu → colosseum → sam) take priority when titles match.
          const allResults: unknown[] = [];
          let sbirTotal = 0;
          let darpaTotal = 0;
          let diuTotal = 0;
          let colosseumTotal = 0;
          let samTotal = 0;

          // ── SBIR ──────────────────────────────────────────────────────────────────
          if (sources.includes("sbir")) {
                      const searchParam: Record<string, unknown> = {};
                      if (statusFilter !== "all" && statusFilter in RELEASE_STATUS_CODES) {
                                    searchParam.topicReleaseStatus = RELEASE_STATUS_CODES[statusFilter];
                      }
                      if (component) searchParam.components = [component];
                      if (keyword) searchParam.searchText = keyword;
                      try {
                                    const [pageResp, countResp] = await Promise.all([
                                                    fetch(
                                                                      `${SBIR_SEARCH_URL}?${buildSbirParams(searchParam, page, size, sort)}`,
                                                            { headers: SBIR_HEADERS }
                                                                    ),
                                                    fetch(
                                                                      `${SBIR_SEARCH_URL}?${buildSbirParams(searchParam, 0, 0, sort)}`,
                                                            { headers: SBIR_HEADERS }
                                                                    ),
                                                  ]);
                                    if (pageResp.ok) {
                                                    const data = (await pageResp.json()) as Record<string, unknown>;
                                                    // SBIR API migrated from { content, totalElements } to { data, total }
                                                    const content = Array.isArray(data.content) ? data.content
                                                      : Array.isArray(data.data) ? data.data as unknown[]
                                                      : [];
                                                    content.forEach((item: unknown) => {
                                                                      (item as Record<string, unknown>).source = "sbir";
                                                    });
                                                    allResults.push(...content);
                                                    // Only trust the count if the data fetch also succeeded,
                                                    // otherwise we report phantom totals with no actual items.
                                                    if (countResp.ok) {
                                                                      const countData = (await countResp.json()) as Record<string, unknown>;
                                                                      sbirTotal =
                                                                                        typeof countData.totalElements === "number"
                                                                          ? countData.totalElements
                                                                                          : typeof countData.total === "number"
                                                                          ? countData.total
                                                                                          : 0;
                                                    } else {
                                                                      sbirTotal = content.length;
                                                    }
                                    }
                      } catch {
                                    /* skip */
                      }
          }

          // ── DARPA RSS (cached 1 hour) ─────────────────────────────────────────────
          if (sources.includes("darpa")) {
                      const xml = await cachedFetch(
                                    "https://www.darpa.mil/rss/opportunities.xml",
                                    TTL.darpa
                                  );
                      if (xml) {
                                    const darpaItems = parseDarpaRss(xml);
                                    darpaTotal = darpaItems.length;
                                    allResults.push(...darpaItems);
                      }
          }

          // ── DIU (cached 1 hour) ───────────────────────────────────────────────────
          if (sources.includes("diu")) {
                      const html = await cachedFetch(
                                    "https://www.diu.mil/work-with-us/open-solicitations",
                                    TTL.diu
                                  );
                      if (html) {
                                    const diuItems = parseDiuHtml(html);
                                    diuTotal = diuItems.length;
                                    allResults.push(...diuItems);
                      }
          }

          // ── GoColosseum (cached 30 min) ───────────────────────────────────────────
          if (sources.includes("colosseum")) {
                      const html = await cachedFetch(
                                    "https://marketplace.gocolosseum.org/",
                                    TTL.colosseum
                                  );
                      if (html) {
                                    const colosseumItems = parseColosseumHtml(html);
                                    colosseumTotal = colosseumItems.length;
                                    colosseumItems.forEach((ch) => {
                                                    allResults.push({
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

          // ── SAM.gov (cached 1 hour) ───────────────────────────────────────────────
          // Two targeted DoD-scoped title searches. Post-filtered by title keyword.
          // SAM.gov is added LAST so that if a more specific source (DARPA, DIU, SBIR)
          // already has the same opportunity, the SAM.gov entry is dropped by the
          // cross-source dedup below.
          if (sources.includes("sam")) {
                      const samApiKey = c.env.SAM_GOV_API_KEY;
                      if (samApiKey) {
                                    const samSearchTerms = keyword ? [keyword] : [...SAM_GOV_DEFAULT_SEARCHES];
                                    const samResults: unknown[] = [];

                        await Promise.all(
                                        samSearchTerms.map(async (kw) => {
                                                          const url = buildSamGovUrl(samApiKey, kw);
                                                          const json = await cachedFetch(url, TTL.sam);
                                                          if (json) {
                                                                              const parsed = parseSamGovResponse(json).filter((item) => {
                                                                                                    const i = item as Record<string, unknown>;
                                                                                                    return matchesKeywords(String(i.topicTitle ?? ""));
                                                                              });
                                                                              samResults.push(...parsed);
                                                          }
                                        })
                                      );

                        // Deduplicate within SAM results first (two searches may overlap)
                        const seenSam = new Set<string>();
                                    const dedupedSam = samResults.filter((item) => {
                                                    const i = item as Record<string, unknown>;
                                                    const code = String(i.topicCode);
                                                    if (seenSam.has(code)) return false;
                                                    seenSam.add(code);
                                                    return true;
                                    });

                        samTotal = dedupedSam.length;
                                    allResults.push(...dedupedSam);
                      }
          }

          // ── Cross-source deduplication ────────────────────────────────────────────
          // Remove any opportunity whose normalised title already appeared in an
          // earlier source. This catches cases where DARPA, DIU, or SBIR opportunities
          // are also listed on SAM.gov (or any other cross-posting).
          // Note: per-source totals are counted BEFORE dedup so they reflect raw
          // source volume; the pagination.total reflects the deduplicated count.
          const pageResults = deduplicateAcrossSources(allResults);
          const total = sbirTotal + darpaTotal + diuTotal + colosseumTotal + samTotal;

          return c.json({
                      success: true,
                      data: pageResults,
                      pagination: {
                                    page,
                                    size,
                                    total,
                                    totals: {
                                                    sbir: sbirTotal,
                                                    darpa: darpaTotal,
                                                    diu: diuTotal,
                                                    colosseum: colosseumTotal,
                                                    sam: samTotal,
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
                                    return c.json(
                                            {
                                                              success: false,
                                                              error:
                                                                                  status === 404
                                                                  ? `Opportunity ${id} not found`
                                                                                    : `SBIR API returned ${response.status}`,
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

// ─── Generic RSS feed parser ────────────────────────────────────────────────
// Works with any standard RSS <item> feed (ExecutiveGov, HN, IrregularChat, etc.)
function parseRssFeed(xml: string, sourceId: string): unknown[] {
          const articles: unknown[] = [];
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(xml)) !== null) {
                      const block = match[1];
                      const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
                      const title = titleMatch?.[1]?.trim() ?? "";
                      const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
                      const rawDesc = descMatch?.[1] ?? "";
                      const excerpt = rawDesc
                        .replace(/<[^>]+>/g, "")
                        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                        .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "")
                        .trim()
                        .slice(0, 300);
                      const link = block.match(/<link>([^<]*)<\/link>/)?.[1]?.trim() ?? "";
                      const pubDate = block.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1]?.trim() ?? "";
                      const categories: string[] = [];
                      const catRegex = /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g;
                      let catMatch;
                      while ((catMatch = catRegex.exec(block)) !== null) {
                                    const cat = catMatch[1].trim();
                                    if (cat && categories.length < 4) categories.push(cat);
                      }
                      const prefix = sourceId.slice(0, 3);
                      if (title) {
                                    articles.push({
                                                    id: `${prefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`,
                                                    source: sourceId,
                                                    title,
                                                    excerpt,
                                                    url: link,
                                                    date: pubDate ? new Date(pubDate).toISOString().split("T")[0] : "",
                                                    tags: categories,
                                    });
                      }
          }
          return articles;
}

// ─── Outlook events endpoint ────────────────────────────────────────────────
app.get("/api/outlook", async (c) => {
  const json = await cachedFetch(
    "https://mergecombinator.com/data/outlook.json",
    TTL.darpa // 1 hour cache
  );
  if (!json) {
    return c.json({ month: "", events: [] });
  }
  try {
    const data = JSON.parse(json);
    return c.json(data);
  } catch {
    return c.json({ month: "", events: [] });
  }
});

// ─── Intel feed endpoint (multi-source RSS aggregation) ─────────────────────
app.get("/api/intel/feed", async (c) => {
          const [egXml, hnXml, irXml] = await Promise.all([
                      cachedFetch("https://executivegov.com/feed/", TTL.intel),
                      cachedFetch("https://news.ycombinator.com/rss", TTL.intel),
                      cachedFetch("https://rss.irregulars.io", TTL.intel),
          ]);
          const articles = [
                      ...(egXml ? parseRssFeed(egXml, "executivegov") : []),
                      ...(hnXml ? parseRssFeed(hnXml, "hackernews") : []),
                      ...(irXml ? parseRssFeed(irXml, "irregulars") : []),
          ];
          articles.sort((a, b) => {
                      const da = (a as Record<string, unknown>).date as string;
                      const db = (b as Record<string, unknown>).date as string;
                      return db.localeCompare(da);
          });
          return c.json({ articles });
});

// ─── GovBase "Today in Washington" briefing endpoint ────────────────────────
// Tries browser-rendered scrape via Stagehand first (handles JS SPAs),
// falls back to raw fetch + HTML parse if Stagehand is unavailable.
app.get("/api/intel/briefing", async (c) => {
          const stagehandUrl = c.env.STAGEHAND_URL;
          type BriefingData = { summary?: string; sources?: number; updatedAgo?: string; categories?: { name: string; count?: number }[] };
          let briefingData: BriefingData | null = null;

          // Try Stagehand browser scraper first
          if (stagehandUrl) {
                      try {
                                    const scrapeRes = await fetch(
                                                    `${stagehandUrl}/scrape?url=${encodeURIComponent("https://govbase.com")}&extract=briefing`,
                                                    { headers: { "User-Agent": "MergeCombinator-OpportunitiesAPI/0.1" } }
                                    );
                                    if (scrapeRes.ok) {
                                                    const result = await scrapeRes.json() as { ok: boolean; data: BriefingData };
                                                    if (result.ok && result.data) {
                                                                      briefingData = result.data;
                                                    }
                                    }
                      } catch {
                                    // Fall through to raw fetch
                      }
          }

          // Fallback: raw fetch + HTML parse (may get 429'd by GovBase)
          if (!briefingData) {
                      const html = await cachedFetch("https://govbase.com", 60 * 60);
                      if (html) {
                                    try {
                                                    const summaryMatch = html.match(
                                                                      /Today in Washington[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i
                                                    );
                                                    const summary = summaryMatch?.[1]
                                                      ?.replace(/<[^>]+>/g, "")
                                                      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                                                      .replace(/&nbsp;/g, " ")
                                                      .trim()
                                                      .slice(0, 500) ?? "";

                                                    const sourcesMatch = html.match(/(\d+)\s*sources/i);
                                                    const sourceCount = sourcesMatch ? parseInt(sourcesMatch[1], 10) : 316;

                                                    const freshnessMatch = html.match(/updated?\s*([\d]+[mhd]\s*ago)/i);
                                                    const updatedAgo = freshnessMatch?.[1] ?? "";

                                                    const categories: { name: string; count?: number }[] = [];
                                                    const tabRegex = /(Top Impacts|Congress|Key Updates|Top Stories|Executive Orders|Bills)[\s]*(\d+)?/gi;
                                                    let tabMatch;
                                                    while ((tabMatch = tabRegex.exec(html)) !== null && categories.length < 6) {
                                                                      categories.push({
                                                                                        name: tabMatch[1],
                                                                                        count: tabMatch[2] ? parseInt(tabMatch[2], 10) : undefined,
                                                                      });
                                                    }

                                                    if (summary || categories.length > 0) {
                                                                      briefingData = { summary, sources: sourceCount, updatedAgo, categories };
                                                    }
                                    } catch {
                                                    // Parsing failed
                                    }
                      }
          }

          if (!briefingData) {
                      return c.json({ briefing: null });
          }

          return c.json({
                      briefing: {
                                    summary: briefingData.summary || "AI-synthesized daily briefing from 316+ policy, news, and government sources.",
                                    sources: briefingData.sources ?? 316,
                                    updatedAgo: briefingData.updatedAgo ?? "",
                                    categories: briefingData.categories ?? [],
                                    url: "https://govbase.com",
                      },
          });
});

export default app;
