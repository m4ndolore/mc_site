# Builders Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply subtle C2UX-aligned tweaks to builders.html before mc_site launch

**Architecture:** CSS-only changes for visual tightening, one JS change for language update. No structural changes.

**Tech Stack:** Vanilla CSS, Vanilla JS (ES modules)

---

## Task 1: Reduce Card Border Radius

**Files:**
- Modify: `styles/builders.css:248`

**Step 1: Update .builder-card border-radius**

Change from 12px to 6px for a sharper, more operational feel.

```css
/* Before */
.builder-card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 12px;

/* After */
.builder-card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 6px;
```

**Step 2: Verify visually**

Run: `npm run dev`
Check: Cards should appear with tighter corners (6px vs 12px)

**Step 3: Commit**

```bash
git add styles/builders.css
git commit -m "style(builders): reduce card border-radius to 6px"
```

---

## Task 2: Tighten Filter Bar

**Files:**
- Modify: `styles/builders.css:145-146`

**Step 1: Update .builders-filters__bar styling**

Reduce border-radius and padding for a more compact feel.

```css
/* Before */
.builders-filters__bar {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
    background: var(--bg-filter);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-card);
}

/* After */
.builders-filters__bar {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
    background: var(--bg-filter);
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 20px;
    box-shadow: var(--shadow-card);
}
```

**Step 2: Verify visually**

Run: `npm run dev` (if not already running)
Check: Filter bar should appear slightly more compact

**Step 3: Commit**

```bash
git add styles/builders.css
git commit -m "style(builders): tighten filter bar padding and radius"
```

---

## Task 3: Update Results Count Language

**Files:**
- Modify: `js/builders/filters.js:116`

**Step 1: Update updateResultsCount function**

Change from "X builders" to "X builders active" for operational language.

```javascript
/* Before */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${count} builder${count !== 1 ? 's' : ''}`;
}

/* After */
export function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${count} builder${count !== 1 ? 's' : ''} active`;
}
```

**Step 2: Verify visually**

Run: `npm run dev` (if not already running)
Check: Results text should now read "X builders active"

**Step 3: Commit**

```bash
git add js/builders/filters.js
git commit -m "copy(builders): update results text to 'X builders active'"
```

---

## Task 4: Update Empty State Language

**Files:**
- Modify: `js/builders/components.js:147-153`

**Step 1: Update renderEmptyState function**

Change to more instructional language per C2UX guidelines.

```javascript
/* Before */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No builders found</h3>
            <p>Try adjusting your search or filters.</p>
        </div>
    `;
}

/* After */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No matching builders</h3>
            <p>Modify filters or clear search to see results.</p>
        </div>
    `;
}
```

**Step 2: Verify visually**

Run: `npm run dev`
Test: Enter a search term that matches nothing
Check: Empty state should show updated text

**Step 3: Commit**

```bash
git add js/builders/components.js
git commit -m "copy(builders): update empty state to instructional language"
```

---

## Task 5: Final Verification & Combined Commit (Optional)

**Step 1: Run build to ensure no errors**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Preview production build**

```bash
npm run preview
```

Navigate to /builders and verify:
- [ ] Cards have 6px border radius
- [ ] Filter bar is slightly more compact
- [ ] Results show "X builders active"
- [ ] Empty state shows "No matching builders" with instructional text

**Step 3: Squash commits if desired (optional)**

If you prefer a single commit for all Phase 1 changes:

```bash
git reset --soft HEAD~4
git commit -m "style(builders): Phase 1 C2UX alignment

- Reduce card border-radius (12px → 6px)
- Tighten filter bar padding (24px → 20px) and radius (12px → 8px)
- Update results text to 'X builders active'
- Update empty state to instructional language"
```

---

## Future Task (Not This PR): CTA Domain Update

The login CTA currently points to `https://app.mergecombinator.com/login`.

When defensebuilders.com is ready, update in `js/builders/components.js:113`:

```javascript
// Future change - when defensebuilders.com is live
<a href="https://defensebuilders.com/login" class="modal-cta-btn modal-cta-btn--primary">
```

**Do not change this now** - leave pointing to mergecombinator.com until DB domain is configured.

---

## Summary

| Change | File | Line(s) | Before | After |
|--------|------|---------|--------|-------|
| Card radius | styles/builders.css | 248 | 12px | 6px |
| Filter bar radius | styles/builders.css | 145 | 12px | 8px |
| Filter bar padding | styles/builders.css | 146 | 24px | 20px |
| Results text | js/builders/filters.js | 116 | "X builders" | "X builders active" |
| Empty state | js/builders/components.js | 147-153 | "No builders found" | "No matching builders" |
