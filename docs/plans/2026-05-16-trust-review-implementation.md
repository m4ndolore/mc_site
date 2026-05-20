# Trust Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address the 10 trust issues identified in the Stephens/Blank critical assessment, improving site credibility for sophisticated audiences (VCs, operators, elite founders).

**Architecture:** Sequential edits to existing HTML/CSS files. No new dependencies. Copy rewrites + design fixes + structural additions to homepage.

**Tech Stack:** Static HTML, CSS, vanilla JS. Vite build. C2UX design system tokens.

---

## Current State Assessment (Post-Rewrite)

After the recent copy shift, several issues are already partially resolved:
- ✅ Hedging copy (REQ-CONTENT-010) — mostly cleaned up. "We're still early" language gone.
- ✅ Named testimonials (REQ-CONTENT-014) — 5 named quotes exist (Art Trevethan, Jim Connors, Wes Bergmann, Catherine Bair, Josh VanBuskirk + anonymous Deputy Commander)
- ⚠️ Team exists on /about but NOT on homepage (REQ-CONTENT-008)
- ❌ Stats unattributed (REQ-CONTENT-011)
- ❌ Logo section misleading (REQ-CONTENT-012)
- ❌ /start and /founder-path off-brand (REQ-C2UX-010)
- ❌ No case study page (REQ-CONTENT-009)
- ❌ No business model section (REQ-CONTENT-013)
- ❌ Nav overload (REQ-UX-016)
- ❌ Multiple competing CTAs (REQ-UX-017)

---

### Task 1: Fix Hero Stats Attribution (REQ-CONTENT-011)

**Files:**
- Modify: `index.html` (hero stats section, ~lines 200-215)

**Step 1: Replace generic stats with attributed, linked stats**

Current:
```html
<div class="hero__stat">
  <span class="hero__stat-number">83</span>
  <span class="hero__stat-label">Companies Validated</span>
</div>
...
<div class="hero__stat">
  <span class="hero__stat-number">21</span>
  <span class="hero__stat-label">Funded for Follow-On</span>
</div>
...
<div class="hero__stat">
  <span class="hero__stat-number">5</span>
  <span class="hero__stat-label">Partner Nations Engaged</span>
</div>
```

Replace with attributed stats that link to evidence:
```html
<div class="hero__stat">
  <a href="/combine/cohort25-1" class="hero__stat-link">
    <span class="hero__stat-number">83</span>
    <span class="hero__stat-label">Combine 25-1 Companies</span>
  </a>
</div>
...
<div class="hero__stat">
  <a href="/signals/ulysses-combine-to-series-a" class="hero__stat-link">
    <span class="hero__stat-number">$46M</span>
    <span class="hero__stat-label">Raised Post-Combine</span>
  </a>
</div>
...
<div class="hero__stat">
  <a href="/about" class="hero__stat-link">
    <span class="hero__stat-number">5</span>
    <span class="hero__stat-label">Allied Nations</span>
  </a>
</div>
```

**Step 2: Add minimal link styling**

In the `<style>` block or styles.css:
```css
.hero__stat-link {
  text-decoration: none;
  color: inherit;
}
.hero__stat-link:hover .hero__stat-number {
  color: var(--blue);
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: ✓ built successfully

**Step 4: Commit**

```bash
git add index.html
git commit -m "fix: attribute hero stats with links and context"
```

---

### Task 2: Fix Logo Section Framing (REQ-CONTENT-012)

**Files:**
- Modify: `index.html` (~lines 524-563)

**Step 1: Replace misleading "Built with and delivered for" with honest framing**

Current:
```html
<h2 class="social-proof__title">Built with and delivered for</h2>
<p class="social-proof__subtitle">
  Organizations our team has worked inside — not conference introductions.
</p>
```

Replace with:
```html
<h2 class="social-proof__title">Where our team has delivered</h2>
<p class="social-proof__subtitle">
  Programs, commands, and organizations where MC founders served or built systems — before starting Merge.
</p>
```

**Step 2: Verify and commit**

---

### Task 3: Add Team Strip to Homepage (REQ-CONTENT-008)

**Files:**
- Modify: `index.html` (add section after "Why We Built Merge Combinator")

**Step 1: Add compact founder strip between Why Merge and How It Works**

Insert after the "Why Merge" section (~line 244), before the platform section:

```html
<!-- FOUNDERS -->
<section class="section--lg" style="background: var(--black); padding: 48px 0;">
  <div class="container">
    <div class="fade-up" style="display: flex; align-items: center; gap: 32px; flex-wrap: wrap; justify-content: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/assets/images/paul-optimized.jpg" alt="Paul Garcia" style="width: 48px; height: 48px; border-radius: 2px; object-fit: cover; object-position: center 14%; border: 1px solid rgba(255,255,255,.12);">
        <div>
          <div style="font-size: 14px; color: var(--offwhite); font-weight: 500;">Paul Garcia</div>
          <div style="font-size: 12px; color: var(--gray-light);">CEO · WIC/Weapons School SME</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/assets/images/elise-optimized.jpg" alt="Elise Walker" style="width: 48px; height: 48px; border-radius: 2px; object-fit: cover; border: 1px solid rgba(255,255,255,.12);">
        <div>
          <div style="font-size: 14px; color: var(--offwhite); font-weight: 500;">Elise Walker</div>
          <div style="font-size: 12px; color: var(--gray-light);">COO · Indo-Pacific Strategy</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/assets/images/doug-optimized.jpg" alt="Doug Cummings" style="width: 48px; height: 48px; border-radius: 2px; object-fit: cover; border: 1px solid rgba(255,255,255,.12);">
        <div>
          <div style="font-size: 14px; color: var(--offwhite); font-weight: 500;">Doug Cummings</div>
          <div style="font-size: 12px; color: var(--gray-light);">CTO · ABMS, Maven, Kessel Run</div>
        </div>
      </div>
      <a href="/about" style="font-size: 13px; color: var(--blue); text-decoration: none; margin-left: 8px;">Meet the team →</a>
    </div>
  </div>
