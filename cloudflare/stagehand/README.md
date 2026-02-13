# Stagehand Tests (Cloudflare)

Runs Stagehand on Cloudflare Browser Rendering + Workers AI to validate staging UI.

## Setup

```bash
cd cloudflare/stagehand
npm install
```

## Configure

Optional env var in `wrangler.toml`:

- `STAGING_URL` (default: https://mc-router-staging.defensebuilders.workers.dev)

## Run

```bash
npm run dev
```

Then call the worker URL (local or deployed):

```
GET /?url=https://mc-router-staging.defensebuilders.workers.dev
```

Returns JSON with test results.

## Deploy

```bash
npm run deploy
```
