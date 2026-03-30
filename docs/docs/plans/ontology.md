# How Would Palantir Build This?
## A Method for Turning Information into Actionable Decisions

Use this prompt to architect any system where the core problem is: *information exists, decisions need to be made, humans need to supervise the process, and the system should get better over time.*

---

## The framing question

Before writing any code or designing any screen, answer this:

> "What are the objects in this domain, what properties do they have, what decisions need to be made about them, and who acts on those decisions?"

Palantir doesn't build dashboards. They build **operational systems where the data model is the product** and every screen is a view of or action on that model. If you design the UI first, you will build the wrong thing. If you design the object graph first, the UI becomes obvious.

---

## Step 1: Define the object graph

List every real-world entity that matters to this problem. For each object, define:

- **Properties**: what facts describe this object?
- **Status**: what lifecycle states can it be in?
- **Relationships**: what does it belong to, contain, or connect to?
- **Classifications**: what decisions need to be made about it? (see Step 2)

**The escape hatch**: include a `metadata: JSONB` or `Record<string, unknown>` field on every object. This is not laziness — it's intellectual honesty. You will discover new properties in the field. The escape hatch means you don't block real work on an incomplete model. When a metadata field appears more than 50 times, promote it to a first-class property.

**The flexible bag**: for objects with richly varying attributes (physical sites, products, assets), use a `features: JSONB` field with a GIN index. Never block an operation because a feature field doesn't exist yet.

---

## Step 2: Model every decision as a Classification

Every decision the system makes about an object follows this pattern:

```typescript
interface Classification<T> {
  value: T | null        // the assigned value — null until confidence threshold met
  confidence: number     // 0.0–1.0, updates as evidence accumulates
  evidence: Evidence[]   // full history of what contributed
  threshold: number      // minimum confidence required to act
}

interface Evidence {
  source: string         // where this came from: 'user_input' | 'sensor' | 'rule' | 'llm' | 'history'
  value: unknown         // what was observed
  weight: number         // how much it moved confidence
  timestamp: string
}
```

Ask for every decision in your domain:
- What is the value type? (an enum, an ID, a number, a boolean)
- What sources of evidence exist?
- What confidence threshold justifies acting without human review?
- What happens below that threshold? (ask a question, escalate, wait)

**The key insight**: a system that models its own uncertainty is far more useful than a system that makes confident wrong decisions. "I don't know yet" is a valid and important state.

---

## Step 3: Define the authority hierarchy for any AI/automation layer

If the system includes AI, automation, or rules engines, enforce this hierarchy:

```
Evidence sources (sensors, user input, history, external APIs)
  ↓
Deterministic guards (rules, lookups, policy checks)
  ↓  [guards can veto or override AI intent]
AI/LLM layer (produces Intent objects — proposed decisions, reasoning, confidence)
  ↓  [AI never writes state directly]
Router (the sole writer of object state)
  ↓
Actions (typed, auditable mutations)
  ↓
Audit log (write-only, forever)
```

**Guards return observations, not decisions:**
```typescript
interface GuardResult {
  value: T | null    // what the guard resolved, null if it couldn't evaluate
  confidence: number
  evidence: Evidence
}
```

**The router decides what to do with guard results:**
- `confidence >= threshold` → assign the value, advance
- `isEscalationCondition` → fire escalation action, pause for human
- else → request more information (clarify)

This hierarchy means: AI can be wrong and the system still behaves correctly. Guards have veto power. Humans supervise transitions. The audit log makes everything inspectable.

---

## Step 4: Define Actions — the only write path

Every mutation to every object goes through a typed Action. Nothing writes to the database directly except through an Action. This is non-negotiable.

Each Action:
- Takes a typed input interface
- Validates inputs
- Opens a database transaction for multi-table writes
- Writes to the audit log as the last step in every transaction
- Returns a typed output
- Throws typed errors

```typescript
interface Action<TInput, TOutput> {
  name: string                    // 'ApproveEstimate', 'AdvancePhase', 'ClassifyAsset'
  input: TInput
  execute(db: Database): Promise<TOutput>
  // side effects: downstream actions, notifications, queue entries
}
```

**Why this matters**: when a decision turns out to be wrong, you need to answer "why did the system do that?" The audit log answers this. When requirements change, you need to find every place a mutation occurs. Actions are that index.

---

## Step 5: Model escalation as an event, not a state

A common mistake: when humans need to intervene, the system moves the object into an "escalated" or "needs review" state and gets stuck there. The correct model:

**Escalation is an Action that pauses an object, not a destination it enters.**

```typescript
interface EscalateObject {
  object_id: string
  reason: string           // human-readable, shown to the reviewer
  evidence: Evidence[]     // what triggered this
  state_at_pause: string   // snapshot of the workflow step — NOT changed by escalation
}
// Writes: object.status = 'paused'
// Writes: paused_at, paused_reason
// Does NOT write: workflow_step (frozen as-is)
// Notifies: the appropriate human

interface ResumeObject {
  object_id: string
  actor_id: string
  instruction?: string     // optional context injected for the next automated step
}
// Writes: object.status = 'active'
// Does NOT write: workflow_step (unchanged — picks up where it left off)
```

