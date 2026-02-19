import { test, expect, Page } from '@playwright/test';

/**
 * Set theme via localStorage before the page loads.
 * The FOUC-prevention inline script in <head> reads 'mc-theme'
 * and applies .light-theme before first paint.
 */
async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.addInitScript((t) => {
    localStorage.setItem('mc-theme', t);
  }, theme);
}

/** Wait for fonts, images, and CSS transitions to settle. */
async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/** Hide non-deterministic elements (video, canvas, animated SVGs). */
async function hideAnimatedElements(page: Page) {
  await page.addStyleTag({
    content: `
      .video-bg__video,
      .hero__canvas,
      .section-canvas,
      video {
        visibility: hidden !important;
      }
      .video-bg__placeholder {
        animation: none !important;
      }
      .hero__particle {
        display: none !important;
      }
    `,
  });
  await page.waitForTimeout(100);
}

test.describe('Homepage - Dark Theme', () => {
  test.beforeEach(async ({ page }) => {
    await setTheme(page, 'dark');
    await page.goto('/');
    await waitForStable(page);
    await hideAnimatedElements(page);
  });

  test('hero viewport', async ({ page }) => {
    await expect(page).toHaveScreenshot('hero-dark.png');
  });

  test('mid-page (platform section)', async ({ page }) => {
    await page.locator('#platform').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('midpage-dark.png');
  });

  test('footer and CTA', async ({ page }) => {
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('footer-dark.png');
  });
});

test.describe('Homepage - Light Theme', () => {
  test.beforeEach(async ({ page }) => {
    await setTheme(page, 'light');
    await page.goto('/');
    await waitForStable(page);
    await hideAnimatedElements(page);
  });

  test('hero viewport', async ({ page }) => {
    await expect(page).toHaveScreenshot('hero-light.png');
  });

  test('mid-page (platform section)', async ({ page }) => {
    await page.locator('#platform').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('midpage-light.png');
  });

  test('footer and CTA', async ({ page }) => {
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('footer-light.png');
  });
});
