# Opportunities Personalization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Opportunities page from a generic aggregator into a personalized discovery tool with a guided intake flow, profile-aware feed, improved data quality, and a clear free-to-auth conversion funnel.

**Architecture:** The existing React + Vite sub-app at `/opportunities/` stays. We add a profile layer (localStorage), an intake flow component, three feed view modes, and enrich the API worker to surface missing dates/status. Events and Radar tabs are archived, not deleted.

**Tech Stack:** React 19, TypeScript, Vite 6, Hono 4 (CF Workers), CSS-in-JS (inline styles matching existing pattern)

**Design doc:** `docs/plans/2026-04-25-opportunities-personalization-design.md`

**Worktree:** `.worktrees/opportunities-personalization` (branch: `feature/opportunities-personalization`)

---

## Task 1: Archive Events and Radar tabs

Remove Events and Radar from the UI, preserving the files for future revival.

**Files:**
- Move: `opportunities/src/components/EventsPanel.tsx` → `opportunities/src/_archived/EventsPanel.tsx`
- Move: `opportunities/src/components/RadarPanel.tsx` → `opportunities/src/_archived/RadarPanel.tsx`
- Modify: `opportunities/src/App.tsx:1-11` (remove imports for EventsPanel, RadarPanel, fetchOutlookEvents, OutlookEvent)
- Modify: `opportunities/src/App.tsx` (HomePage component — remove events state, events fetch useEffect, Events/Radar tabs from tabs array, Events/Radar conditional renders)

**Step 1: Create `_archived/` directory and move files**

```bash
cd opportunities/src
mkdir -p _archived
git mv components/EventsPanel.tsx _archived/EventsPanel.tsx
git mv components/RadarPanel.tsx _archived/RadarPanel.tsx
```

**Step 2: Remove imports from App.tsx**

In `App.tsx`, remove these lines:
- Line 6: `import EventsPanel from "./components/EventsPanel";`
- Line 7: `import RadarPanel from "./components/RadarPanel";`
- Line 9: Remove `OutlookEvent` from the type import
- Line 10: Remove `fetchOutlookEvents` from the import

**Step 3: Remove Events/Radar state and logic from HomePage**

In the HomePage component inside `App.tsx`:
- Remove `events` and `eventsLoading` state declarations
- Remove the `useEffect` that calls `fetchOutlookEvents()`
- Remove Events and Radar entries from the `tabs` array (keep only Solicitations and Saved)
- Remove the `activeTab === "events"` and `activeTab === "radar"` conditional render blocks

**Step 4: Verify build**

```bash
cd opportunities && npm run build
```
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: archive Events and Radar tabs from Opportunities

Moves EventsPanel.tsx and RadarPanel.tsx to src/_archived/ for future
revival. Removes imports, state, and render logic from App.tsx.
Opportunities page now shows only Solicitations and Saved tabs."
```

---

## Task 2: Create profile types and localStorage hook

Build the profile data model and persistence layer that the intake flow and personalized feed will use.

**Files:**
- Create: `opportunities/src/types/profile.ts`
- Create: `opportunities/src/lib/profile.ts`
- Modify: `opportunities/src/lib/saved-opportunities.ts` (add migration export)

**Step 1: Create profile types**

Create `opportunities/src/types/profile.ts`:

```typescript
export type ViewMode = "opportunity" | "stakeholder" | "mission";

