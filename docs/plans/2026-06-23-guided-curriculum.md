# Guided Curriculum Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a progressive, trust-earning curriculum experience that diagnoses founder stage, guides them through personalized content, and converts them to advisory partnerships via non-invasive CTAs.

**Architecture:** 
- New React SPA at `/curriculum` (mirrors opportunities structure)
- Curriculum definition stored as JSON at `/data/curriculum.json`
- Event tracking via CF Worker endpoint `/api/curriculum/events`
- Founder progress persisted in Guild (Supabase) or localStorage (non-logged-in)
- Admin metrics dashboard in Guild at `/admin/curriculum-metrics`
- Linear path with preview + "skip ahead" logic (enabled after ≥2 resources engaged + reasoning capture)

**Tech Stack:** React 18, TypeScript, Vite, Hono (CF Worker), Supabase (progress storage), localStorage (non-logged-in fallback)

---

## Phase 1: Foundation & Data

### Task 1: Create curriculum JSON data structure

**Files:**
- Create: `/data/curriculum.json`

**Step 1: Write curriculum.json with all 5 stages and resources**

```json
{
  "stages": [
    {
      "id": "preflight",
      "number": 1,
      "title": "Preflight",
      "subtitle": "Prepare to succeed.",
      "description": "Before anything else, learn how the system works. Who buys, how they buy, and where the money flows. This stage builds the mental model that keeps everything else from being wasted motion.",
      "resources": [
        {
          "id": "contracting-cone",
          "type": "external",
          "title": "Contracting Cone",
          "description": "Visual guide to contract types and dollar thresholds — DAU",
          "url": "https://www.dau.edu/tools/t/Contracting-Cone",
          "timeToRead": 15,
          "order": 1,
          "sourceLabel": "DAU"
        },
        {
          "id": "far-startups",
          "type": "external",
          "title": "FAR for Startups",
          "description": "Federal Acquisition Regulation — the rules governing DoD procurement",
          "url": "https://www.acquisition.gov/browse/index/far",
          "timeToRead": 25,
          "order": 2,
          "sourceLabel": "Acquisition.gov"
        },
        {
          "id": "contract-types-explained",
          "type": "external",
          "title": "Contract Types Explained",
          "description": "FFP, T&M, CPFF, CPIF — when to use each and what they mean",
          "url": "https://www.dau.edu/tools/t/Contract-Type-Comparison",
          "timeToRead": 20,
          "order": 3,
          "sourceLabel": "DAU"
        },
        {
          "id": "ppbe-overview",
          "type": "external",
          "title": "Understanding PPBE",
          "description": "Planning, Programming, Budgeting, and Execution cycle",
          "url": "https://acqnotes.com/acqnote/acquisitions/ppbe-overview",
          "timeToRead": 15,
          "order": 4,
          "sourceLabel": "AcqNotes"
        },
        {
          "id": "signals-feed",
          "type": "signal",
          "title": "Signals Feed",
          "description": "Live intel from Breaking Defense, ExecutiveGov, and Merge Combinator analysis",
          "internalLink": "/signals",
          "timeToRead": 5,
          "order": 5
        },
        {
          "id": "ecosystem-map",
          "type": "gated",
          "title": "Defense Ecosystem Map",
          "description": "Interactive map of commands, agencies, and innovation units",
          "gateType": "guild",
          "gateName": "Guild — Free",
          "timeToRead": 30,
          "order": 6
        }
      ]
    },
    {
      "id": "spot",
      "number": 2,
      "title": "Spot",
      "subtitle": "Where you are and what's next.",
      "description": "Identify the mission problem you solve and the acquisition pathway that fits. Match your technology to active demand signals — SBIR topics, CSOs, OTAs, or direct engagement with problem sponsors.",
      "resources": [
        {
          "id": "problem-sponsor",
          "type": "external",
          "title": "Finding Problem Sponsors",
          "description": "DAU guide to identifying and engaging problem sponsors in DoD",
          "url": "https://www.dau.edu/tools/t/Problem-Sponsor",
          "timeToRead": 20,
          "order": 1,
          "sourceLabel": "DAU"
        },
        {
          "id": "afwerx-pathways",
          "type": "external",
          "title": "AFWERX Engagement Pathways",
          "description": "Air Force innovation pathways: Spark, Prime, and Ventures",
          "url": "https://afwerx.com/divisions/",
          "timeToRead": 15,
          "order": 2,
          "sourceLabel": "AFWERX"
        },
        {
          "id": "diu-cso",
          "type": "external",
          "title": "DIU Commercial Solutions Opening",
          "description": "How to engage Defense Innovation Unit through CSO process",
          "url": "https://www.diu.mil/work-with-us",
          "timeToRead": 15,
          "order": 3,
          "sourceLabel": "DIU"
        },
        {
          "id": "ota-guide",
          "type": "external",
          "title": "Other Transaction Authority Guide",
          "description": "OTA vs traditional FAR-based contracts — DAU",
          "url": "https://aaf.dau.edu/aaf/ota/",
          "timeToRead": 20,
          "order": 4,
          "sourceLabel": "DAU"
        },
        {
          "id": "opportunities-board",
          "type": "signal",
          "title": "Opportunities Board",
          "description": "Live solicitations from SBIR, DARPA, DIU, SAM.gov, and more",
          "internalLink": "/opportunities",
          "timeToRead": 5,
          "order": 5
        },
        {
          "id": "sbir-topics",
          "type": "external",
          "title": "SBIR Topic Search",
          "description": "Find open SBIR/STTR topics across all federal agencies",
          "url": "https://www.sbir.gov/topics",
          "timeToRead": 15,
          "order": 6,
          "sourceLabel": "SBIR.gov"
        },
        {
          "id": "pricing-strategies",
          "type": "gated",
          "title": "Pricing Strategies for Government Contracts",
          "description": "How to structure pricing for FFP, T&M, and CPFF contracts",
          "gateType": "builders",
          "gateName": "Defense Builders",
          "timeToRead": 25,
          "order": 7
        }
      ]
    },
    {
      "id": "ready",
      "number": 3,
      "title": "Ready for Launch",
      "subtitle": "Get connected.",
      "description": "Land your first contract vehicle. Get compliant, write proposals that win, and connect your solution to the acquisition system. This is where most startups stall — the bureaucratic interface between innovation and procurement.",
      "resources": [
        {
          "id": "phase-1-guide",
          "type": "external",
          "title": "Phase I Proposal Guide",
          "description": "SBIR.gov official tutorial on writing winning proposals",
          "url": "https://www.sbir.gov/tutorials/preparing-proposals/tutorial-1",
          "timeToRead": 30,
          "order": 1,
          "sourceLabel": "SBIR.gov"
        },
        {
          "id": "cmmc-2-0",
          "type": "external",
          "title": "CMMC 2.0 Requirements",
          "description": "Official DoD CMMC program overview and maturity levels",
          "url": "https://dodcio.defense.gov/CMMC/",
          "timeToRead": 25,
          "order": 2,
          "sourceLabel": "DoD CIO"
        },
        {
          "id": "itar-basics",
          "type": "external",
          "title": "ITAR Basics for Startups",
          "description": "State Department ITAR portal — registration and compliance basics",
          "url": "https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_itar_landing",
          "timeToRead": 20,
          "order": 3,
          "sourceLabel": "State Dept"
        },
        {
          "id": "cui-handbook",
          "type": "external",
          "title": "CUI Marking Handbook",
          "description": "NARA guide to marking and handling Controlled Unclassified Information",
          "url": "https://www.archives.gov/files/cui/documents/20161206-cui-marking-handbook-v1-1-20190524.pdf",
          "timeToRead": 20,
          "order": 4,
          "sourceLabel": "NARA"
        },
        {
          "id": "security-clearance",
          "type": "external",
          "title": "Security Clearance Process",
          "description": "DCSA FAQ on obtaining and maintaining clearances",
          "url": "https://www.dcsa.mil/is/security-clearance-faqs/",
          "timeToRead": 15,
          "order": 5,
          "sourceLabel": "DCSA"
        },
        {
          "id": "proposal-playbook",
          "type": "gated",
          "title": "Proposal Writing Playbook",
          "description": "Merge Combinator framework for structuring winning SBIR/OTA proposals",
          "gateType": "builders",
          "gateName": "Defense Builders",
          "timeToRead": 45,
          "order": 6
        }
      ]
    },
    {
      "id": "tension",
      "number": 4,
      "title": "Tension",
      "subtitle": "Build to full power.",
      "description": "You won a contract and built the prototype. Now the tension builds to production and scale. Build the relationships, evidence, and end user demand that launches you over the valley of death.",
      "resources": [
        {
          "id": "valley-of-death",
          "type": "learn",
          "title": "Valley of Death Survival Guide",
          "description": "John Ferry — 351 pages, read online. The foundational playbook for crossing the valley.",
          "internalLink": "/learn/read?src=/content/web_small.pdf",
          "timeToRead": 180,
          "order": 1
        },
        {
          "id": "don-phase-3",
          "type": "external",
          "title": "DON Phase III Guidebook",
          "description": "Navy SBIR/STTR guide to transitioning funded work into production contracts",
          "url": "https://www.navysbir.com/docs/DON-SBIR_STTR_Phase-III_Guidebook_V2-2020.pdf",
          "timeToRead": 40,
          "order": 2,
          "sourceLabel": "Navy SBIR"
        },
        {
          "id": "interceptor-analysis",
          "type": "signal",
          "title": "The Interceptor Math Is Broken",
          "description": "Merge Combinator Analysis — why affordable mass matters for your production story",
          "internalLink": "/signals/interceptor-stockpile-crisis",
          "timeToRead": 8,
          "order": 3
        },
        {
          "id": "valley-navigator",
          "type": "gated",
          "title": "Valley of Death Navigator",
          "description": "Interactive decision framework for prototype-to-production transitions",
          "gateType": "builders",
          "gateName": "Defense Builders",
          "timeToRead": 60,
          "order": 4
        },
        {
          "id": "operator-validation",
          "type": "gated",
          "title": "Operator Validation Toolkit",
          "description": "Templates and frameworks for building warfighter evidence",
          "gateType": "guild",
          "gateName": "Guild — Free",
          "timeToRead": 45,
          "order": 5
        }
      ]
    },
    {
      "id": "launch",
      "number": 5,
      "title": "Launch",
      "subtitle": "Go operational.",
      "description": "Production contracts, follow-on awards, colors of money, B2B partnerships, and lifecycle optimization. You're building the team and the right team members change everything.",
      "resources": [
        {
          "id": "ulysses-case-study",
          "type": "signal",
          "title": "From Combine to Series A: Ulysses",
          "description": "Merge Combinator Case Study — what operator-validated formation actually produces",
          "internalLink": "/signals/ulysses-combine-to-series-a",
          "timeToRead": 10,
          "order": 1
        },
        {
          "id": "vc-alignment-problem",
          "type": "signal",
          "title": "The $16B Alignment Problem",
          "description": "Merge Combinator Analysis — whether the system can absorb the capital flowing in",
          "internalLink": "/signals/vc-defense-alignment-problem",
          "timeToRead": 10,
          "order": 2
        },
        {
          "id": "army-acquisition",
          "type": "signal",
          "title": "The Army Is Rewriting How It Buys Technology",
          "description": "Merge Combinator Analysis — acquisition restructured around software velocity",
          "internalLink": "/signals/army-rewriting-acquisition",
          "timeToRead": 10,
          "order": 3
        },
        {
          "id": "production-playbook",
          "type": "gated",
          "title": "Production Contract Playbook",
          "description": "Strategies for follow-on, sole-source justification, and teaming",
          "gateType": "builders",
          "gateName": "Defense Builders",
          "timeToRead": 40,
          "order": 4
        },
        {
          "id": "prime-teaming",
          "type": "gated",
          "title": "Prime Teaming & Subcontractor Strategy",
          "description": "How to structure partnerships that scale",
          "gateType": "builders",
          "gateName": "Defense Builders",
          "timeToRead": 35,
          "order": 5
        }
      ]
    }
  ]
}
```

