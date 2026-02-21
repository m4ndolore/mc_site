# Visual Regression Testing

## Overview

Playwright visual regression tests capture screenshots of key pages and compare them against committed baselines. Tests run in CI on every push to `main` and on pull requests.

## Stack

- **Playwright Test** with `toHaveScreenshot` assertions
- **Chromium** (desktop, 1280x720 viewport)
- **Vite preview** server on port 4173

## Test Files

| File | Coverage |
|------|----------|
| `tests/visual/homepage.spec.ts` | Hero, mid-page (platform), footer — dark & light themes |
| `tests/visual/subpages.spec.ts` | Builders, blog, combine pages — dark & light themes |

## Running Locally

```bash
# Build first (tests run against vite preview)
npm run build

# Run all visual tests
npx playwright test

# Run with headed browser
npx playwright test --headed

# Update baselines after intentional visual changes
npx playwright test --update-snapshots
```

## Baseline Screenshots

Baselines live in `tests/visual/screenshots/` and are tracked in git.

**Important:** Baselines must be generated on the same OS as CI (Ubuntu/Linux). macOS-generated screenshots will have font rendering differences that cause false failures.

## CI Behavior

The CI workflow in `.github/workflows/ci.yml` has self-healing baseline logic:

1. **Baselines exist** — runs normal comparison (`npx playwright test`)
2. **Baselines missing** — runs `--update-snapshots`, commits the Linux-generated PNGs back to the repo with `[skip ci]`, then the next run compares normally

This means:
- Adding a new test without a baseline will auto-generate it on the next CI run
- Deleting all baselines triggers a full regeneration
- The `[skip ci]` tag prevents infinite commit loops

## Updating Baselines After Visual Changes

When you intentionally change the site's appearance:

1. Push your changes — CI will fail because screenshots differ
2. Delete the affected baselines from `tests/visual/screenshots/`
3. Commit and push — CI auto-regenerates the baselines
4. Next CI run passes with the new baselines

Or regenerate locally in a matching environment:

```bash
npx playwright test --update-snapshots
git add tests/visual/screenshots/
git commit -m "chore: update visual baselines"
```

## Configuration

Key settings in `playwright.config.ts`:

| Setting | Value | Purpose |
|---------|-------|---------|
| `maxDiffPixelRatio` | 0.015 | Tolerance for pixel differences (1.5%) |
| `animations` | disabled | Prevents flaky diffs from CSS animations |
| `retries` (CI) | 2 | Retries on failure to reduce flakiness |
| `workers` | 1 | Serial execution for deterministic results |

## Test Helpers

Tests use shared helpers defined in each spec file:

- **`setTheme(page, 'dark'|'light')`** — sets `mc-theme` in localStorage before page load
- **`waitForStable(page)`** — waits for `networkidle` + 500ms settle time
- **`hideAnimatedElements(page)`** — hides video backgrounds, canvas, and particle effects to prevent non-deterministic diffs

## Artifacts on Failure

When tests fail in CI, two artifacts are uploaded (retained 14 days):

- **`playwright-report/`** — HTML report with side-by-side diffs
- **`screenshot-diffs/`** — actual vs expected image comparisons
