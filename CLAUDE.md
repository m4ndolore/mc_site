# mc_site — Merge Combinator Public Site

Static HTML/CSS/JS site built with Vite 6, deployed on Cloudflare Pages. Vanilla ES modules, no framework.

**Boundary rule:** If it requires auth, it lives on `guild.mergecombinator.com`. mc_site is public-only.

## Hosts

- `mergecombinator.com` — this repo (public marketing, /access)
- `guild.mergecombinator.com` — authenticated SPA (source: `signal-incubator/apps/console`)
- `api.mergecombinator.com` — CF Workers API
- `via.mergecombinator.com` — VIA identity provider (Authentik, OIDC)

## Dev Commands

```bash
npm run dev / npm run build / npm run preview
```

## Auth

VIA (Authentik) OIDC — mc_site does NOT store tokens; auth redirects to Guild. PKCE flow handled by `cloudflare/auth.js`.

## Design (C2UX)

Dark-native, Inter font, 2px radius. Tokens: `--blue` (#3b82f6), `--offwhite`, `--gray-light`, `--gray-medium`. Theme: `js/theme.js`, light mode: `styles/light-theme.css`.

## RTMX

`rtmx status` / `rtmx backlog` / `rtmx health` from project root.

## GBrain Configuration (configured by /setup-gbrain)
- Mode: remote-http (local loopback server)
- MCP URL: http://127.0.0.1:3131/mcp
- Server: `gbrain serve --http --port 3131`, bound to 127.0.0.1 only
- Engine: pglite at `~/.gbrain/brain.pglite`
- Server version: gbrain v0.46.21.0
- Setup date: 2026-08-21
- MCP registered: yes (user scope, HTTP transport)
- Token: long-lived bearer (`gbrain auth create claude-code`, scopes read+write,
  no expiry) stored in `~/.claude.json` and `~/.gbrain/.remote-token` (mode 600).
  Never commit it; it is not recorded in this file.
- Current repo policy: read-write (source id `gstack-code-mc-site`)

### Operational notes
- PGLite is **single-writer**. While `gbrain serve` is running it holds an
  exclusive lock, so `gbrain` CLI commands that touch the DB will fail with a
  lock error. Stop the server first, run the command, then restart it.
  This cuts both ways: a long `gbrain sync` holds the lock too, so the server
  cannot run at the same time. Sequence is stop server -> sync -> restart
  server. Starting the server mid-sync yields ConnectionRefused on /mcp.
- The server does **not** auto-start on boot. After a reboot, relaunch with:
  `GBRAIN_ADMIN_BOOTSTRAP_TOKEN=$(cat ~/.gbrain/.serve-admin-token) \
     nohup ~/.bun/bin/gbrain serve --http --port 3131 > ~/.gbrain/serve.log 2>&1 &`
- Embedding needs `OPENROUTER_API_KEY`; it lives in `~/.gbrain/env` but is not
  auto-loaded by the CLI. Source it first: `set -a; . ~/.gbrain/env; set +a`.
- `~/.bun/bin` is not on the default PATH in non-interactive shells; use the
  absolute path `~/.bun/bin/gbrain` or export the PATH.
- A new source is created **non-federated**: it is skipped by cross-source search,
  so the MCP returns nothing from it and `get_page` reports `page_not_found`, even
  though `sources status` shows its pages. Fix: `gbrain sources federate <id>`.
- `gbrain serve` needs `OPENROUTER_API_KEY` in its environment or semantic search
  silently degrades (`vector_enabled: false`, `embed_unavailable`, zero hits).
- MCP `list_pages` ignores its `source` filter and caps at 100 rows, so it is NOT a
  reliable way to inspect a source. Use the CLI (`gbrain search --source <id>`,
  `gbrain sources status`) for anything you intend to trust.

See [AGENTS.md](./AGENTS.md) for agent stack routing (ECC leads; gstack owns browser/deploy; superpowers owns planning).

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
