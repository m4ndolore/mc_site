# REQ-PLATFORM-001: Merge Combinator Platform Convergence

**Status:** PENDING
**Priority:** CRITICAL
**Phase:** 9
**Effort:** 8.0 weeks (phased)
**Dependencies:** REQ-UX-011, REQ-AUTH-001, REQ-INFRA-003
**Blocks:** (downstream platform requirements)
**Assignee:** —
**Created:** 2026-02-20

---

## Objective

Consolidate all authenticated/private content from SigmaBlox and signal-incubator into mergecombinator.com as the single platform for Defense Builders. SigmaBlox becomes a public-only showcase; MC becomes the canonical authenticated platform.

This is the master tracking requirement for the platform convergence described in:
- `sigmablox/docs/architecture/STRATEGIC-CONVERGENCE-2026-02.md`
- `sigmablox/docs/architecture/ADR-001-sigmablox-bounded-architecture.md`
- `mc_site/docs/sigmablox-review.md` (full SigmaBlox architecture inventory)

---

## The Boundary Rule

> If it requires knowing who you are, it lives on **mergecombinator.com**.
> If it exists to showcase and attract, it lives on **sigmablox.com**.

---

## What Moves to MC

### From SigmaBlox (apps/webhook + apps/via-dashboard)

| Feature | Source | LOC/Size | Priority |
|---------|--------|----------|----------|
| Auth code (OAuth, middleware, JWT) | authentik-middleware.js, auth-middleware-simple.js | ~4,100 LOC | Phase 1 |
| Access request/approval workflow | local-server.js, approval-service.js | ~500 LOC | Phase 1 |
| Company self-service editor (My Company) | my-company.js (Ghost theme) | 143KB | Phase 2 |
| Company onboarding flow | CompanyProfile model, /onboarding endpoints | ~800 LOC | Phase 2 |
| Company claiming system | company-claim.js repo, auto-approval logic | ~600 LOC | Phase 2 |
| User profiles & account management | account-modal.hbs, member enrichment API | ~400 LOC | Phase 2 |
| Favorites, interests, notifications | repositories: favorite.js, interest.js, notification.js | ~1,200 LOC | Phase 2 |
| Notes + Y.js collaboration | note.js repo, Hocuspocus integration | ~800 LOC | Phase 3 |
| AI content assistant | content-assistant.js (Perplexity integration) | 142KB | Phase 3 |
| Chatbot | chatbot routes | 25KB | Phase 3 |
| Admin dashboards | VIA Dashboard (4 custom pages) | 139KB admin JS | Phase 3 |
| Coach directory | coaches.js routes, Coach model | ~400 LOC | Phase 2 |
| Success story pipeline | story-invite.js, user-draft.js, company-post.js | ~600 LOC | Phase 3 |
| Cohort update forms | CohortUpdate model, access tokens | ~300 LOC | Phase 3 |
| Share links | CompanyShareLink model | ~200 LOC | Phase 3 |

### From signal-incubator (apps/console)

| Feature | Source | Status | Priority |
|---------|--------|--------|----------|
| Builders page (live API) | apps/console/src/pages/BuildersPage.tsx | Functional | Phase 2 |
| Builder detail page | BuilderDetailPage.tsx | Functional | Phase 2 |
| Champions page (live API) | ChampionsPage.tsx | Functional | Phase 2 |
| Champion detail page | ChampionDetailPage.tsx | Functional | Phase 2 |
| Watchlist/Pipeline (kanban) | WatchlistPage.tsx, watchlist-local.ts | Functional (localStorage) | Phase 2 |
| Problem Board (CRUD) | ProblemsPage.tsx, problems.ts | Functional (localStorage) | Phase 3 |
| @mc/ui component library | packages/ui/ (PanelLayout, ModuleNav, ThemeProvider) | Complete | Phase 2 |
| VIA SSO auth hook | apps/console/src/lib/auth.ts | Complete | Phase 1 |
| Console switching | consoles.ts | Complete | Phase 2 |
| Account modal | Account modal component | Complete | Phase 2 |

### From signal-incubator (apps/dashboard — Wingman)

| Feature | Source | Status | Priority |
|---------|--------|--------|----------|
| Matrix messaging UI | ConversationList, MessageView, ChannelTabs | Complete | Phase 4 (separate product) |
| AI Advisor panel | AdvisorPanel, ChatInterface, InsightsQueue | Complete | Phase 4 |
| Ollama integration | packages/ai-advisor | Complete | Phase 4 |
| Matrix client | packages/matrix-client | Complete | Phase 4 |

> Wingman (Phase 4) is a separate product track. It stays in signal-incubator for now and deploys independently to wingman.mergecombinator.com.

---

## Phased Execution

### Phase 0: Ship Quick Wins (1 week) — IN PROGRESS
- [x] REQ-UX-011: Redesign /access page as canonical entry point (split-panel, interest chips, consolidated sign-in)
- [ ] Replace SigmaBlox `/join` page — redirect to MC `/access`
- [ ] Verify auth flow works end-to-end: `/access` → sign in → VIA → redirect back to MC

