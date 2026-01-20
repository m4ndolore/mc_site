# mc_site Operational Guide

## Build & Run

```bash
# Development server (localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Validation (Backpressure)

Run these after implementing to get immediate feedback:

### 1. Build Check
```bash
npm run build
```
Must exit 0. Any build error = fail.

### 2. Visual Verification (Playwright MCP - Chromium)

Start dev server, then use Playwright MCP tools:

```
# Navigate to page
mcp__playwright__browser_navigate url="http://localhost:5173"

# Take screenshot for audit
mcp__playwright__browser_take_screenshot

# Save to .playwright-mcp/ with descriptive name
```

Visual checks:
- Layout renders correctly
- No broken images (check Network tab)
- No console errors
- Responsive at 1920px, 1024px, 768px, 375px

### 3. LLM-as-Judge Criteria

Binary pass/fail on these:
- C2UX compliant (operational, not marketing-y)
- Typography hierarchy correct
- Color palette matches design system
- No broken links (404s)

## Project Structure

```
mc_site/
├── *.html              # Page files (index, builders, blog, etc.)
├── script.js           # Main JavaScript
├── styles.css          # Main Tailwind CSS
├── js/                 # Additional JS modules
├── styles/             # Additional CSS
├── assets/             # Images, fonts
├── public/             # Static files (robots.txt, sitemap.xml)
├── config/             # Build/deploy config
├── docs/               # Documentation
└── specs/              # Ralph specifications
```

## Deployment

- Deploys to Cloudflare Pages on push
- Staging: mc-site-dr4.pages.dev
- Production: www.mergecombinator.com

## Codebase Patterns

- Tailwind CSS for styling (v4)
- Vite for build (v7)
- No framework (vanilla HTML/JS)
- CF Image Resizing via `cfImage()` utility in script.js
