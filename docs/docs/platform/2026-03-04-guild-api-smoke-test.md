# Guild/API Production Smoke Test — 2026-03-04

## Scope
Validate production readiness for Guild SPA and API auth boundaries after Step 1-3 rollout.

- Guild surface: `https://guild.mergecombinator.com`
- API surface: `https://api.mergecombinator.com`
- Current rollout mode: `CONSOLE_ROLLOUT_MODE = "on"`

## Results Matrix

| Scenario | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|
| Guild shell loads | `GET guild.mergecombinator.com/` | 200 HTML | 200 HTML (`MC Console`) | PASS |
| Missing auth token | `GET /guild/me` | 401 | 401 `UNAUTHORIZED` (`Missing or malformed token`) | PASS |
| Malformed token | `GET /guild/me` with `Bearer not-a-jwt` | 401 | 401 `UNAUTHORIZED` (`Malformed token`) | PASS |
| Expired token path | `GET /guild/me` with expired JWT payload | 401 + `WWW-Authenticate` | 401 `TOKEN_EXPIRED` + `WWW-Authenticate: Bearer error="invalid_token"` | PASS |
| Unknown key/signature path | `GET /guild/me` with unsigned JWT | 401 | 401 `UNAUTHORIZED` (`No matching key found`) | PASS |
| Builders endpoint auth gate | `GET /builders/companies` with malformed token | 401 | 401 `UNAUTHORIZED` (`Malformed token`) | PASS |
| Guild origin CORS preflight | `OPTIONS /builders/companies` from `https://guild.mergecombinator.com` | 204 + allow-origin | 204 + `Access-Control-Allow-Origin: https://guild.mergecombinator.com` | PASS |
| Public site origin CORS preflight | `OPTIONS /builders/companies` from `https://mergecombinator.com` | 204 without allow-origin | 204 without `Access-Control-Allow-Origin` | PASS |

## Outstanding Checks (Manual / Persona-Based)
These require valid real OIDC tokens and user personas.

| Scenario | Expected | Status |
|---|---|---|
| Authenticated valid user to `/guild/me` | 200 with normalized `roles` and `role_level` | PENDING |
| Authenticated valid user to `/builders/companies` | 200 with company payload | PENDING |
| Authenticated restricted persona in `on` mode | 200 (no rollout role gate in `on`) | PENDING |

## Notes
- `403` is **not expected** in current production mode (`on`).
- `403` would only be expected if rollout mode is switched to `internal` and user `roleLevel` is below threshold.
- API health remains up: `GET /health` returns `200`.

## Suggested Next Validation Pass
1. Capture one internal valid token flow in Guild browser session and verify `/guild/me` => 200.
2. Verify Builders list page renders data (or record DB table gap if still 503).
3. Archive HAR + screenshots in `.playwright-mcp/` and link from this document.