### Phase 1: Auth Ownership (2 weeks)
- [ ] Strip all auth code from SigmaBlox (4,100 LOC → 0)
- [ ] Consolidate auth endpoints on api.mergecombinator.com
- [ ] Port access request/approval workflow to MC
- [ ] Context-aware join form (`?context=combine`, `?context=builders`, `?context=guild`)
- [ ] VIA group mapping: `sigmablox-*` groups → `mc-*` groups (or unified names)

### Phase 2: User & Company Profiles (3 weeks)
- [ ] Port user profile management to MC (account settings, profile editing)
- [ ] Port company self-service editor (My Company) — the 143KB monster
- [ ] Port company claiming system with auto-approval logic
- [ ] Port company onboarding flow (7-step wizard)
- [ ] Migrate Builders and Champions browsing (from signal-incubator console)
- [ ] Port watchlist/pipeline feature
- [ ] Port favorites, interests, notifications
- [ ] Port coach directory
- [ ] Integrate @mc/ui components or reconcile with mc_site design system

### Phase 3: Content & Collaboration (2 weeks)
- [ ] Port notes + Y.js real-time collaboration
- [ ] Port AI content assistant (Perplexity integration)
- [ ] Port success story pipeline (invites, drafts, reviews)
- [ ] Port cohort update forms
- [ ] Port share links
- [ ] Port admin dashboards (or replace with MC-native admin)

### Phase 4: Wingman (separate track)
- [ ] Deploy Wingman dashboard to wingman.mergecombinator.com
- [ ] Matrix messaging integration
- [ ] AI Advisor with Ollama
- [ ] Production deployment with CF Pages

---

## Data Architecture Decisions

### Database Strategy
SigmaBlox uses PostgreSQL + Prisma with 28 models. Options:
1. **Lift-and-shift Prisma schema** to MC's API layer (CF Workers + D1 or external PG)
2. **Proxy through existing SigmaBlox API** during transition (current signal-incubator approach)
3. **Rebuild on CF D1/KV** for edge-native performance

### API Strategy
- Current: signal-incubator proxies `/api/*` to `www.mergecombinator.com` which routes to SigmaBlox API
- Target: `api.mergecombinator.com` owns all authenticated endpoints directly
- SigmaBlox API reduced to ~15 public-only endpoints

### Frontend Strategy
- mc_site: Static HTML/CSS/JS with Vite build (current marketing site)
- signal-incubator console: React SPA with @mc/ui
- Decision needed: embed React console pages into mc_site routes, or keep as separate CF Pages deployment at `app.mergecombinator.com`?

---

## Key Reference Documents

| Document | Location | Content |
|----------|----------|---------|
| Strategic Convergence | `../sigmablox/docs/architecture/STRATEGIC-CONVERGENCE-2026-02.md` | Master strategic framework |
| ADR-001 Bounded Architecture | `../sigmablox/docs/architecture/ADR-001-sigmablox-bounded-architecture.md` | Feature-by-feature migration spec |
| SigmaBlox Review | `docs/sigmablox-review.md` | Full SigmaBlox architecture inventory (830 lines) |
| API Integration Spec | `specs/sigmablox-api-integration.md` | Phased API integration plan |
| User Migration Scripts | `scripts/README-MIGRATION.md` | Ghost CMS → MC user migration (21 users) |
| VIA Migration Map | `../sigmablox/docs/auth/VIA-MIGRATION-MAP.md` | Auth infrastructure consolidation |
| My Company Dashboard Design | `../sigmablox/docs/plans/2026-01-24-my-company-via-dashboard-design.md` | Company editor specs |
| MC Router Plan | `../sigmablox/docs/merge/project-plan.md` | Routing architecture |
| Signal-Incubator Plans | `../signal-incubator/docs/plans/` | Console/dashboard architecture (11 files) |
| Signal-Incubator RTM | `../signal-incubator/.rtmx/` | 17 requirements (9 complete, 2 in progress, 6 missing) |

---

## SigmaBlox Target State (post-migration)

- Templates: 34 → 7 (79% reduction)
- API endpoints: 129 → 15 (88% reduction)
- DB models: 28 → 6 (79% reduction)
- Auth code: ~4,100 LOC → 0 (100% removal)
- Role: Public-only showcase for The Combine program

---

## Signal-Incubator Target State (post-migration)

Console features absorbed into mc_site or `app.mergecombinator.com`. Remaining:
- Wingman dashboard (separate product at `wingman.mergecombinator.com`)
- @mc/ui library (shared or forked into mc_site)
- Matrix/AI infrastructure (Wingman-specific)

---

## Acceptance Criteria

1. All authenticated user flows happen on `mergecombinator.com` (zero auth on SigmaBlox)
2. Users can manage their profile, company, and preferences on MC
3. Company claiming, onboarding, and self-service editing work on MC
4. Builders and Champions browsing available on MC (authenticated views)
5. SigmaBlox serves only public content (no login buttons, no auth cookies)
6. `/access` page is the canonical entry point for all MC products
7. API consolidation: `api.mergecombinator.com` serves all authenticated endpoints
