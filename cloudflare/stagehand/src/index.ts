import { Stagehand } from "@browserbasehq/stagehand";
import { endpointURLString } from "@cloudflare/playwright";
import { WorkersAIClient } from "./workersAIClient";

type Env = {
  BROWSER: Fetcher;
  AI: Ai;
  STAGING_URL?: string;
};

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
            // Mobile menu open/close behaviors
            await page.click("#mobile-toggle");
            let isOpen = await safeEvaluate(
              () => document.querySelector(".nav__menu")?.classList.contains("active") ?? false,
              `${prefix}/menu-open`
            );
            results.push({
              name: `${prefix} mobile menu opens`,
              ok: Boolean(isOpen),
            });

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
            results.push({
              name: `${prefix} menu closes on outside tap`,
              ok: !isOpen,
            });

            await page.click("#mobile-toggle");
            await page.keyboard.press("Escape");
            isOpen = await safeEvaluate(
              () => document.querySelector(".nav__menu")?.classList.contains("active") ?? false,
              `${prefix}/menu-close-escape`
            );
            results.push({
              name: `${prefix} menu closes on Escape`,
              ok: !isOpen,
            });

            // Dropdown tap-to-toggle (mobile)
            await page.click("#mobile-toggle");
            await page.click(".nav__dropdown-trigger");
            let dropdownOpen = await safeEvaluate(
              () => document.querySelector(".nav__dropdown")?.classList.contains("active") ?? false,
              `${prefix}/dropdown-open`
            );
            results.push({
              name: `${prefix} dropdown opens on tap`,
              ok: Boolean(dropdownOpen),
            });

            await page.click(".nav__dropdown-trigger");
            dropdownOpen = await safeEvaluate(
              () => document.querySelector(".nav__dropdown")?.classList.contains("active") ?? false,
              `${prefix}/dropdown-close`
            );
            results.push({
              name: `${prefix} dropdown closes on second tap`,
              ok: !dropdownOpen,
            });

            // Touch target checks (mobile/tablet only)
            const targetChecks = await safeEvaluate(() => {
              const selectors = [
                "#mobile-toggle",
                ".nav__link",
                ".nav__btn",
                ".nav__dropdown-trigger",
                ".nav__dropdown-item",
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
            // Desktop nav checks
            const desktopNavVisible = await safeEvaluate(() => {
              const menu = document.querySelector(".nav__menu");
              if (!menu) return false;
              const rect = menu.getBoundingClientRect();
              return rect.height > 0 && rect.width > 0;
            }, `${prefix}/nav-visible`);
            results.push({
              name: `${prefix} desktop nav visible`,
              ok: desktopNavVisible,
            });

            await page.hover(".nav__dropdown");
            const dropdownVisible = await safeEvaluate(() => {
              const menu = document.querySelector(".nav__dropdown-menu") as HTMLElement | null;
              if (!menu) return false;
              const rect = menu.getBoundingClientRect();
              return rect.height > 0 && rect.width > 0;
            }, `${prefix}/dropdown-hover`);
            results.push({
              name: `${prefix} dropdown opens on hover`,
              ok: dropdownVisible,
            });
          }
        }

        // Footer checks per color scheme
        await page.goto(`${baseUrl}/access`, { waitUntil: "domcontentloaded" });
        const accessFooter = await safeEvaluate(() => Boolean(document.querySelector(".access-footer")), `${scheme}/access-footer`);
        results.push({
          name: `${scheme} access footer present`,
          ok: accessFooter,
        });

        await page.goto(`${baseUrl}/guild`, { waitUntil: "domcontentloaded" });
        const guildFooter = await safeEvaluate(() => Boolean(document.querySelector(".guild-footer")), `${scheme}/guild-footer`);
        results.push({
          name: `${scheme} guild footer present`,
          ok: guildFooter,
        });
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
  },
};