**Step 2: Verify JSON is valid**

Run: `node -e "const d = require('./data/curriculum.json'); console.log('Valid. Stages:', d.stages.length, 'Total resources:', d.stages.reduce((sum, s) => sum + s.resources.length, 0))"`

Expected: `Valid. Stages: 5 Total resources: 31`

**Step 3: Commit**

```bash
git add data/curriculum.json
git commit -m "data: add curriculum structure with 5 stages and 31 resources"
```

---

### Task 2: Create event schema and Supabase table

**Files:**
- Create: `/cloudflare/api-worker/src/types/curriculum.ts`
- Modify: `/cloudflare/api-worker/src/repos/curriculum.ts` (new file)

**Step 1: Define TypeScript event types**

```typescript
// /cloudflare/api-worker/src/types/curriculum.ts

export interface CurriculumEvent {
  id?: string;
  event: 'triage_complete' | 'curriculum_view' | 'content_click' | 'content_engaged' | 'content_saved' | 'signup_prompt_shown' | 'signup_click' | 'advance_request' | 'advisory_prompt_shown' | 'advisory_click' | 'curriculum_return';
  resourceId?: string;
  resourceType?: 'knowledge' | 'learn' | 'signal' | 'external' | 'gated';
  stage?: string;
  fromStage?: string;
  toStage?: string;
  reason?: string;
  funderId?: string;
  sessionId: string;
  timeSpent?: number;
  timestamp: string;
  createdAt?: string;
}

export interface UserCurriculumProgress {
  funderId: string;
  currentStage: string;
  engagedResources: string[];
  completedResources: string[];
  savedResources: string[];
  triageResponses: {
    stage: string;
    brings: string[];
    constraints: string[];
    company: string;
  };
  advanceRequests: Array<{
    from: string;
    to: string;
    reason?: string;
    timestamp: string;
    allowed: boolean;
  }>;
  lastVisited: string;
}
```

