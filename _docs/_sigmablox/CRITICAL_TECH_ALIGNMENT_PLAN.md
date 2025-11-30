# Critical Technology Area Alignment Plan

## Context

We now support a dedicated `criticalTechArea` field for every company profile so the Combine, Cohort 25‑1 dashboard, and downstream reports can align with the Office of the Under Secretary of Defense for Research & Engineering (OUSD(R&E)) Critical Technology Areas (CTAs). The public experience already exposes this metadata through the new Combine filters and cards; we still need to populate the field for legacy companies.

## CTA Reference

| CTA | Description | Example Cues |
| --- | --- | --- |
| Applied Artificial Intelligence | Mission-ready AI/autonomy/ML capabilities | Autonomy mission tags, “AI”, “computer vision”, “autonomous”, “ML” |
| Biomanufacturing | Synthetic biology and bio-industrial production | Biomedical keywords, “bio”, “lab automation”, “vaccines” |
| Contested Logistics Technologies | Resilient supply, sustainment, distributed ops | Logistics mission tags, “supply chain”, “forward sustainment”, “distributed ops” |
| Quantum and Battlefield Information Dominance | Quantum sensing, secure comms, data advantage | “Quantum”, “EW”, “OPIR”, “information dominance”, “C2 data fabric” |
| Scaled Hypersonics | Fieldable hypersonic systems & countermeasures | “Hypersonic”, “thermal protection”, “boost-glide”, “counter-hypersonic” |
| Scaled Directed Energy | High-energy lasers/microwaves for defense | “Directed energy”, “HEL”, “HPM”, “laser weapon”, “counter-UAS DE” |

## Alignment Plan

1. **Data Audit & Instrumentation**
   - Export a CSV or JSON array of all companies with mission area(s), warfare domain, keywords, and any existing program tags (script against `companies` collection or `/api/admin/overview?dimension=mission` dump).
   - Extend the Combine/overview telemetry to log CTA coverage so we can watch adoption in Mixpanel/GA.

2. **Auto-Mapping Suggestions**
   - Use `node scripts/suggest-critical-tech.js data/companies.json > suggestions.md` to generate a Markdown table of proposed CTAs (the script scores each company by keywords + mission hints and prints the rationale).
   - Store the suggestion (e.g., `criticalTechAreaSuggested`) so admins can compare suggested vs manually confirmed values during review.

3. **Review Workflow**
   - Add an admin-only review table (Ghost admin dashboard or internal tooling) that lists companies lacking a CTA or where suggestion ≠ saved value.
   - Allow inline edits or CSV import to approve/correct mappings quickly.
   - Notify company owners via email or dashboard checklist when their CTA is missing so they can self-serve through My Company.

4. **Rollout & Change Management**
   - Phase 1: Admin team bulk-assign CTAs to critical/spotlight companies (top 100) using the review workflow.
   - Phase 2: Enable My Company validation (field already live) and include CTA guidance in onboarding emails.
   - Phase 3: Require CTA selection for new applicants and surface CTA filters wherever mission filters exist.

5. **Maintenance & Reporting**
   - Nightly job summarizes CTA distribution and flags “Unknown” entries; push summary into Slack/Looker.
   - Quarterly review to ensure CTA taxonomy matches latest OUSD(R&E) guidance; we can update the config in `tag-taxonomy.js` without schema changes.

Following this plan keeps legacy records intact while moving us toward the six official CTA pillars without losing the richer mission-area taxonomy already used across SigmaBlox. Once the field is populated, product, scouting, and exec teams can pivot portfolio views by CTA instantly (Combine cards, cohorts directory, member dashboard, etc.).
