# Playwright MCP (Cloudflare)

Exposes a Playwright MCP server on Cloudflare Browser Rendering. Connect with an MCP client via `/sse` or `/mcp`.

## Setup

```bash
cd cloudflare/playwright-mcp
npm install
```

## Run

```bash
npm run dev
```

## Endpoints

- `GET /sse` (Server-Sent Events)
- `POST /mcp` (MCP HTTP)

## Deploy

```bash
npm run deploy
```