</section>
```

**Step 2: Verify and commit**

---

### Task 4: Fix /start and /founder-path Design (REQ-C2UX-010)

**Files:**
- Modify: `start.html` (remove Lora/Space Mono fonts, fix gold references)
- Modify: `styles/start.css` (replace --gold with --blue)
- Modify: `founder-path.html` (remove extra font imports, fix booking link)
- Modify: `_redirects` (add /founder-path → /launch redirect)
- Rename: `founder-path.html` → keep as-is for now (rename in separate PR to avoid breakage)

**Step 1: Fix start.html font imports**

Remove Lora and Space Mono from `<link>` tag. Keep only Inter.

**Step 2: Fix styles/start.css — replace all --gold with --blue**

Replace:
- `var(--gold)` → `var(--blue)`
- `rgba(201, 160, 99, ...)` → `rgba(59, 130, 246, ...)` (blue equivalents)
- `var(--font-serif)` → `var(--font-primary)` for headings
- Reduce heading font sizes to C2UX scale (no 6.6rem)

**Step 3: Fix founder-path.html font imports and booking link**

- Remove Lora/Space Mono font import
- Replace `https://book.mergecombinator.com/founder` with `https://calendar.app.google/caYkEhTngEyUEgDn7`

**Step 4: Verify build and commit**

---

### Task 5: Consolidate Navigation (REQ-UX-016 + REQ-UX-017)

**Files:**
- Modify: `public/data/navigation.json`
- Modify: `js/navbar.js` (if dropdown structure changes)

**Step 1: Simplify nav to 5 items + CTA**

Current nav items: Programs, Builders, Signals, Knowledge, Learn, Start, About (7+)

New structure:
- Programs (dropdown: The Combine, Residency, Launch)
- Builders
- Signals
- Learn (consolidate Knowledge into Learn)
- About
- [CTA button: Get Access]

**Step 2: Update navigation.json**

**Step 3: Verify build and commit**

---

### Task 6: Unify Homepage CTAs (REQ-UX-017)

**Files:**
- Modify: `index.html` (hero CTA, platform panel CTAs)

**Step 1: Make hero CTA point to /launch (the triage)**

Current: `<a href="/start" class="btn btn--primary btn--glow">Get Started</a>`
New: `<a href="/launch" class="btn btn--primary btn--glow">Find Your Path</a>`

**Step 2: Unify all "Join" buttons to /access**

All "Join Defense Builders" and "Build with us" CTAs → `/access`

**Step 3: Verify and commit**

---

### Task 7: Add Business Model Section to About (REQ-CONTENT-013)

**Files:**
- Modify: `about.html` (add section)

**Step 1: Add "How we work" economics section**

After the team section on the About page, add a concise block:

```html
<section class="section--lg" style="background: var(--charcoal);">
  <div class="container" style="max-width: 720px;">
    <span class="section-label section-label--light">How We Work</span>
    <h2 style="font-size: var(--text-h2); color: var(--white); margin-bottom: 16px;">We build, co-found, and invest.</h2>
    <p style="color: rgba(255,255,255,.72); line-height: 1.7;">
      Merge Combinator takes co-founder equity in ventures we help form. We also operate Guild — a subscription network for defense builders — and broker capability transactions through Defense Builders. No advisory fees. No pay-to-play. We make money when the companies succeed.
    </p>
  </div>
</section>
```

**Step 2: Verify and commit**

---

### Task 8: Add /launch redirect (prep for rename)

**Files:**
- Modify: `_redirects`
- Modify: `vite.config.js` (if needed)

**Step 1: Add redirect so /launch works now**

In `_redirects`:
```
/launch /founder-path 200
```

(This is a rewrite, not redirect — serves founder-path content at /launch URL)

**Step 2: Update all internal links pointing to /founder-path → /launch**

**Step 3: Verify and commit**

---

## Execution Order

1. Task 1 — Stats attribution (quick, high impact)
2. Task 2 — Logo framing (quick copy fix)
3. Task 3 — Team strip on homepage (moderate, high trust impact)
4. Task 4 — /start + /founder-path design fix (moderate effort)
5. Task 5 — Nav consolidation (moderate, improves clarity)
6. Task 6 — CTA unification (quick, depends on Task 5)
7. Task 7 — Business model section (quick copy addition)
8. Task 8 — /launch redirect (quick infrastructure)

## Items Requiring Owner Input (Not in This Plan)

- **REQ-CONTENT-009 (Case study):** Needs Ulysses permission and content details
- **REQ-CONTENT-010 (Remaining hedging):** Mostly resolved; audit pass needed
- **REQ-CONTENT-014 (More testimonials):** Already have 5 named — may be sufficient

---
