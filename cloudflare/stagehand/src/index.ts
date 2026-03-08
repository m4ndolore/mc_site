import { Stagehand } from "@browserbasehq/stagehand";
import { endpointURLString } from "@cloudflare/playwright";
import type { Page } from "@cloudflare/playwright";
import { WorkersAIClient } from "./workersAIClient";

type Env = {
  BROWSER: Fetcher;
  AI: Ai;
  STAGING_URL?: string;
  ALLOWED_SCRAPE_DOMAINS?: string;
};

// ─── Shared browser helper ──────────────────────────────────────────────────
async function withBrowser<T>(
  env: Env,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const stagehand = new Stagehand({
    env: "LOCAL",
    localBrowserLaunchOptions: { cdpUrl: endpointURLString(env.BROWSER) },
    llmClient: new WorkersAIClient(env.AI),
    verbose: 0,
  });
  try {
    await stagehand.init();
    return await fn(stagehand.page);
  } finally {
    await stagehand.close();
  }
}

// ─── Scrape: metadata extraction ────────────────────────────────────────────
async function extractMetadata(page: Page) {
  return page.evaluate(() => {
    const meta = (name: string) =>
      document.querySelector(`meta[property="${name}"]`)?.getAttribute("content")
      ?? document.querySelector(`meta[name="${name}"]`)?.getAttribute("content")
      ?? "";

    const tags: string[] = [];
    document.querySelectorAll('meta[property="article:tag"]').forEach(el => {
      const v = el.getAttribute("content")?.trim();
      if (v && tags.length < 5) tags.push(v);
    });

    // Also grab visible tag-like elements (for SPAs like GovBase)
    const policyTags: string[] = [];
    document.querySelectorAll('[class*="tag"], [class*="chip"], [class*="badge"]').forEach(el => {
      const t = el.textContent?.trim();
      if (t && t.length < 40 && policyTags.length < 5) policyTags.push(t);
    });

    return {
      title: meta("og:title") || meta("twitter:title") || document.title || "",
      description: (meta("og:description") || meta("description") || meta("twitter:description") || "").slice(0, 300),
      image: meta("og:image"),
      date: meta("article:published_time") || meta("datePublished") || meta("date") || "",
      tags,
      policyTags,
    };
  });
}

// ─── Scrape: GovBase briefing extraction ────────────────────────────────────
async function extractBriefing(page: Page) {
  return page.evaluate(() => {
    const body = document.body?.innerText ?? "";

    // Find the briefing summary — first substantial paragraph in the main content
    let summary = "";
    const paragraphs = document.querySelectorAll("main p, article p, [class*='summary'] p, [class*='briefing'] p");
    for (const p of paragraphs) {
      const text = p.textContent?.trim() ?? "";
      if (text.length > 80) {
        summary = text.slice(0, 500);
        break;
      }
    }
    if (!summary) {
      // Fallback: grab text near "Today in Washington"
      const idx = body.indexOf("Today in Washington");
      if (idx >= 0) {
        const after = body.slice(idx + 20, idx + 520).trim();
        const firstSentenceEnd = after.search(/[.!?]\s/);
        summary = firstSentenceEnd > 0 ? after.slice(0, after.indexOf("\n", firstSentenceEnd) || firstSentenceEnd + 200) : after.slice(0, 500);
      }
    }

    // Source count
    const sourcesMatch = body.match(/(\d+)\s*sources/i);
    const sources = sourcesMatch ? parseInt(sourcesMatch[1], 10) : null;

    // Freshness
    const freshnessMatch = body.match(/updated?\s*([\d]+\s*[mhd]\w*\s*ago)/i);
    const updatedAgo = freshnessMatch?.[1]?.trim() ?? "";

    // Category tabs
    const categories: { name: string; count?: number }[] = [];
    const tabRegex = /(Top Impacts|Congress|Key Updates|Top Stories|Executive Orders|Bills)\s*(\d+)?/gi;
    let match;
    while ((match = tabRegex.exec(body)) !== null && categories.length < 6) {
      categories.push({
        name: match[1],
        count: match[2] ? parseInt(match[2], 10) : undefined,
      });
    }

    return { summary, sources, updatedAgo, categories };
  });
}

// ─── Scrape: full page text ─────────────────────────────────────────────────
async function extractFullText(page: Page) {
  return page.evaluate(() => ({
    title: document.title,
    text: (document.body?.innerText ?? "").slice(0, 10000),
  }));
}