This pattern means: resume requires no archaeology, no state reconstruction, no special cases. The object was paused. Now it's unpaused. The automation continues from exactly where it stopped.

---

## Step 6: Build the learning pipeline

Every system built this way generates structured data about outcomes. The learning pipeline turns that data into actionable suggestions — but **humans decide whether to act on them**.

```
Outcomes (what actually happened)
  ↓
Analysis jobs (nightly or triggered)
  ↓
Suggestions (structured proposals for system improvement)
  ↓
Human review queue (accept / reject / defer)
  ↓
If accepted: Action that applies the change to the model
```

The suggestion queue is a product surface, not a background process. Whoever owns the system needs to see it, understand what the system learned, and make deliberate decisions about what to incorporate.

**Suggestion types to model for any domain:**
- Add a data collection step (the system is making decisions without enough information)
- Remove a rule (it never fires — dead weight)
- Update a threshold (it fires but outcomes are consistently off)
- Deprecate a workflow (unused or poor outcomes)
- Create a new workflow variant (a cluster of cases that don't fit existing patterns)

---

## Step 7: Design the HITL (Human-in-the-Loop) interfaces

Every operational screen should answer three questions for the human using it:

1. **What is this?** (the object's identity and current state)
2. **Why does it say that?** (the provenance — what evidence produced this classification)
3. **What can I do?** (the available Actions, with consequences clearly stated)

**The rule trace**: every AI-generated or rule-derived value should show its reasoning one click away. "Estimate: $340" → click → "Base $200 + large pool $40 + screened $25 + 2 pumps $35 + spa $20 = $320, rep overrode to $340." That transparency is what builds trust between operators and the system.

**The escalation callout**: when human review is required, show:
- What triggered the escalation (source + reason)
- What the automated system proposed
- What the deterministic check found (if different)
- Where the workflow was when it paused
- Actions available: Resume / Take Over / Close

**Save decisions**: when a human overrides a system-generated value, ask explicitly how to save the change:
- Apply once (this instance only)
- Update the model (improve the rule or threshold)
- Create a variant (fork the workflow)
- Queue as a suggestion (let the owner decide)

This makes every human override a structured data point that feeds the learning pipeline.

---

## Step 8: The minimal UI to make the ontology legible

You don't need to build everything at once. Build these surfaces first, in this order:

| Surface | What it enables |
|---------|-----------------|
| Object inspector | See any object as structured data with its current classifications |
| Action buttons | Approve, override, escalate — wired to real Actions |
| Audit trail | Who changed what, when, and why |
| Escalation queue | Objects waiting for human review |
| Save decision modal | The learning capture point |

The workflow canvas, the analytics dashboard, the suggestion queue — all of that comes after the core loop is working.

---

## The questions to ask at the start of any project

**About the objects:**
- What exists in this domain that has a lifecycle?
- What properties of those objects change over time vs. are set once?
- What decisions need to be made about each object?
- What constitutes "enough information" to make each decision?

**About the decisions:**
- Who currently makes this decision, and how?
- What information do they use?
- How often are they wrong, and in which direction?
- What would change if they had better information faster?

**About the humans:**
- Who needs to act on these decisions?
- What do they need to see to trust the system's output?
- When should the system stop and ask rather than decide?
- What decisions should never be automated, only assisted?

**About the learning:**
- How will you know if the system is getting better?
- What outcomes are being tracked?
- Who reviews what the system has learned?
- What's the policy for applying learned changes?

---

## The one-sentence version

> Model the domain as objects with classified properties, make all mutations through auditable Actions, let AI propose and guards validate while the router writes, escalate to humans when confidence is insufficient, and close the loop by turning outcomes into suggestions that humans review before applying.

---

## Anti-patterns to avoid

**Building the UI first.** The UI is a view of the object graph. If the object graph isn't defined, the UI is built on sand. It will be rebuilt when the model becomes clear.

**Letting AI write state directly.** AI produces intent objects. Guards validate. The router writes. When you skip this hierarchy, you get cascading failures that are hard to debug and harder to trust.

**Escalation as a state.** When "escalated" is a step in a workflow, the workflow gets stuck, resumes are complicated, and the system loses context. Escalation is a pause action. The workflow step doesn't change.

**Confidence-free decisions.** If the system can't say how confident it is, it can't know when to ask for help. Every classification needs a confidence score and a threshold. Below threshold: clarify or escalate. Never silently decide.

**One-way learning.** If the system learns automatically without human review, you lose trust and control. Suggestions are proposals. Humans decide. The audit log shows what was applied and why.

**Schemas baked into UI assumptions.** When the data model is implicit in the UI, schema changes require UI rewrites. Keep the model explicit (even as a TypeScript types file), keep it separate from the UI, and let the UI be generated from it.