**Step 2: Create Supabase migration**

```bash
# Create SQL file for migration
cat > /tmp/curriculum_schema.sql << 'EOF'
-- Curriculum events table
CREATE TABLE curriculum_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  resource_id TEXT,
  resource_type TEXT,
  stage TEXT,
  from_stage TEXT,
  to_stage TEXT,
  reason TEXT,
  founder_id TEXT,
  session_id TEXT NOT NULL,
  time_spent INTEGER,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_event CHECK (event IN ('triage_complete', 'curriculum_view', 'content_click', 'content_engaged', 'content_saved', 'signup_prompt_shown', 'signup_click', 'advance_request', 'advisory_prompt_shown', 'advisory_click', 'curriculum_return'))
);

CREATE INDEX idx_curriculum_events_founder_id ON curriculum_events(founder_id);
CREATE INDEX idx_curriculum_events_stage ON curriculum_events(stage);
CREATE INDEX idx_curriculum_events_event ON curriculum_events(event);
CREATE INDEX idx_curriculum_events_timestamp ON curriculum_events(timestamp);

-- User curriculum progress table
CREATE TABLE curriculum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id TEXT NOT NULL UNIQUE,
  current_stage TEXT NOT NULL DEFAULT 'preflight',
  engaged_resources JSONB DEFAULT '[]'::jsonb,
  completed_resources JSONB DEFAULT '[]'::jsonb,
  saved_resources JSONB DEFAULT '[]'::jsonb,
  triage_responses JSONB,
  advance_requests JSONB DEFAULT '[]'::jsonb,
  last_visited TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_stage CHECK (current_stage IN ('preflight', 'spot', 'ready', 'tension', 'launch'))
);

CREATE INDEX idx_curriculum_progress_founder ON curriculum_progress(founder_id);
EOF

echo "SQL schema saved to /tmp/curriculum_schema.sql — run in Supabase SQL Editor"
```

**Step 3: Create repository functions**

