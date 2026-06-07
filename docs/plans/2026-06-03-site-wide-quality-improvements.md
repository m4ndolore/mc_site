# Site-Wide Quality Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix font loading waste, favicon mismatch, missing meta/schema, and inline style sprawl across the site.

**Architecture:** Surgical edits to HTML head sections, a new `site.webmanifest`, CSS class extraction for repeated inline patterns, and build-script updates for builders page.

**Tech Stack:** HTML, CSS, Vite 6 static site, `scripts/optimize-static.mjs` (builders card generator)

---

### Task 1: Remove unused Lora font from 5 pages

These pages load Lora via Google Fonts but never reference `font-serif` or `Lora` in any style:

**Files:**
- Modify: `archive.html:32`
- Modify: `merch.html:31`
- Modify: `privacy.html:36`
- Modify: `security.html:36`
- Modify: `terms.html:36`

**Note:** Do NOT touch `style-guide.html` — it actually uses `var(--font-serif)` on line 337.

**Step 1: Edit each file** — replace the Google Fonts link to remove the Lora family:

**archive.html** line 32 — replace:
```
family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Space+Mono
```
with:
```
family=Space+Mono
```

**merch.html** line 31, **privacy.html** line 36, **security.html** line 36, **terms.html** line 36 — all use the same string. Replace:
```
family=Lora:wght@400;500;600&family=Space+Mono
```
with:
```
family=Space+Mono
```

**Step 2: Verify** — `grep -rn 'Lora' archive.html merch.html privacy.html security.html terms.html` should return zero results.

**Step 3: Commit**
```bash
git add archive.html merch.html privacy.html security.html terms.html
git commit -m "perf: remove unused Lora font from 5 pages"
```

---

### Task 2: Fix favicon 16x16 mismatch

**Files:**
- Modify: `index.html:18`

**Step 1:** Generate a 16x16 favicon from the 32x32 source:
```bash
sips -z 16 16 public/assets/favicon-32.png --out public/assets/favicon-16.png
```

**Step 2:** Edit `index.html` line 18 — change:
```html
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-32.png?v=2">
```
to:
```html
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png?v=2">
```

**Step 3: Commit**
```bash
git add public/assets/favicon-16.png index.html
git commit -m "fix: add proper 16x16 favicon instead of reusing 32x32"
```

---

### Task 3: Add site.webmanifest

**Files:**
- Create: `public/manifest.json`
- Modify: `index.html` (add link tag after line 20, before Open Graph section)

**Step 1:** Create `public/manifest.json`:
```json
{
  "name": "Merge Combinator",
  "short_name": "MC",
  "start_url": "/",
  "display": "browser",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/assets/favicon-32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/assets/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2:** Add manifest link in `index.html` after the apple-touch-icon line (after line 19):
```html
<link rel="manifest" href="/manifest.json">
```

**Step 3: Commit**
```bash
git add public/manifest.json index.html
git commit -m "feat: add web manifest for PWA metadata"
```

---

### Task 4: Add Twitter Card meta to portfolio.html

**Files:**
- Modify: `portfolio.html` (insert after line 16, before `<title>`)

**Step 1:** Add these tags after the og:url line:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Portfolio — Merge Combinator">
<meta name="twitter:description" content="Browse companies selected for in-person operator validation through The Combine program. Cohort 25-1: 83 defense technology companies evaluated in Tulsa, OK.">
<meta name="twitter:image" content="/assets/logowhite.png">
```

**Step 2: Commit**
```bash
git add portfolio.html
git commit -m "seo: add Twitter Card meta tags to portfolio page"
```

---

### Task 5: Add schema.org JSON-LD to key pages

Add lightweight structured data to 5 key pages. Use `WebPage` type with BreadcrumbList.

**Files:**
- Modify: `learn.html` (insert before `<title>`)
- Modify: `briefs.html` (insert before `<title>`)
- Modify: `access.html` (insert before `<title>`)
- Modify: `privacy.html` (insert before `<title>`)
- Modify: `terms.html` (insert before `<title>`)