// ─── /scrape handler ────────────────────────────────────────────────────────
async function handleScrape(request: Request, env: Env): Promise<Response> {
  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url");
  const extract = reqUrl.searchParams.get("extract") ?? "metadata";
  const waitMs = Math.min(Number(reqUrl.searchParams.get("wait") ?? "3000"), 10000);

  if (!targetUrl) {
    return jsonResponse({ ok: false, error: "Missing ?url= parameter" }, 400);
  }

  // Domain allowlist
  const allowed = (env.ALLOWED_SCRAPE_DOMAINS ?? "govbase.com,executivegov.com,breakingdefense.com,defenseone.com")
    .split(",").map(d => d.trim());
  let hostname: string;
  try {
    hostname = new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return jsonResponse({ ok: false, error: "Invalid URL" }, 400);
  }
  if (!allowed.some(d => hostname.endsWith(d))) {
    return jsonResponse({ ok: false, error: `Domain ${hostname} not in allowlist` }, 403);
  }

  // CF Cache — keyed on extract mode + target URL
  const cacheKey = new Request(`https://scrape-cache/${extract}/${targetUrl}`, { method: "GET" });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const data = await withBrowser(env, async (page) => {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(waitMs);

      switch (extract) {
        case "briefing": return extractBriefing(page);
        case "full": return extractFullText(page);
        default: return extractMetadata(page);
      }
    });

    const body = JSON.stringify({
      ok: true,
      url: targetUrl,
      extract,
      data,
      cachedAt: new Date().toISOString(),
    });
    const response = new Response(body, {
      headers: {
        "content-type": "application/json",
        "cache-control": "s-maxage=3600, max-age=3600",
      },
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: message }, 502);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ─── UI test handler (existing logic, extracted) ────────────────────────────
type TestResult = {
  name: string;
  ok: boolean;
  details?: string;
};

const MIN_TOUCH_TARGET = 44;
const EVAL_RETRIES = 3;
const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812, isMobile: true },
  { name: "tablet-768", width: 768, height: 1024, isMobile: true },
  { name: "desktop-1024", width: 1024, height: 768, isMobile: false },
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
];
const COLOR_SCHEMES: Array<"light" | "dark"> = ["dark", "light"];