```typescript
// /cloudflare/api-worker/src/repos/curriculum.ts

import { Database } from '@/types';
import { CurriculumEvent, UserCurriculumProgress } from '@/types/curriculum';

export async function logCurriculumEvent(db: Database, event: CurriculumEvent): Promise<void> {
  await db
    .from('curriculum_events')
    .insert({
      event: event.event,
      resource_id: event.resourceId,
      resource_type: event.resourceType,
      stage: event.stage,
      from_stage: event.fromStage,
      to_stage: event.toStage,
      reason: event.reason,
      founder_id: event.funderId,
      session_id: event.sessionId,
      time_spent: event.timeSpent,
      timestamp: event.timestamp,
    });
}

export async function getUserProgress(db: Database, funderId: string): Promise<UserCurriculumProgress | null> {
  const { data } = await db
    .from('curriculum_progress')
    .select('*')
    .eq('founder_id', funderId)
    .single();

  if (!data) return null;

  return {
    funderId: data.founder_id,
    currentStage: data.current_stage,
    engagedResources: data.engaged_resources || [],
    completedResources: data.completed_resources || [],
    savedResources: data.saved_resources || [],
    triageResponses: data.triage_responses,
    advanceRequests: data.advance_requests || [],
    lastVisited: data.last_visited,
  };
}

export async function updateUserProgress(db: Database, funderId: string, updates: Partial<UserCurriculumProgress>): Promise<UserCurriculumProgress> {
  const { data } = await db
    .from('curriculum_progress')
    .upsert({
      founder_id: funderId,
      current_stage: updates.currentStage,
      engaged_resources: updates.engagedResources,
      completed_resources: updates.completedResources,
      saved_resources: updates.savedResources,
      triage_responses: updates.triageResponses,
      advance_requests: updates.advanceRequests,
      last_visited: updates.lastVisited,
    })
    .eq('founder_id', funderId)
    .select()
    .single();

  return {
    funderId: data.founder_id,
    currentStage: data.current_stage,
    engagedResources: data.engaged_resources || [],
    completedResources: data.completed_resources || [],
    savedResources: data.saved_resources || [],
    triageResponses: data.triage_responses,
    advanceRequests: data.advance_requests || [],
    lastVisited: data.last_visited,
  };
}
```

**Step 4: Commit**

```bash
git add cloudflare/api-worker/src/types/curriculum.ts cloudflare/api-worker/src/repos/curriculum.ts
git commit -m "feat: add curriculum event schema and Supabase types"
```

---

## Phase 2: CF Worker API Routes

### Task 3: Create curriculum event tracking endpoint

**Files:**
- Create: `/cloudflare/api-worker/src/routes/curriculum.ts`
- Modify: `/cloudflare/api-worker/src/index.ts` (register route)

**Step 1: Create curriculum routes**

```typescript
// /cloudflare/api-worker/src/routes/curriculum.ts

import { Hono } from 'hono';
import { getAuth } from 'hono/cloudflare-jwt';
import type { Database } from '@/types';
import { logCurriculumEvent, getUserProgress, updateUserProgress } from '@/repos/curriculum';
import { CurriculumEvent } from '@/types/curriculum';

export function curriculumRoutes(router: Hono) {
  // POST /api/curriculum/events — log tracking event
  router.post('/curriculum/events', async (c) => {
    const db = c.get('db') as Database;
    const event = await c.req.json<CurriculumEvent>();

    if (!event.event || !event.sessionId || !event.timestamp) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
      await logCurriculumEvent(db, event);
      return c.json({ ok: true }, 200);
    } catch (err) {
      console.error('Error logging curriculum event:', err);
      return c.json({ error: 'Failed to log event' }, 500);
    }
  });

  // GET /api/curriculum/user-progress — get founder progress (Guild auth)
  router.get('/curriculum/user-progress', async (c) => {
    const db = c.get('db') as Database;
    const auth = getAuth(c);

    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const funderId = auth.sub; // From Guild JWT
    const progress = await getUserProgress(db, funderId);

    if (!progress) {
      return c.json({
        funderId,
        currentStage: 'preflight',
        engagedResources: [],
        completedResources: [],
        savedResources: [],
        triageResponses: {},
        advanceRequests: [],
        lastVisited: new Date().toISOString(),
      });
    }

    return c.json(progress, 200);
  });

  // POST /api/curriculum/advance-request — handle "skip ahead" logic
  router.post('/curriculum/advance-request', async (c) => {
    const db = c.get('db') as Database;
    const auth = getAuth(c);

    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const funderId = auth.sub;
    const { fromStage, toStage, reason } = await c.req.json<{
      fromStage: string;
      toStage: string;
      reason: string;
    }>();

    // Log the advance request as an event
    await logCurriculumEvent(db, {
      event: 'advance_request',
      fromStage,
      toStage,
      reason,
      funderId,
      sessionId: 'api',
      timestamp: new Date().toISOString(),
    });

    // Update progress to new stage
    const progress = await getUserProgress(db, funderId);
    if (progress) {
      await updateUserProgress(db, funderId, {
        ...progress,
        currentStage: toStage,
        advanceRequests: [
          ...progress.advanceRequests,
          { from: fromStage, to: toStage, reason, timestamp: new Date().toISOString(), allowed: true },
        ],
      });
    }

    return c.json({ ok: true, stage: toStage }, 200);
  });

  // GET /api/curriculum/metrics — admin-only funnel data
  router.get('/curriculum/metrics', async (c) => {
    const db = c.get('db') as Database;
    const adminToken = c.req.header('X-Admin-Token');

    if (adminToken !== c.env.ADMIN_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: allEvents } = await db.from('curriculum_events').select('*');

    const metrics = {
      triageCompletes: allEvents?.filter((e) => e.event === 'triage_complete').length || 0,
      curriculumViews: allEvents?.filter((e) => e.event === 'curriculum_view').length || 0,
      contentClicks: allEvents?.filter((e) => e.event === 'content_click').length || 0,
      contentEngaged: allEvents?.filter((e) => e.event === 'content_engaged').length || 0,
      signupPrompts: allEvents?.filter((e) => e.event === 'signup_prompt_shown').length || 0,
      signupClicks: allEvents?.filter((e) => e.event === 'signup_click').length || 0,
      advisoryClicks: allEvents?.filter((e) => e.event === 'advisory_click').length || 0,
      advanceRequests: allEvents?.filter((e) => e.event === 'advance_request').length || 0,
      stageDistribution: {
        preflight: allEvents?.filter((e) => e.stage === 'preflight').length || 0,
        spot: allEvents?.filter((e) => e.stage === 'spot').length || 0,
        ready: allEvents?.filter((e) => e.stage === 'ready').length || 0,
        tension: allEvents?.filter((e) => e.stage === 'tension').length || 0,
        launch: allEvents?.filter((e) => e.stage === 'launch').length || 0,
      },
      topResources: allEvents
        ?.filter((e) => e.event === 'content_click')
        .reduce(
          (acc: Record<string, number>, e) => {
            acc[e.resource_id!] = (acc[e.resource_id!] || 0) + 1;
            return acc;
          },
          {}
        )
        .sort((a: number, b: number) => b - a)
        .slice(0, 10),
    };

    return c.json(metrics, 200);
  });
}
```