**Step 1:** Add to each page. Example for `learn.html`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Learn — Merge Combinator",
  "url": "https://mergecombinator.com/learn",
  "isPartOf": { "@type": "WebSite", "name": "Merge Combinator", "url": "https://mergecombinator.com" }
}
</script>
```

Adapt `name` and `url` for each page:
- **briefs.html**: name="Intelligence Briefs — Merge Combinator", url=".../briefs"
- **access.html**: name="Access — Merge Combinator", url=".../access"
- **privacy.html**: name="Privacy Policy — Merge Combinator", url=".../privacy"
- **terms.html**: name="Terms of Service — Merge Combinator", url=".../terms"

**Step 2: Commit**
```bash
git add learn.html briefs.html access.html privacy.html terms.html
git commit -m "seo: add schema.org WebPage structured data to 5 pages"
```

---

### Task 6: Extract builders card inline styles to CSS

The build script `scripts/optimize-static.mjs` injects 4 repeated inline style patterns onto ~83 builder cards. Move these to CSS classes in `styles/builders.css`.

**Files:**
- Modify: `styles/builders.css` (update existing class rules)
- Modify: `scripts/optimize-static.mjs:187-193` (remove inline styles from template)
- Modify: `builders.html` (regenerate or find-replace)

**Step 1:** Update `styles/builders.css` — the existing `.builder-card__logo` rule (line 445) uses `64px` but the inline overrides use `48px`. Update the CSS to match what the inline styles dictate:

Replace `.builder-card__logo` (lines 445-454):
```css
.builder-card__logo {
    width: 48px;
    height: 48px;
    border-radius: 2px;
    object-fit: contain;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(148, 163, 255, 0.12);
    padding: 8px;
    flex-shrink: 0;
}
```

Replace `.builder-card__content` (lines 472-475):
```css
.builder-card__content {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    flex: 1;
    min-width: 0;
}
```

Add rule for `.builder-card` as an anchor (after `.builder-card:focus`):
```css
a.builder-card {
    text-decoration: none;
    color: inherit;
}
```

Replace `.builder-card__tagline` (lines 486-496) — merge the inline override values:
```css
.builder-card__tagline {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
```

**Step 2:** Update `scripts/optimize-static.mjs` — remove inline styles from the template (lines 187-193):

Line 187 — remove the `style="width:48px;..."` from the img tag (keep class, loading, width, height attrs).

Line 190 — remove `style="text-decoration:none;color:inherit;"` from the anchor.

Line 191 — remove `style="${logo ? 'display:flex;gap:14px;align-items:flex-start;' : ''}"` from the content div (or just leave `style=""` for the no-logo case, which already happens).

Line 193 — remove `style="margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary);"` from the tagline div.

**Step 3:** Regenerate builders.html or do a bulk find-replace:
```bash
# Remove all builder-card inline styles from HTML
# 1. Remove style on anchor tags
sed -i '' 's/ style="text-decoration:none;color:inherit;"//g' builders.html
# 2. Remove style on content divs
sed -i '' 's/ style="display:flex;gap:14px;align-items:flex-start;"//g' builders.html
# 3. Remove empty style attrs left behind
sed -i '' 's/ style=""//g' builders.html
# 4. Remove style on logo images
sed -i '' 's/ style="width:48px;height:48px;object-fit:contain;border-radius:2px;background:rgba(15,23,42,.85);border:1px solid rgba(148,163,255,.12);padding:8px;flex-shrink:0;"//g' builders.html
# 5. Remove style on tagline divs
sed -i '' 's/ style="margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary);"//g' builders.html
```

**Step 4:** Verify — `grep -c 'style=' builders.html` should drop from ~320 to under 10.

**Step 5:** Visually test builders page at `http://localhost:5175/builders` — cards should look identical.

**Step 6: Commit**
```bash
git add styles/builders.css scripts/optimize-static.mjs builders.html
git commit -m "refactor: extract builder card inline styles to CSS classes"
```

---

### Task 7: Extract index.html team section inline styles to CSS

**Files:**
- Modify: `styles.css` (add new utility classes at end, before closing comment)
- Modify: `index.html` lines 249-276 (founders strip) and 878-914 (team grid)

**Step 1:** Add to `styles.css`:
```css
/* ── Team / Founder Cards ── */
.founder-strip {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}
.founder-chip {
  display: flex;
  align-items: center;
  gap: 12px;
}
.founder-chip__photo {
  width: 48px;
  height: 48px;
  border-radius: 2px;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.12);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.team-member {
  text-align: center;
}
.team-member__photo {
  width: 100px;
  height: 124px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,.12);
  margin-bottom: 12px;
}
.team-member__name {
  font-size: 16px;
  color: var(--white);
  margin: 0 0 4px;
}
.team-member__role {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin: 0 0 8px;
}
.team-member__bio {
  font-size: 13px;
  color: rgba(255,255,255,.68);
  line-height: 1.5;
  margin: 0;
}
.team-member__social {
  display: inline-block;
  margin-top: 10px;
  color: var(--gray-light);
  transition: color .15s;
}
```

**Step 2:** Update `index.html` founders strip (lines 249-276) — replace inline styles with class names. Example for one founder chip:
```html
<div class="founder-chip">
  <img src="/assets/images/paul-optimized.jpg" alt="Paul Garcia" class="founder-chip__photo" style="object-position: center 14%;">
  <div>
    <div style="font-size: 14px; color: var(--offwhite); font-weight: 500;">Paul Garcia</div>
    <div style="font-size: 12px; color: var(--gray-light);">Founder & Managing Partner</div>
  </div>
</div>
```
Note: The name/title styles in the founders strip are unique (14px/12px) — keep those as inline for now since they're only 3 occurrences and different from the team grid section.

**Step 3:** Update team grid (lines 878-914) — replace inline styles:
- `style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;"` → `class="team-grid"`
- `style="text-align: center;"` → `class="team-member"`
- Image `style="width: 100px; height: 124px; ..."` → `class="team-member__photo"` (keep per-person `object-position` as inline)
- Name `style="font-size: 16px; ..."` → `class="team-member__name"` (use h4)
- Role `style="font-family: var(--font-mono); ..."` → `class="team-member__role"` (use p)
- Bio `style="font-size: 13px; ..."` → `class="team-member__bio"` (use p)
- LinkedIn `style="display: inline-block; ..."` → `class="team-member__social"`

**Step 4:** Visually verify `http://localhost:5175/` — founders strip and team grid should look identical.

**Step 5: Commit**
```bash
git add styles.css index.html
git commit -m "refactor: extract index.html team/founder inline styles to CSS"
```

---

### Task 8: Extract about.html inline styles to CSS

The about page has ~96 inline styles. Focus on the repeated patterns.

**Files:**
- Modify: `about.html` (inline `<style>` block and HTML body)

**Step 1:** Identify and extract these repeated patterns into the existing `<style>` block in about.html:

```css
/* Reusable section label */
.about-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: 8px;
}
.about-section-title {
  font-size: var(--text-h2);
  color: var(--white);
}
.about-subsection-title {
  font-size: 22px;
  color: var(--white);
  margin-bottom: 14px;
}
.about-text {
  color: rgba(255,255,255,.74);
  line-height: 1.65;
  margin-bottom: 12px;
}
.about-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: var(--radius-xl);
  padding: 22px;
}
```

**Step 2:** Replace corresponding inline styles in the HTML body with these class names.

**Step 3:** Visually verify `http://localhost:5175/about`.

**Step 4: Commit**
```bash
git add about.html
git commit -m "refactor: extract about.html repeated inline styles to CSS classes"
```

---

### Task 9: Final verification

**Step 1:** Run `npm run build` — should succeed with no errors.

**Step 2:** Run `npm run preview` and spot-check these pages:
- `/` (founders strip, team grid)
- `/about` (section labels, cards)
- `/builders` (card grid, logos, taglines)
- `/portfolio` (meta check via View Source)
- `/programs/residency` (already done)
- `/privacy`, `/terms` (schema check via View Source)

**Step 3:** Verify font removal — open DevTools Network tab on archive/merch/privacy/security/terms, confirm no Lora font request.

**Step 4: Commit** (if any fixups needed)