export interface OpportunityProfile {
  techAreas: string[];
  problemAreas: string[];
  viewMode: ViewMode;
  savedIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Create profile hook**

Create `opportunities/src/lib/profile.ts`:

```typescript
import { useState, useCallback, useEffect } from "react";
import type { OpportunityProfile, ViewMode } from "../types/profile";

const PROFILE_KEY = "mc-opportunity-profile-v1";
const OLD_SAVED_KEY = "mc-saved-opportunities-v1";

function loadProfile(): OpportunityProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OpportunityProfile;
  } catch {
    return null;
  }
}

function persistProfile(profile: OpportunityProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Silently fail on quota error
  }
}

/** Migrate saved opportunities from old key into profile */
function migrateOldSaved(): string[] {
  try {
    const raw = localStorage.getItem(OLD_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id?: string }>;
    const ids = parsed.map((item) => item.id).filter(Boolean) as string[];
    localStorage.removeItem(OLD_SAVED_KEY);
    return ids;
  } catch {
    return [];
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<OpportunityProfile | null>(() => {
    const existing = loadProfile();
    if (existing) return existing;

    // Check for old saved items to migrate
    const migratedIds = migrateOldSaved();
    if (migratedIds.length > 0) {
      // Don't create a full profile — just migrate saved IDs
      // Profile will be created when intake completes
      return null;
    }
    return null;
  });

  const hasProfile = profile !== null;

  const createProfile = useCallback(
    (techAreas: string[], problemAreas: string[], viewMode: ViewMode) => {
      const migratedIds = migrateOldSaved();
      const existingSaved = profile?.savedIds ?? [];
      const now = new Date().toISOString();
      const newProfile: OpportunityProfile = {
        techAreas,
        problemAreas,
        viewMode,
        savedIds: [...new Set([...existingSaved, ...migratedIds])],
        createdAt: now,
        updatedAt: now,
      };
      persistProfile(newProfile);
      setProfile(newProfile);
    },
    [profile],
  );

  const updateProfile = useCallback(
    (updates: Partial<Pick<OpportunityProfile, "techAreas" | "problemAreas" | "viewMode">>) => {
      if (!profile) return;
      const updated = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      persistProfile(updated);
      setProfile(updated);
    },
    [profile],
  );

  const clearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  const toggleSavedId = useCallback(
    (id: string) => {
      if (!profile) return;
      const savedIds = profile.savedIds.includes(id)
        ? profile.savedIds.filter((sid) => sid !== id)
        : [id, ...profile.savedIds];
      const updated = { ...profile, savedIds, updatedAt: new Date().toISOString() };
      persistProfile(updated);
      setProfile(updated);
    },
    [profile],
  );

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PROFILE_KEY) {
        setProfile(e.newValue ? (JSON.parse(e.newValue) as OpportunityProfile) : null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    profile,
    hasProfile,
    createProfile,
    updateProfile,
    clearProfile,
    toggleSavedId,
    isSaved: (id: string) => profile?.savedIds.includes(id) ?? false,
  };
}
```

**Step 3: Verify build**

```bash
cd opportunities && npm run build
```
Expected: Build succeeds. New files are compiled but not yet used.

**Step 4: Commit**

```bash
git add opportunities/src/types/profile.ts opportunities/src/lib/profile.ts
git commit -m "feat: add opportunity profile types and localStorage hook

Defines OpportunityProfile type with techAreas, problemAreas, viewMode,
and savedIds. Includes migration logic from old saved-opportunities key.
Cross-tab sync via storage event listener."
```

---

## Task 3: Build the intake flow component

The 3-step guided onboarding that appears for first-time visitors.

**Files:**
- Create: `opportunities/src/components/IntakeFlow.tsx`

**Step 1: Create IntakeFlow component**

Create `opportunities/src/components/IntakeFlow.tsx`. This component renders three sequential screens:

1. Technology areas (chip multi-select)
2. Problem areas (chip multi-select)
3. Exploration mode (three cards, single-select)

Each screen has a progress indicator (3 dots) and a "Skip — show me everything" link.

Key implementation details:
- Tech area chips: `"AI / Machine Learning", "Autonomous Systems", "Biotechnology", "Command & Control", "Communications", "Counter-UAS", "Cybersecurity", "Directed Energy", "Electronic Warfare", "Hypersonics", "Intelligence & Surveillance", "Logistics & Supply Chain", "Manufacturing", "Materials & Composites", "Microelectronics", "Quantum", "Sensors", "Software & Data", "Space", "Unmanned Systems"`
- Problem area chips from Builders mission areas: `"Administration", "Command and Control", "Communications", "Cyber", "Force Protection", "Information", "Intel & Battlespace Awareness", "Joint Fires", "Logistics", "Maintenance", "Planning"`
- View mode cards: opportunity / stakeholder / mission with descriptions from design doc
- `onComplete(techAreas, problemAreas, viewMode)` callback prop
- `onSkip()` callback prop
- Styles follow C2UX design tokens (dark bg, Inter font, 2px radius, `--blue` accent)
- Step transitions via internal state (`step: 1 | 2 | 3`)
- Allow advancing with empty selections (user can skip specificity)
- Each step has "Back" button (except step 1) and "Next" / "Start exploring" button

```typescript
interface IntakeFlowProps {
  onComplete: (techAreas: string[], problemAreas: string[], viewMode: ViewMode) => void;
  onSkip: () => void;
}
```

Style the component using the same inline `<style>` pattern used by TabBar, OpportunityCard, etc. Use CSS classes prefixed with `intake-` to avoid collisions.

Layout:
- Centered container, max-width 640px
- MC logo/wordmark at top (optional, can be text: "Opportunities")
- Step title as h2
- Subtitle text explaining the step
- Chip grid (flex-wrap) or card grid (3-col on desktop, stack on mobile)
- Progress dots at bottom
- Skip link below progress dots

**Step 2: Verify build**

```bash
cd opportunities && npm run build
```
Expected: Build succeeds. Component is compiled but not yet rendered.

**Step 3: Commit**

```bash
git add opportunities/src/components/IntakeFlow.tsx
git commit -m "feat: add IntakeFlow component for guided onboarding

Three-step intake: technology areas, problem areas, exploration mode.
Chip multi-select for steps 1-2, card single-select for step 3.
Skip link on every step falls through to unfiltered list."
```

---

## Task 4: Build the profile bar component

The top bar showing active profile chips with quick-edit and clear.

**Files:**
- Create: `opportunities/src/components/ProfileBar.tsx`

**Step 1: Create ProfileBar component**

```typescript
interface ProfileBarProps {
  profile: OpportunityProfile;
  onEditPreferences: () => void;
  onClearProfile: () => void;
  onChangeViewMode: (mode: ViewMode) => void;
}
```

Layout:
- Horizontal bar below the page header, above the feed
- Left side: profile chips (tech areas as small blue-outlined chips, problem areas as small gray-outlined chips)
- If many chips, show first 4 + "+N more" that expands on click
- Right side: view mode toggle (3 small buttons: "Opportunities" / "Stakeholders" / "Missions"), active one highlighted
- Below or inline: "Edit preferences" link, "Clear profile" link (with subtle styling)
- Clicking any chip opens the edit preferences flow (same as intake but pre-filled)

Inline styles following existing component patterns.

**Step 2: Verify build**

```bash
cd opportunities && npm run build
```

**Step 3: Commit**

```bash
git add opportunities/src/components/ProfileBar.tsx
git commit -m "feat: add ProfileBar component for profile display and view mode toggle

Shows active profile as chips with edit/clear actions. Includes
view mode toggle for opportunity/stakeholder/mission views."
```

---

## Task 5: Redesign OpportunityCard with critical signals

Replace the current card layout with one that puts status, deadline, source, and value front and center.

**Files:**
- Modify: `opportunities/src/components/OpportunityCard.tsx` (full rewrite, 270 lines)
- Modify: `opportunities/src/types/opportunity.ts` (add `estimatedValue` helper)

**Step 1: Update OpportunityCard**

The new card layout (top to bottom):
1. **Header row:** Source badge (left), Save button (right)
2. **Title:** h3, 2-line clamp
3. **Description:** 2-line clamp, muted text
4. **Signal strip** (the key change — horizontal bar):
   - Status badge (color-coded: green=Open, blue=Pre-Release, orange=Closing Soon, gray=Closed)
   - Deadline: days remaining in bold if < 30 days, formatted date otherwise, "No deadline" if missing
   - Estimated value: "$50K–$275K" format if available, omitted if not
5. **Footer:** Component/agency tag, topic code (if human-readable)

Derive `closing-soon` status on the card: if `topicStatus` is "Open" and deadline exists and is within 14 days, override display to "Closing Soon" with orange styling.

Add a `profileMatchTags` optional prop: array of user's profile tags that match this opportunity. If present, show a small "N matches" indicator.

Card should be taller than current to fit signals without crowding. Keep click-to-select, save toggle, and keyboard accessibility.

**Step 2: Verify build**

```bash
cd opportunities && npm run build
```

**Step 3: Commit**

```bash
git add opportunities/src/components/OpportunityCard.tsx
git commit -m "feat: redesign OpportunityCard with prominent status/deadline signals

Four critical signals (status, deadline, source, value) now above the
fold. Closing-soon derived from deadline < 14 days. Profile match
indicator added."
```

---

## Task 6: Build grouped feed views (Stakeholder and Mission Area)

Add the two new view modes that group opportunities by agency or mission area.

**Files:**
- Create: `opportunities/src/components/GroupedFeed.tsx`

**Step 1: Create GroupedFeed component**

```typescript
interface GroupedFeedProps {
  opportunities: Opportunity[];
  groupBy: "component" | "problemArea";
  profile: OpportunityProfile;
  onSelectOpportunity: (opp: Opportunity) => void;
  onToggleSave: (opp: Opportunity) => void;
  isSaved: (id: string) => boolean;
}
```

This component:
- Groups opportunities by the `groupBy` field
  - `"component"` → groups by `opportunity.component` (stakeholder view)
  - `"problemArea"` → groups by matching `opportunity.technologyAreas` / `focusAreas` against user's `problemAreas` (mission area view). Opportunities that match multiple areas appear in each group.
- Renders a collapsible section per group:
  - Header: group name, count of open opportunities, collapse toggle (chevron)
  - Body: grid of OpportunityCards (same responsive grid as current list)
  - Within each group, sorted by deadline (soonest first, no-deadline last)
- Groups sorted by count (most opportunities first)
- All groups start expanded
- Uses same inline style pattern

**Step 2: Verify build**

```bash
cd opportunities && npm run build
```

**Step 3: Commit**

```bash
git add opportunities/src/components/GroupedFeed.tsx
git commit -m "feat: add GroupedFeed component for stakeholder and mission area views

Groups opportunities by component or problem area with collapsible
sections. Count badges and deadline sorting within groups."
```

---

## Task 7: Wire intake flow and profile into App.tsx

Connect the intake flow, profile bar, and feed views into the main app routing.

**Files:**
- Modify: `opportunities/src/App.tsx` (significant refactor of HomePage)

**Step 1: Add imports and profile hook**

In `App.tsx`, add imports:
```typescript
import IntakeFlow from "./components/IntakeFlow";
import ProfileBar from "./components/ProfileBar";
import GroupedFeed from "./components/GroupedFeed";
import { useProfile } from "./lib/profile";
import type { ViewMode } from "./types/profile";
```

**Step 2: Refactor HomePage to use profile**

In the HomePage component:
1. Call `useProfile()` to get profile state
2. Add `showIntake` state: `true` if `!hasProfile` and user hasn't skipped
3. Add `skipped` state for when user clicks "Skip"

Render logic:
```
if (showIntake && !skipped) → render IntakeFlow
else if (hasProfile) → render ProfileBar + personalized feed
else → render current OpportunityList (the fallback)
```

**Step 3: Wire up personalized feed rendering**

When profile exists, the "Solicitations" tab content changes based on `profile.viewMode`:
- `"opportunity"` → render OpportunityList (existing, but pass profile for relevance hints)
- `"stakeholder"` → render GroupedFeed with `groupBy="component"`
- `"mission"` → render GroupedFeed with `groupBy="problemArea"`

The Saved tab remains but uses profile's `savedIds` instead of the old hook.

**Step 4: Wire /sbir and /sttr routes**

For `/sbir` and `/sttr` routes, auto-create a profile with the program pre-set and skip intake:
- `/sbir` → create profile with a synthetic flag that pre-filters to SBIR source
- `/sttr` → same for STTR

**Step 5: Remove old saved-opportunities hook usage**

Replace `useSavedOpportunities()` calls with `useProfile()` equivalents:
- `isSaved(opp)` → `isSaved(opp.id)`
- `toggleSaved(opp)` → `toggleSavedId(opp.id)`
- `saved` array → filter full opportunities list by `profile.savedIds`
- `savedCount` → `profile.savedIds.length`

**Step 6: Verify build**

```bash
cd opportunities && npm run build
```

**Step 7: Test manually**

```bash
cd opportunities && npm run dev
```
Open http://localhost:5174/opportunities in browser:
- First visit: should see intake flow
- Complete intake: should see personalized feed with profile bar
- Click "Skip": should see full list (fallback)
- Clear localStorage, reload: intake should reappear

**Step 8: Commit**

```bash
git add opportunities/src/App.tsx
git commit -m "feat: wire intake flow and profile-aware feed into App

First-time visitors see guided intake. Return visitors see personalized
feed with profile bar. Skip falls back to unfiltered list. Saved
opportunities now use profile hook."
```

---

## Task 8: API enrichment — SBIR date and status fields

Fix the biggest data gap: SBIR opportunities missing dates and status in the API response.

**Files:**
- Modify: `cloudflare/opportunities-api/src/index.ts:511-518` (SBIR item mapping)

**Step 1: Map SBIR date and status fields**

In the SBIR result processing (around line 511-518), after setting `record.source` and `record.url`, also extract:

```typescript
content.forEach((item: unknown) => {
  const record = item as Record<string, unknown>;
  record.source = "sbir";
  const topicId = String(record.topicId ?? record.id ?? "");
  if (!record.url && topicId) {
    record.url = buildSbirDetailUrl(topicId);
  }
  // Extract dates that SBIR API provides but we weren't mapping
  if (!record.topicStatus && record.topicQAStatusDisplay) {
    record.topicStatus = record.topicQAStatusDisplay;
  }
  // topicStartDate and topicEndDate should flow through to normalizeOpportunity
  // on the frontend — just make sure they're present in the record.
  // The SBIR API returns these as timestamps.
});
```

**Step 2: Add estimated value inference for SBIR**

After the SBIR mapping, infer value from program type:

```typescript
// Infer estimated value for SBIR/STTR based on phase
if (!record.estimatedValue) {
  const program = String(record.program ?? record.solicitationType ?? "").toUpperCase();
  const phase = String(record.phase ?? record.topicPhase ?? "");
  if (program.includes("SBIR") || program.includes("STTR")) {
    if (phase.includes("1") || phase.toLowerCase().includes("i")) {
      record.estimatedValue = { min: 50000, max: 275000 };
    } else if (phase.includes("2") || phase.toLowerCase().includes("ii")) {
      record.estimatedValue = { min: 750000, max: 1750000 };
    }
  }
}
```

**Step 3: Verify build**

```bash
cd cloudflare/opportunities-api && npm run build 2>&1 || npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add cloudflare/opportunities-api/src/index.ts
git commit -m "fix: extract SBIR date, status, and estimated value fields

SBIR API returns topicStartDate, topicEndDate, and topicQAStatusDisplay
but we weren't mapping them through. Also infers estimated value from
SBIR/STTR phase (Phase I: $50K-$275K, Phase II: $750K-$1.75M)."
```

---

## Task 9: API enrichment — Status normalization across all sources

Normalize the `topicStatus` field to a canonical enum at the API layer.

**Files:**
- Modify: `cloudflare/opportunities-api/src/index.ts` (add normalizeStatus function, apply to all sources)

**Step 1: Add status normalization function**

Add near the top of `index.ts` (after the dedup utilities, around line 100):

```typescript
type CanonicalStatus = "open" | "closing-soon" | "pre-release" | "closed";

function normalizeStatus(rawStatus: string | undefined, endDateTs: number | undefined): CanonicalStatus {
  const status = (rawStatus ?? "").toLowerCase().trim();

  // Check for explicit closed signals
  if (status.includes("closed") || status.includes("archived") || status === "no") {
    return "closed";
  }

  // Check for pre-release signals
  if (status.includes("pre-release") || status.includes("upcoming") || status.includes("forecast")) {
    return "pre-release";
  }

  // If we have an end date, derive status from it
  if (endDateTs) {
    const now = Date.now();
    const endMs = endDateTs > 1_000_000_000_000 ? endDateTs : endDateTs * 1000;
    if (endMs < now) return "closed";
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    if (endMs - now < fourteenDays) return "closing-soon";
  }

  return "open";
}
```

**Step 2: Apply to each source's output**

After each source aggregates its items, apply `normalizeStatus` to set `topicStatus`:

- **SBIR** (after line ~518): `record.topicStatus = normalizeStatus(String(record.topicStatus ?? record.topicQAStatusDisplay ?? ""), Number(record.topicEndDate) || undefined);`
- **DARPA** (in the RSS parsing, replace hardcoded "Open"): `topicStatus: normalizeStatus(undefined, undefined)` — will default to "open" since we have no date
- **DIU** (replace the manual open/closed logic): Use `normalizeStatus(undefined, endDateTs)` where `endDateTs` is the parsed deadline
- **GoColosseum** (replace hardcoded "Open"): `normalizeStatus(undefined, undefined)`
- **Ratio** (replace badge regex): `normalizeStatus(badgeText, undefined)` where `badgeText` is the extracted status
- **SAM.gov** (replace active=Yes logic): `normalizeStatus(active === "Yes" ? "open" : "closed", responseDeadlineTs)`

**Step 3: Verify build**

```bash
cd cloudflare/opportunities-api && npm run build 2>&1 || npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add cloudflare/opportunities-api/src/index.ts
git commit -m "feat: normalize opportunity status to canonical enum across all sources

Adds normalizeStatus() that maps raw status strings and end dates to
open/closing-soon/pre-release/closed. Applied to all 6 sources,
replacing hardcoded values and inconsistent logic."
```

---

## Task 10: Redesign the detail modal

Update the OpportunityModal in App.tsx to match the new design with status strip at top and collapsible phases.

**Files:**
- Modify: `opportunities/src/App.tsx` (the OpportunityModal section, approximately lines 100-300)

**Step 1: Rewrite the modal layout**

Replace the current 2x2 metadata grid with the new layout:

1. **Header:** Title (large), source badge + topic code, component/agency
2. **Status strip:** Horizontal bar with status badge (color-coded), deadline (urgency if < 14 days), posted date, estimated value
3. **Description:** Full text with RichTextBlock
4. **Objective:** If available, distinct block
5. **Phase breakdown:** Collapsible `<details>` elements for Phase I, II, III — collapsed by default
6. **Tags:** Tech areas, focus areas, keywords as chips. If user has profile, matching tags get a subtle blue border highlight
7. **Footer:** "View on [source]", Save, Email, Get alerts (links to Guild), Get matched (links to `/access`)

Status strip colors:
- `open` → `--mc-success` (#22c55e)
- `closing-soon` → `--mc-warning` (#f59e0b)
- `pre-release` → `--mc-accent` (#3b82f6)
- `closed` → `--gray-medium` (#737373)

Deadline display:
- If < 30 days and > 0: show "X days left" in bold with urgency color
- If date exists but > 30 days: show formatted date
- If no date: show "No deadline listed" in muted text

**Step 2: Update the detail page (OpportunityDetailPage)**

Apply the same layout changes to the standalone detail page at the bottom of App.tsx. Same status strip, collapsible phases, tag highlighting.

**Step 3: Verify build**

```bash
cd opportunities && npm run build
```

**Step 4: Test manually**

```bash
cd opportunities && npm run dev
```
Click an opportunity card — modal should show new layout with status strip at top.

**Step 5: Commit**

```bash
git add opportunities/src/App.tsx
git commit -m "feat: redesign opportunity detail modal and page with status strip

Status/deadline/value strip at top of modal and detail page. Phases
are collapsible (collapsed by default). Tags matching user profile
get subtle highlight."
```

---

## Task 11: Update OpportunityList for personalized feed

Modify the list component to support profile-aware filtering and infinite scroll.

**Files:**
- Modify: `opportunities/src/components/OpportunityList.tsx`

**Step 1: Add profile-aware props**

Add optional profile prop:
```typescript
interface OpportunityListProps {
  mode: "all" | "sbir" | "sttr";
  onSelectOpportunity: (opp: Opportunity) => void;
  profile?: OpportunityProfile | null;
  onToggleSave: (opp: Opportunity) => void;
  isSaved: (id: string) => boolean;
}
```

**Step 2: Add relevance sorting**

When profile exists and sort is "relevance" (new default when profile present):
- Score each opportunity by overlap between its `technologyAreas`/`focusAreas`/`keywords` and the profile's `techAreas` + `problemAreas`
- Sort by score descending, then by deadline ascending as tiebreaker
- This is client-side sorting on the already-fetched results

**Step 3: Replace pagination with "Load more"**

Replace prev/next pagination with a "Load more" button:
- Initial load: 25 items
- Each "Load more" fetches next page and appends to existing list
- Show "Showing X of Y" count
- When all loaded, hide the button

**Step 4: Pass profile match info to cards**

For each card, compute which profile tags match and pass as prop so the card can show a match indicator.

**Step 5: Verify build**

```bash
cd opportunities && npm run build
```

**Step 6: Commit**

```bash
git add opportunities/src/components/OpportunityList.tsx
git commit -m "feat: add profile-aware relevance sorting and load-more to OpportunityList

When profile exists, default sort is relevance (tag overlap scoring).
Pagination replaced with 'Load more' button. Profile match info
passed to cards."
```

---

## Task 12: Redirect static opportunities.html

**Files:**
- Modify: `opportunities.html` (root-level static fallback page)

**Step 1: Replace content with redirect**

Replace the full HTML content of `opportunities.html` with a simple redirect:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/opportunities">
  <link rel="canonical" href="https://mergecombinator.com/opportunities">
  <title>Redirecting to Opportunities</title>
</head>
<body>
  <p>Redirecting to <a href="/opportunities">Opportunities</a>...</p>
</body>
</html>
```

**Step 2: Commit**

```bash
git add opportunities.html
git commit -m "fix: redirect static opportunities.html to /opportunities app

The static fallback page is no longer needed — the React app handles
all entry points including intake flow."
```

---

## Task 13: Build and verify end-to-end

**Files:** None (verification only)

**Step 1: Full build**

```bash
cd /path/to/worktree && npm run build
```
Expected: Clean build with no errors.

**Step 2: Run dev server and test flows**

```bash
npm run dev
```

Test matrix:
1. **Fresh visit** (clear localStorage) → Intake flow appears
2. **Complete intake** → Personalized feed with profile bar
3. **Switch view modes** → Opportunity/Stakeholder/Mission views render correctly
4. **Skip intake** → Full unfiltered list (fallback)
5. **Save an opportunity** → Save persists in profile, appears in Saved view
6. **Click opportunity** → Modal opens with new status strip layout
7. **Visit /opportunities/sbir** → Profile pre-set with SBIR, feed loads
8. **Return visit** (profile in localStorage) → Skip intake, go to feed
9. **Edit preferences** → Intake flow with pre-filled selections
10. **Clear profile** → Returns to intake flow
11. **Check /opportunities.html** → Redirects to /opportunities

**Step 3: Verify API data quality**

In browser devtools Network tab, check a few opportunity responses:
- SBIR items should have `closeDate` / `topicEndDate` populated
- All items should have canonical `topicStatus` (open/closing-soon/pre-release/closed)
- SBIR items should have `estimatedValue` with min/max

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address integration issues from end-to-end testing"
```

---

## Task Summary

| # | Task | Scope | Est. Complexity |
|---|------|-------|-----------------|
| 1 | Archive Events/Radar tabs | Cleanup | Low |
| 2 | Profile types + hook | Data layer | Low |
| 3 | Intake flow component | New UI | Medium |
| 4 | Profile bar component | New UI | Low |
| 5 | Redesign OpportunityCard | UI rewrite | Medium |
| 6 | Grouped feed views | New UI | Medium |
| 7 | Wire everything into App.tsx | Integration | High |
| 8 | API: SBIR dates/status/value | Backend fix | Low |
| 9 | API: Status normalization | Backend fix | Medium |
| 10 | Redesign detail modal | UI rewrite | Medium |
| 11 | Profile-aware list + load more | UI enhancement | Medium |
| 12 | Redirect static page | Cleanup | Low |
| 13 | End-to-end verification | Testing | Low |

**Dependencies:** Tasks 1-6 are independent and can be parallelized. Task 7 depends on 1-6. Tasks 8-9 are independent of frontend work. Task 10-11 depend on 7. Task 12 is independent. Task 13 depends on all.