**Step 2: Register route in index.ts**

```typescript
// Modify /cloudflare/api-worker/src/index.ts

import { curriculumRoutes } from './routes/curriculum';

// ... existing code ...

const router = new Hono();

// ... existing routes ...

curriculumRoutes(router);

export default router;
```

**Step 3: Commit**

```bash
git add cloudflare/api-worker/src/routes/curriculum.ts
git commit -m "feat: add curriculum event tracking and metrics endpoints"
```

---

## Phase 3: React SPA Structure

### Task 4: Scaffold curriculum SPA (copy from opportunities pattern)

**Files:**
- Create: `/curriculum/` (new directory)
- Copy from: `/opportunities/`

**Step 1: Create curriculum directory and copy base structure**

```bash
mkdir -p /curriculum
cp -r /opportunities/index.html /curriculum/
cp -r /opportunities/tsconfig.json /curriculum/
cp -r /opportunities/package.json /curriculum/
cp -r /opportunities/src /curriculum/
```

**Step 2: Update curriculum/package.json**

```json
{
  "name": "mc-curriculum",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "typescript": "^5.6.3",
    "vite": "^6.4.1"
  }
}
```

**Step 3: Update curriculum/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/curriculum/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.API_BASE || "http://localhost:8787",
        changeOrigin: true,
      },
      "/styles.css": { target: "http://localhost:3000", changeOrigin: true },
      "/styles/": { target: "http://localhost:3000", changeOrigin: true },
      "/js/": { target: "http://localhost:3000", changeOrigin: true },
      "/data/": { target: "http://localhost:3000", changeOrigin: true },
      "/assets/": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
```

**Step 4: Update curriculum/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Curriculum — Merge Combinator</title>
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="/styles/light-theme.css">
    <style>body{opacity:0;background:#0a0a0a}body.page-ready{opacity:1;transition:opacity .15s ease-in}</style>
  </head>
  <body class="curriculum-page">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script type="module" src="/js/navbar.js"></script>
  </body>
</html>
```

**Step 5: Commit**

```bash
git add curriculum/
git commit -m "scaffold: create curriculum SPA from opportunities template"
```

---

### Task 5: Build core curriculum components

**Files:**
- Create: `/curriculum/src/components/CurriculumPage.tsx`
- Create: `/curriculum/src/components/StageView.tsx`
- Create: `/curriculum/src/components/ProgressBar.tsx`
- Create: `/curriculum/src/components/AdvanceDialog.tsx`
- Create: `/curriculum/src/hooks/useCurriculum.ts`
- Create: `/curriculum/src/hooks/useProgress.ts`
- Create: `/curriculum/src/lib/events.ts`

**Step 1: Create useCurriculum hook**

```typescript
// /curriculum/src/hooks/useCurriculum.ts

import { useEffect, useState } from 'react';

export interface Resource {
  id: string;
  type: 'external' | 'knowledge' | 'learn' | 'signal' | 'gated';
  title: string;
  description: string;
  url?: string;
  internalLink?: string;
  timeToRead: number;
  order: number;
  sourceLabel?: string;
  gateType?: string;
  gateName?: string;
}

export interface Stage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  resources: Resource[];
}

export interface CurriculumData {
  stages: Stage[];
}

export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/curriculum.json')
      .then((r) => r.json())
      .then(setCurriculum)
      .catch((e) => console.error('Failed to load curriculum:', e))
      .finally(() => setLoading(false));
  }, []);

  return { curriculum, loading };
}
```

**Step 2: Create useProgress hook**

