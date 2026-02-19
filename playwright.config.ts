import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: './tests/visual/test-results',

  snapshotPathTemplate: '{testDir}/screenshots/{testName}/{projectName}/{arg}{ext}',

  timeout: 30_000,

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.015,
      animations: 'disabled',
    },
  },

  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI
    ? [['html', { open: 'never', outputFolder: 'tests/visual/playwright-report' }], ['list']]
    : [['list']],

  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: {
    command: 'npx vite preview --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
