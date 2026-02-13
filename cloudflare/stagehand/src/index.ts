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

      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(targetBase, { waitUntil: "load" });

      // Mobile menu open/close behaviors
      await page.click("#mobile-toggle");
      let isOpen = await page.evaluate(() =>
        document.querySelector(".nav__menu")?.classList.contains("active")
      );
      results.push({
        name: "Mobile menu opens",
        ok: Boolean(isOpen),
      });

      const outsideClick = await page.evaluate(() => {
        const menu = document.querySelector(".nav__menu");
        if (!menu) return null;
        const rect = menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const clickY = rect.bottom + 20 < viewportHeight ? rect.bottom + 20 : Math.max(10, rect.top - 20);
        const clickX = Math.max(10, rect.left - 20);
        return { x: clickX, y: clickY };
      });
      if (outsideClick) {
        await page.mouse.click(outsideClick.x, outsideClick.y);
      } else {
        await page.mouse.click(10, 700);
      }
      isOpen = await page.evaluate(() =>
        document.querySelector(".nav__menu")?.classList.contains("active")
      );
      results.push({
        name: "Menu closes on outside tap",
        ok: !isOpen,
      });

      await page.click("#mobile-toggle");
      await page.keyboard.press("Escape");
      isOpen = await page.evaluate(() =>
        document.querySelector(".nav__menu")?.classList.contains("active")
      );
      results.push({
        name: "Menu closes on Escape",
        ok: !isOpen,
      });

      // Dropdown tap-to-toggle (mobile)
      await page.click("#mobile-toggle");
      await page.click(".nav__dropdown-trigger");
      let dropdownOpen = await page.evaluate(() =>
        document.querySelector(".nav__dropdown")?.classList.contains("active")
      );
      results.push({
        name: "Dropdown opens on tap",
        ok: Boolean(dropdownOpen),
      });

      await page.click(".nav__dropdown-trigger");
      dropdownOpen = await page.evaluate(() =>
        document.querySelector(".nav__dropdown")?.classList.contains("active")
      );
      results.push({
        name: "Dropdown closes on second tap",
        ok: !dropdownOpen,
      });

      // Touch target checks
      const targetChecks = await page.evaluate((minSize) => {
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
            if (rect.width < minSize || rect.height < minSize) {
              failures.push(`${selector} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
            }
          });
        });

        return failures;
      }, MIN_TOUCH_TARGET);

      results.push({
        name: `Touch targets >= ${MIN_TOUCH_TARGET}px`,
        ok: targetChecks.length === 0,
        details: targetChecks.length ? targetChecks.join(", ") : undefined,
      });

      // Footer checks
      await page.goto(`${targetBase.replace(/\/$/, "")}/access`, { waitUntil: "load" });
      const accessFooter = await page.evaluate(() => Boolean(document.querySelector(".access-footer")));
      results.push({
        name: "Access footer present",
        ok: accessFooter,
      });

      await page.goto(`${targetBase.replace(/\/$/, "")}/guild`, { waitUntil: "load" });
      const guildFooter = await page.evaluate(() => Boolean(document.querySelector(".guild-footer")));
      results.push({
        name: "Guild footer present",
        ok: guildFooter,
      });

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