```typescript
// /curriculum/src/hooks/useProgress.ts

import { useEffect, useState } from 'react';

export interface UserProgress {
  funderId?: string;
  currentStage: string;
  engagedResources: string[];
  completedResources: string[];
  savedResources: string[];
  triageResponses: {
    stage: string;
    brings: string[];
    constraints: string[];
    company: string;
  };
  advanceRequests: Array<{
    from: string;
    to: string;
    reason?: string;
    timestamp: string;
    allowed: boolean;
  }>;
  lastVisited: string;
}

export function useProgress(funderId?: string) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (funderId) {
      fetch('/api/curriculum/user-progress')
        .then((r) => r.json())
        .then(setProgress)
        .catch((e) => console.error('Failed to load progress:', e))
        .finally(() => setLoading(false));
    } else {
      // Load from localStorage
      const stored = localStorage.getItem('mc-curriculum-progress');
      setProgress(
        stored
          ? JSON.parse(stored)
          : {
              currentStage: 'preflight',
              engagedResources: [],
              completedResources: [],
              savedResources: [],
              triageResponses: {},
              advanceRequests: [],
              lastVisited: new Date().toISOString(),
            }
      );
      setLoading(false);
    }
  }, [funderId]);

  const updateProgress = (updates: Partial<UserProgress>) => {
    const updated = { ...progress, ...updates, lastVisited: new Date().toISOString() };
    setProgress(updated);

    if (funderId) {
      // Will be persisted to Supabase (handled separately)
    } else {
      localStorage.setItem('mc-curriculum-progress', JSON.stringify(updated));
    }
  };

  return { progress, loading, updateProgress };
}
```

**Step 3: Create event tracking library**

```typescript
// /curriculum/src/lib/events.ts

export type CurriculumEventType =
  | 'triage_complete'
  | 'curriculum_view'
  | 'content_click'
  | 'content_engaged'
  | 'content_saved'
  | 'signup_prompt_shown'
  | 'signup_click'
  | 'advance_request'
  | 'advisory_prompt_shown'
  | 'advisory_click'
  | 'curriculum_return';

export interface LogEventOptions {
  event: CurriculumEventType;
  resourceId?: string;
  resourceType?: string;
  stage?: string;
  fromStage?: string;
  toStage?: string;
  reason?: string;
  funderId?: string;
  timeSpent?: number;
}

let sessionId: string;

function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      localStorage.getItem('mc-session-id') ||
      `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('mc-session-id', sessionId);
  }
  return sessionId;
}

export function logEvent(options: LogEventOptions) {
  const payload = {
    ...options,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  // Fire and forget
  fetch('/api/curriculum/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((e) => console.error('Failed to log event:', e));
}
```

**Step 4: Create ProgressBar component**

```typescript
// /curriculum/src/components/ProgressBar.tsx

export function ProgressBar({
  engaged,
  total,
  timeSpent,
}: {
  engaged: number;
  total: number;
  timeSpent: string;
}) {
  const percentage = Math.round((engaged / total) * 100);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--offwhite)' }}>Progress</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--gray-light)' }}>
          {engaged} of {total} resources • {timeSpent}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'var(--mc-bg-tertiary)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'var(--blue)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--mc-text-muted)' }}>
        {percentage}% complete
      </div>
    </div>
  );
}
```

**Step 5: Create AdvanceDialog component**

```typescript
// /curriculum/src/components/AdvanceDialog.tsx

import { useState } from 'react';
import { logEvent } from '@/lib/events';