async function handleTests(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const targetBase = url.searchParams.get("url") || env.STAGING_URL || "";

  if (!targetBase) {
    return new Response("Missing STAGING_URL or ?url=", { status: 400 });
  }

  const results: TestResult[] = [];
  let stagehand: Stagehand | null = null;

  try {
    stagehand = new Stagehand({
      env: "LOCAL",
      localBrowserLaunchOptions: { cdpUrl: endpointURLString(env.BROWSER) },
      llmClient: new WorkersAIClient(env.AI),
      verbose: 1,
    });

    await stagehand.init();
    const page = stagehand.page;

    const safeEvaluate = async <T>(fn: () => T, retryLabel: string) => {
      for (let attempt = 0; attempt < EVAL_RETRIES; attempt += 1) {
        try {
          return await page.evaluate(fn);
        } catch (error) {
          if (attempt === EVAL_RETRIES - 1) {
            throw new Error(`evaluate failed (${retryLabel}): ${error instanceof Error ? error.message : String(error)}`);
          }
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(250);
        }
      }
      throw new Error(`evaluate failed (${retryLabel})`);
    };

    const baseUrl = targetBase.replace(/\/$/, "");

    for (const scheme of COLOR_SCHEMES) {
      await page.emulateMedia({ colorScheme: scheme });

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

        const prefix = `${scheme}/${viewport.name}`;

        if (viewport.isMobile) {
          await page.click("#mobile-toggle");
          let isOpen = await safeEvaluate(
            () => document.querySelector(".nav__menu")?.classList.contains("active") ?? false,
            `${prefix}/menu-open`
          );
          results.push({ name: `${prefix} mobile menu opens`, ok: Boolean(isOpen) });

          const outsideClick = await safeEvaluate(() => {
            const menu = document.querySelector(".nav__menu");
            if (!menu) return null;
            const rect = menu.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const clickY = rect.bottom + 20 < viewportHeight ? rect.bottom + 20 : Math.max(10, rect.top - 20);
            const clickX = Math.max(10, rect.left - 20);
            return { x: clickX, y: clickY };
          }, `${prefix}/outside-click`);
          if (outsideClick) {
            await page.mouse.click(outsideClick.x, outsideClick.y);
          } else {
            await page.mouse.click(10, viewport.height - 40);
          }
          isOpen = await safeEvaluate(
            () => document.querySelector(".nav__menu")?.classList.contains("active") ?? false,
            `${prefix}/menu-close-outside`
          );
          results.push({ name: `${prefix} menu closes on outside tap`, ok: !isOpen });

          await page.click("#mobile-toggle");
          await page.keyboard.press("Escape");
          isOpen = await safeEvaluate(
            () => document.querySelector(".nav__menu")?.classList.contains("active") ?? false,
            `${prefix}/menu-close-escape`
          );
          results.push({ name: `${prefix} menu closes on Escape`, ok: !isOpen });

          await page.click("#mobile-toggle");
          await page.click(".nav__dropdown-trigger");
          let dropdownOpen = await safeEvaluate(
            () => document.querySelector(".nav__dropdown")?.classList.contains("active") ?? false,
            `${prefix}/dropdown-open`
          );
          results.push({ name: `${prefix} dropdown opens on tap`, ok: Boolean(dropdownOpen) });

          await page.click(".nav__dropdown-trigger");
          dropdownOpen = await safeEvaluate(
            () => document.querySelector(".nav__dropdown")?.classList.contains("active") ?? false,
            `${prefix}/dropdown-close`
          );
          results.push({ name: `${prefix} dropdown closes on second tap`, ok: !dropdownOpen });

          const targetChecks = await safeEvaluate(() => {
            const selectors = [
              "#mobile-toggle", ".nav__link", ".nav__btn",
              ".nav__dropdown-trigger", ".nav__dropdown-item",
            ];
            const failures: string[] = [];
            selectors.forEach((selector) => {
              document.querySelectorAll(selector).forEach((node) => {
                const el = node as HTMLElement;
                const rect = el.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                  failures.push(`${selector} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
                }
              });
            });
            return failures;
          }, `${prefix}/touch-targets`);

          results.push({
            name: `${prefix} touch targets >= ${MIN_TOUCH_TARGET}px`,
            ok: targetChecks.length === 0,
            details: targetChecks.length ? targetChecks.join(", ") : undefined,
          });
        } else {
          const desktopNavVisible = await safeEvaluate(() => {
            const menu = document.querySelector(".nav__menu");
            if (!menu) return false;
            const rect = menu.getBoundingClientRect();
            return rect.height > 0 && rect.width > 0;
          }, `${prefix}/nav-visible`);
          results.push({ name: `${prefix} desktop nav visible`, ok: desktopNavVisible });

          await page.hover(".nav__dropdown");
          const dropdownVisible = await safeEvaluate(() => {
            const menu = document.querySelector(".nav__dropdown-menu") as HTMLElement | null;
            if (!menu) return false;
            const rect = menu.getBoundingClientRect();
            return rect.height > 0 && rect.width > 0;
          }, `${prefix}/dropdown-hover`);
          results.push({ name: `${prefix} dropdown opens on hover`, ok: dropdownVisible });
        }
      }

      await page.goto(`${baseUrl}/access`, { waitUntil: "domcontentloaded" });
      const accessFooter = await safeEvaluate(() => Boolean(document.querySelector(".access-footer")), `${scheme}/access-footer`);
      results.push({ name: `${scheme} access footer present`, ok: accessFooter });

      await page.goto(`${baseUrl}/guild`, { waitUntil: "domcontentloaded" });
      const guildFooter = await safeEvaluate(() => Boolean(document.querySelector(".guild-footer")), `${scheme}/guild-footer`);
      results.push({ name: `${scheme} guild footer present`, ok: guildFooter });
    }

    const ok = results.every((result) => result.ok);
    return new Response(JSON.stringify({ ok, results }, null, 2), {
      headers: { "content-type": "application/json" },
      status: ok ? 200 : 500,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message, results }, null, 2), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  } finally {
    if (stagehand) {
      await stagehand.close();
    }
  }
}

// ─── Router ─────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    switch (pathname) {
      case "/scrape":
        return handleScrape(request, env);
      case "/health":
        return jsonResponse({ ok: true, timestamp: new Date().toISOString() });
      default:
        return handleTests(request, env);
    }
  },
};
