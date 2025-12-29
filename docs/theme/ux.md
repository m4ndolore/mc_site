1) Named doctrine (use this as the source-of-truth)
Design Doctrine: Command and Control UX (C2UX)

Definition: The product is an operations console for defense builders to create, validate, coordinate, and transact on capability—under constraints.

Non-negotiable UI outcome: Every screen reads like an instrumented workspace (TOC / briefing / ops cell), not a publishing tool or marketing site.

Test: If a screen still makes sense when you replace the title with “Editor / Draft / Preview,” it’s not C2UX.

2) “Stop doing / start doing” rules (engineer-friendly)
A) Layout architecture

Stop: Page-centric flows, centered cards, hero sections, “split view editor/preview.”
Start: Panels + persistent context.

C2UX layout standard (default):

Left: persistent nav + operational context (program, mission, workspace)

Center: primary working surface (artifact/module)

Right: status / validation / metadata / actions / audit

Implementation rule: Any “primary task” screen must support two concurrent side channels (context + status). If it can’t, it’s not an ops console.

B) Visual system

Stop: Rounded cards, gradients, soft shadows, friendly whitespace, celebratory UI.
Start: Cold, dense, intentional.

Design tokens (hard constraints):

Corner radius: 0–2px (not 12–20px)

Borders: thin, consistent, readable

Shadows: minimal or none

Color: subdued base + purposeful highlights only (status/priority)

Density: default compact spacing; whitespace is a tool, not decoration

C) Typography hierarchy

Stop: Marketing headlines and uniform text weight competing everywhere.
Start: Orders > Status > Commentary.

Primary: directives / state (“Validation Required”, “Queued for Review”)

Secondary: context (“Submitted by…”, “Linked requirement…”)

Tertiary: metadata (timestamps, provenance, system IDs)

D) Language + semantics

Stop: CMS/consumer terms (draft, story, editor, preview, invite, welcome, get started, create, magic, easy).
Start: operational language with explicit state.

Replace with a controlled vocabulary:

Story → Artifact / Capability Brief

Draft → Working Copy / Unvalidated

Saved → Stored / Committed

Invite → Access Provisioned

Publish → Release / Deploy / Approve

Review → Validation

Dashboard → Operations Console

Preview → Rendered Output / Execution View

Copy style rule: No reassurance, no cheerleading. Just state + next action.

E) Status + notification behavior

Stop: disappearing toasts for meaningful events; “success!” confetti energy.
Start: status blocks + acknowledgement for critical changes.

Rule of thumb:

Low consequence → inline status

Medium consequence → persistent notification center item

High consequence → blocking confirmation / acknowledgement + audit log entry

3) What “rework the module” means (not just labels)

When you touch a screen, you must change at least two of the following, otherwise it’s a “rename-only” change:

Screen architecture (page → panels; add right status rail; persistent context)

Interaction model (review flow → queue + state machine; confirmation patterns)

Visual system (radii/shadows/spacing/type hierarchy)

Semantic model (objects are artifacts/modules/validations, not stories/drafts)

Status + audit (visible state, traceability, provenance)

Make this your PR acceptance checklist.

4) Migration strategy: SigmaBlox → C2UX without losing the incubator mission

You’re not killing “digital incubator.” You’re changing the presentation and the primary mental model:

“Incubator” becomes:

Operational workspace for capability development

Collaboration under constraints

Marketplace as controlled transactions with audit and permissions

So: keep the features, re-skin + re-structure the environment.

5) Feature triage: what to bring forward vs rebuild
Bring forward (but “C2UX-wrapped”)

These are valuable, just currently expressed in CMS language/UI:

Knowledge + artifacts

Artifact repository (formerly posts/stories)

Versioning / revisions

Tagging + search + filters

Collaboration

Comments → Operator Notes

Mentions → Tasking

Invitations → Access provisioning

Profiles/companies → Entities / Orgs / Teams

Marketplace

Listings → Capabilities / Offers

Transactions → Requests / Orders / Agreements

Messaging → Secure coordination thread

Payment/terms → Controlled transaction workflow

Key condition: each becomes a panel-driven workflow with explicit states + audit.

Rebuild first (highest “CMS smell”)

These are usually where the “Ghost/Webflow/Medium” feeling lives:

Centered “hero” layouts

“Editor / Preview” paradigms

Friendly onboarding flows

Celebration screens (“You’re all set!”)

Card-based dashboards

Toast-heavy notification patterns

These should be recomposed into queue + console modules.

6) The balance: density + seriousness without becoming unusable

The trick is not “make it dark and dense.” The trick is make it scannable under pressure.

Balance rules:

Dense layouts must still provide strong alignment + consistent hierarchy

Use whitespace only to separate operational regions, not to feel “premium”

Provide progressive disclosure via expand/collapse panels, not separate pages

“Marketplace” still works in C2UX if it looks like procurement/tasking, not ecommerce

7) Concrete module map (use this to guide rebuild scope)
Replace CMS split view with these C2UX modules:

Artifact Workspace (center)

structured fields + sections

provenance, linked requirements

revision timeline

Validation Queue (right)

state machine: Unvalidated → In Validation → Validated/Rejected

required checks + reviewer assignments

audit events

Operational Context (left)

program/workspace selector

mission threads / workstreams

recent artifacts + alerts

This turns “writing content” into “operating a system.”

8) “Definition of Done” for the pivot (so engineering knows what success is)

A screen passes C2UX when:

It uses panel architecture with persistent context/status

It uses operational vocabulary and explicit state

It supports high-density scanning (lists, queues, metadata)

It has status discipline (persistent for meaningful events)

It feels like a console, not a website

A screen fails C2UX when:

It’s centered, cardy, friendly, or marketing-led

It’s “editor vs preview”

It uses consumer language

It hides state behind toasts

It reassures instead of instructing

9) Quick directive for your team (paste this into your repo as the “why”)

We are rebuilding SigmaBlox into a Command and Control operating environment.
We will keep incubator features (sharing, collaboration, marketplace), but the UI must read like an operations console: panel-driven, stateful, instrumented, serious. Renaming labels is insufficient—modules must be re-architected into queues, workspaces, and status rails with explicit validation and provenance.