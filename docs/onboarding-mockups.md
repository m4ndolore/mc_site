# Onboarding Flow Mockups

## Overview

Transform the current access page from a simple Name/Email/Interests form into a
**4-step discovery wizard**. The right panel becomes a step-by-step flow. The left
hero panel stays as-is.

**Psychology:** Each step is framed as "help us configure your experience" but
actually educates users on MC's value through their own selections. Contact info
comes last — after they've invested in 3 steps of choices (sunk cost effect).

**Inspiration:** Wispr Flow's onboarding (called "the best onboarding ever seen"
by Irrational Labs behavioral scientists).

---

## Step 1 of 4 — "What best describes you?"

**Type:** Single-select cards (pick one)
**Hidden purpose:** Segment the user for tailored messaging

```
╔══════════════════════════════════════════╗
║                                          ║
║  ▬▬▬▬▬▬▬▬ ░░░░░░░░ ░░░░░░░░ ░░░░░░░░   ║  ← progress bar (step 1 filled)
║                                          ║
║  CONFIGURE YOUR EXPERIENCE               ║
║  What best describes you?                ║
║                                          ║
║  ┌────────────────────────────────────┐   ║
║  │  ▸ Founder / CEO                  │   ║
║  │    Building or scaling a company   │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │  ▸ Operator / Program Manager     │   ║
║  │    DoD, IC, or government role     │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │  ▸ Engineer / Builder             │   ║
║  │    Hands-on technical contributor  │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │  ▸ Investor / Advisor             │   ║
║  │    Capital or strategic guidance   │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │  ▸ Other                          │   ║
║  │    Something else entirely         │   ║
║  └────────────────────────────────────┘   ║
║                                          ║
║              [ Continue → ]              ║
║                                          ║
╚══════════════════════════════════════════╝
```

**Selection behavior:** Click a card to select it (blue border + subtle fill).
Only one can be selected. "Continue" activates once a selection is made.

---

## Step 2 of 4 — "What challenges resonate?"

**Type:** Multi-select chips (pick all that apply)
**Hidden purpose:** User discovers that MC solves their specific pain points

```
╔══════════════════════════════════════════╗
║                                          ║
║  ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ░░░░░░░░ ░░░░░░░░   ║  ← progress bar (steps 1-2 filled)
║                                          ║
║  WHAT CHALLENGES RESONATE?               ║
║  Select all that apply.                  ║
║                                          ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Finding the right │ │ Navigating    │ ║
║  │ contracts & opps  │ │ DoD           │ ║
║  │                   │ │ procurement   │ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Connecting with   │ │ Building a    │ ║
║  │ end users &       │ │ cleared team  │ ║
║  │ operators         │ │               │ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Understanding     │ │ Getting from  │ ║
║  │ compliance (ITAR, │ │ prototype to  │ ║
║  │ CMMC, FedRAMP)    │ │ production    │ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Finding defense   │ │ Identifying   │ ║
║  │ tech co-founders  │ │ real problems │ ║
║  │ & partners        │ │ worth solving │ ║
║  └───────────────────┘ └───────────────┘ ║
║                                          ║
║      [ ← Back ]     [ Continue → ]      ║
║                                          ║
╚══════════════════════════════════════════╝
```

**Selection behavior:** Chips toggle on/off with colored active states
(green/blue/amber). At least one must be selected to continue.

---

## Step 3 of 4 — "What would be most valuable?"

**Type:** Multi-select chips (pick all that apply)
**Hidden purpose:** User discovers MC's features by choosing what appeals to them

```
╔══════════════════════════════════════════╗
║                                          ║
║  ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ░░░░░░░░   ║  ← progress bar (steps 1-3 filled)
║                                          ║
║  WHAT WOULD BE MOST VALUABLE?            ║
║  We'll tailor your experience.           ║
║                                          ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Curated defense   │ │ Warm intros   │ ║
║  │ opportunities     │ │ to operators  │ ║
║  │ board             │ │ & program mgrs│ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Mission matching  │ │ Builder       │ ║
║  │ — pair with real  │ │ cohort & peer │ ║
║  │ warfighter needs  │ │ network       │ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌───────────────────┐ ┌───────────────┐ ║
║  │ Compliance &      │ │ Events, demos │ ║
║  │ contracting       │ │ & field       │ ║
║  │ guidance          │ │ visits        │ ║
║  └───────────────────┘ └───────────────┘ ║
║  ┌──────────────────────────────────────┐ ║
║  │ Intel briefings & threat landscape  │ ║
║  │ context                             │ ║
║  └──────────────────────────────────────┘ ║
║                                          ║
║      [ ← Back ]     [ Continue → ]      ║
║                                          ║
╚══════════════════════════════════════════╝
```

---

## Step 4 of 4 — "Almost there"

**Type:** Contact form (name, email, org)
**Hidden purpose:** By now they're invested — 3 steps of choices = sunk cost

```
╔══════════════════════════════════════════╗
║                                          ║
║  ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬   ║  ← progress bar (all filled)
║                                          ║
║  ALMOST THERE                            ║
║  Tell us where to reach you.             ║
║                                          ║
║  ┌────────────────────────────────────┐   ║
║  │ NAME                              │   ║
║  │ _________________________________ │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │ EMAIL                             │   ║
║  │ _________________________________ │   ║
║  └────────────────────────────────────┘   ║
║  ┌────────────────────────────────────┐   ║
║  │ ORGANIZATION (optional)           │   ║
║  │ _________________________________ │   ║
║  └────────────────────────────────────┘   ║
║                                          ║
║  [ Turnstile widget ]                    ║
║                                          ║
║     [ ← Back ]   [ Request Access → ]    ║
║                                          ║
║  ─────────────────────────────────────── ║
║  Already a member?                       ║
║  [      Sign in with Email →           ] ║
║  [ Google ]           [ CAC/PIV  Soon ]  ║
║                                          ║
╚══════════════════════════════════════════╝
```

---

## Design Notes

- **Progress bar:** Thin segmented bar at top of right panel (4 segments).
  Filled segments use `var(--blue)`, unfilled use `rgba(255,255,255,0.1)`.
- **Cards (Step 1):** Reuse `.access-field` styling with hover/selected states.
  Selected = blue left border + subtle blue fill.
- **Chips (Steps 2-3):** Reuse existing `.access-chip` pattern with colored
  active states (green, blue, amber rotation).
- **Buttons:** "Continue" uses `.access-request__submit` style. "Back" is a
  ghost/text button.
- **Animation:** Steps slide left-to-right with a subtle CSS transition
  (translateX + opacity fade, ~200ms).
- **Left hero:** Stays static across all steps (same as current).
- **Mobile:** Steps stack vertically; hero collapses to a brief header.
- **Data:** All selections (role, challenges, values) are submitted alongside
  contact info in the final payload to the API.