export function AdvanceDialog({
  currentStage,
  onClose,
  onSubmit,
}: {
  currentStage: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const handleSubmit = () => {
    logEvent({
      event: 'advance_request',
      fromStage: currentStage,
      reason: reason === 'other' ? otherReason : reason,
    });
    onSubmit(reason === 'other' ? otherReason : reason);
  };

  return (
    <dialog
      open
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        border: 'none',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--mc-bg-secondary)',
          border: '1px solid var(--mc-border)',
          borderRadius: '2px',
          padding: '2rem',
          maxWidth: '32rem',
          width: '100%',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Quick check-in</h2>
        <p style={{ color: 'var(--mc-text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          You're 70% through {currentStage}. Most founders find that completing it gives them the
          mental model to move forward faster.
        </p>
        <p style={{ color: 'var(--mc-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          That said, if you feel solid, we can move you up.
        </p>

        <fieldset style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <legend style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Why do you think you're ready for the next stage?
          </legend>
          {[
            { value: 'already_know', label: 'I already know this stage pretty well' },
            { value: 'found_problem', label: 'I found a problem sponsor—need compliance now' },
            { value: 'wrong_profile', label: "This stage doesn't match my profile" },
            { value: 'explore_parallel', label: 'I want to explore both stages in parallel' },
            { value: 'other', label: 'Other:' },
          ].map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                value={opt.value}
                checked={reason === opt.value}
                onChange={(e) => setReason(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
              <div style={{ flex: 1 }}>
                <div>{opt.label}</div>
                {opt.value === 'other' && reason === 'other' && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Tell us why..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'var(--black)',
                      border: '1px solid var(--mc-border)',
                      color: 'var(--offwhite)',
                      fontFamily: 'inherit',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </div>
            </label>
          ))}
        </fieldset>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid var(--mc-border)',
              color: 'var(--offwhite)',
              cursor: 'pointer',
              borderRadius: '2px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Stay & Finish This Stage
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: reason ? 'var(--blue)' : 'var(--gray-medium)',
              color: '#fff',
              border: 'none',
              cursor: reason ? 'pointer' : 'not-allowed',
              borderRadius: '2px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Advance to Next Stage
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

**Step 6: Create StageView component**

```typescript
// /curriculum/src/components/StageView.tsx

import { Stage, Resource } from '@/hooks/useCurriculum';
import { ProgressBar } from './ProgressBar';
import { logEvent } from '@/lib/events';

function ResourceGroup({
  label,
  resources,
  onResourceClick,
}: {
  label: string;
  resources: Resource[];
  onResourceClick: (resourceId: string, resourceType: string) => void;
}) {
  if (!resources.length) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--mc-text-muted)',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {resources.map((resource) => (
          <a
            key={resource.id}
            onClick={() => {
              logEvent({
                event: 'content_click',
                resourceId: resource.id,
                resourceType: resource.type,
                stage: 'spot', // TODO: pass stage as prop
              });
              onResourceClick(resource.id, resource.type);
            }}
            href={resource.url || resource.internalLink || '#'}
            target={resource.type === 'external' ? '_blank' : undefined}
            rel={resource.type === 'external' ? 'noopener' : undefined}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--mc-bg-tertiary)',
              border: '1px solid var(--mc-border)',
              borderRadius: '2px',
              textDecoration: 'none',
              color: 'var(--mc-text)',
              transition: 'border-color 0.15s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = 'var(--mc-border)')
            }
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{resource.title}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-light)' }}>
                {resource.timeToRead} min
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--mc-text-muted)', margin: 0 }}>
              {resource.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

export function StageView({
  stage,
  onResourceClick,
  onAdvanceClick,
  canAdvance,
}: {
  stage: Stage;
  onResourceClick: (resourceId: string, resourceType: string) => void;
  onAdvanceClick: () => void;
  canAdvance: boolean;
}) {
  const readResources = stage.resources.filter((r) => r.timeToRead <= 15);
  const exampleResources = stage.resources.filter((r) => r.type === 'signal');
  const deepDiveResources = stage.resources.filter(
    (r) => r.type === 'learn' || (r.timeToRead > 15 && r.type !== 'signal')
  );
  const exploreResources = stage.resources.filter((r) => r.type === 'gated');

  return (
    <section style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        {stage.title}
      </h1>
      <p style={{ color: 'var(--mc-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        {stage.subtitle}
      </p>
      <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>{stage.description}</p>

      <ProgressBar engaged={3} total={stage.resources.length} timeSpent="2.5 hours" />

      <ResourceGroup
        label="Read (15 min)"
        resources={readResources}
        onResourceClick={onResourceClick}
      />

      <ResourceGroup
        label="Watch Real Examples (5 min)"
        resources={exampleResources}
        onResourceClick={onResourceClick}
      />

      <ResourceGroup
        label="Deep Dive (1-2 hours)"
        resources={deepDiveResources}
        onResourceClick={onResourceClick}
      />

      <ResourceGroup
        label="Explore Opportunities"
        resources={exploreResources}
        onResourceClick={onResourceClick}
      />

      {canAdvance && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--mc-bg-tertiary)', borderRadius: '2px' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Ready for the next stage?</p>
          <button
            onClick={onAdvanceClick}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            I think I'm ready for the next stage →
          </button>
        </div>
      )}
    </section>
  );
}
```

**Step 7: Create main CurriculumPage component**

```typescript
// /curriculum/src/components/CurriculumPage.tsx

import { useState, useEffect } from 'react';
import { useCurriculum, Stage } from '@/hooks/useCurriculum';
import { useProgress } from '@/hooks/useProgress';
import { StageView } from './StageView';
import { AdvanceDialog } from './AdvanceDialog';
import { logEvent } from '@/lib/events';

export function CurriculumPage({ funderId }: { funderId?: string }) {
  const { curriculum, loading: currLoading } = useCurriculum();
  const { progress, updateProgress } = useProgress(funderId);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);

  useEffect(() => {
    if (progress) {
      logEvent({
        event: 'curriculum_view',
        stage: progress.currentStage,
        funderId,
      });
    }
  }, [progress?.currentStage, funderId]);

  if (currLoading || !curriculum || !progress) {
    return <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>Loading...</div>;
  }

  const currentStage = curriculum.stages.find((s) => s.id === progress.currentStage);
  if (!currentStage) {
    return <div>Stage not found</div>;
  }

  const canAdvance = progress.engagedResources.length >= 2;

  const handleAdvanceRequest = (reason: string) => {
    const nextStageNumber = currentStage.number + 1;
    const nextStage = curriculum.stages.find((s) => s.number === nextStageNumber);

    if (nextStage) {
      updateProgress({
        ...progress,
        currentStage: nextStage.id,
        advanceRequests: [
          ...progress.advanceRequests,
          {
            from: currentStage.id,
            to: nextStage.id,
            reason,
            timestamp: new Date().toISOString(),
            allowed: true,
          },
        ],
      });
      setShowAdvanceDialog(false);
    }
  };

  return (
    <div style={{ padding: '2rem 1rem' }}>
      <StageView
        stage={currentStage}
        onResourceClick={(resourceId, resourceType) => {
          updateProgress({
            ...progress,
            engagedResources: [...new Set([...progress.engagedResources, resourceId])],
          });
        }}
        onAdvanceClick={() => setShowAdvanceDialog(true)}
        canAdvance={canAdvance}
      />

      {showAdvanceDialog && (
        <AdvanceDialog
          currentStage={currentStage.id}
          onClose={() => setShowAdvanceDialog(false)}
          onSubmit={handleAdvanceRequest}
        />
      )}
    </div>
  );
}
```

**Step 8: Commit**

```bash
git add curriculum/src/
git commit -m "feat: add curriculum core components and hooks"
```

---

### Task 6: Create curriculum main entry point and integrate with start.html

**Files:**
- Create: `/curriculum/src/main.tsx`
- Modify: `/start.html` (add CTA to curriculum)

**Step 1: Create main.tsx**

```typescript
// /curriculum/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { CurriculumPage } from '@/components/CurriculumPage';

// Get funderId from URL params or auth header
const params = new URLSearchParams(window.location.search);
const funderId = params.get('funderId');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurriculumPage funderId={funderId || undefined} />
  </React.StrictMode>
);

// Mark page as ready (FOUC prevention)
document.body.classList.add('page-ready');
```

**Step 2: Update /start.html result page to link to curriculum**

After the triage completes, change the results section CTA:

```html
<!-- Instead of showing recommendations inline, link to curriculum -->
<section class="fp-footer-cta">
  <div class="fp-footer-cta__copy">
    <div class="fp-footer-cta__title">Your personalized curriculum is ready</div>
    <div class="fp-footer-cta__sub">
      See resources ordered by stage and what moves you forward fastest.
    </div>
  </div>
  <a href="/curriculum" class="fp-btn fp-btn--primary">
    View Your Curriculum →
  </a>
</section>
```

**Step 3: Commit**

```bash
git add curriculum/src/main.tsx start.html
git commit -m "feat: add curriculum entry point and start integration"
```

---

## Phase 4: Guild Integration & Admin Dashboard

### Task 7: Create Guild curriculum metrics dashboard

**Files:**
- Create: `/curriculum/src/components/MetricsDashboard.tsx` (admin component)

**Step 1: Create metrics dashboard**

```typescript
// /curriculum/src/components/MetricsDashboard.tsx

import { useEffect, useState } from 'react';

export interface CurriculumMetrics {
  triageCompletes: number;
  curriculumViews: number;
  contentClicks: number;
  contentEngaged: number;
  signupPrompts: number;
  signupClicks: number;
  advisoryClicks: number;
  advanceRequests: number;
  stageDistribution: Record<string, number>;
  topResources: Record<string, number>;
}

export function MetricsDashboard({ adminToken }: { adminToken: string }) {
  const [metrics, setMetrics] = useState<CurriculumMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/curriculum/metrics', {
      headers: { 'X-Admin-Token': adminToken },
    })
      .then((r) => r.json())
      .then(setMetrics)
      .catch((e) => console.error('Failed to load metrics:', e))
      .finally(() => setLoading(false));
  }, [adminToken]);

  if (loading || !metrics) return <div>Loading metrics...</div>;

  const conversionFunnel = [
    { label: 'Triage Completes', value: metrics.triageCompletes },
    { label: 'Curriculum Views', value: metrics.curriculumViews },
    { label: 'Content Clicks', value: metrics.contentClicks },
    { label: 'Signup Prompts', value: metrics.signupPrompts },
    { label: 'Signup Clicks', value: metrics.signupClicks },
    { label: 'Advisory Clicks', value: metrics.advisoryClicks },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Curriculum Metrics</h1>

      {/* Conversion Funnel */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Conversion Funnel</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--mc-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Stage</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Count</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>% of Previous</th>
            </tr>
          </thead>
          <tbody>
            {conversionFunnel.map((stage, idx) => {
              const percentage =
                idx === 0
                  ? 100
                  : Math.round((stage.value / conversionFunnel[idx - 1].value) * 100);
              return (
                <tr key={stage.label} style={{ borderBottom: '1px solid var(--mc-border)' }}>
                  <td style={{ padding: '0.75rem' }}>{stage.label}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{stage.value}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Stage Distribution */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Stage Distribution</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {Object.entries(metrics.stageDistribution).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                padding: '1rem',
                background: 'var(--mc-bg-tertiary)',
                borderRadius: '2px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: 'var(--mc-text-muted)', marginBottom: '0.5rem' }}>
                {stage}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Resources */}
      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Top Resources (Last 10)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--mc-border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Resource ID</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metrics.topResources)
              .slice(0, 10)
              .map(([resourceId, clicks]) => (
                <tr key={resourceId} style={{ borderBottom: '1px solid var(--mc-border)' }}>
                  <td style={{ padding: '0.75rem' }}>{resourceId}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{clicks}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add curriculum/src/components/MetricsDashboard.tsx
git commit -m "feat: add curriculum metrics dashboard for admin"
```

---

## Phase 5: Testing & Integration

### Task 8: Write unit tests for curriculum hooks and components

**Files:**
- Create: `/curriculum/src/__tests__/useCurriculum.test.ts`
- Create: `/curriculum/src/__tests__/useProgress.test.ts`
- Create: `/curriculum/src/__tests__/events.test.ts`

(Tests structure — similar to opportunities pattern)

---

## Ready for Execution

Plan saved to `/docs/plans/2026-06-23-guided-curriculum.md`

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session in worktree, use executing-plans skill, batch execution with checkpoints

Which approach do you prefer?