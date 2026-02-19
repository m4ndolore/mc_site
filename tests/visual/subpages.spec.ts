import { test, expect, Page } from '@playwright/test';

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.addInitScript((t) => {
    localStorage.setItem('mc-theme', t);
  }, theme);
}

async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

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
    `,
  });
  await page.waitForTimeout(100);
}

test.describe('Subpages - Dark Theme', () => {
  test('builders page', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.goto('/builders.html');
    await waitForStable(page);
    await hideAnimatedElements(page);
    await expect(page).toHaveScreenshot('builders-dark.png');
  });

  test('blog page', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.goto('/blog.html');
    await waitForStable(page);
    await expect(page).toHaveScreenshot('blog-dark.png');
  });

  test('the combine page', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.goto('/programs/the-combine.html');
    await waitForStable(page);
    await hideAnimatedElements(page);
    await expect(page).toHaveScreenshot('combine-dark.png');
  });
});

test.describe('Subpages - Light Theme', () => {
  test('builders page', async ({ page }) => {
    await setTheme(page, 'light');
    await page.goto('/builders.html');
    await waitForStable(page);
    await hideAnimatedElements(page);
    await expect(page).toHaveScreenshot('builders-light.png');
  });
});
