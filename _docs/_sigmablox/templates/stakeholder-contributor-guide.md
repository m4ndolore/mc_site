# Stakeholder Update Template — Contributor Guide

Welcome! This guide walks you through creating a stakeholder update post in Ghost. Most of it uses Ghost's built-in tools—you'll only need to copy/paste a few small HTML blocks for the fancy stuff.

---

## Step 1: Author Card with Social Links

Click the **+** button → select **HTML** → paste this code:

```html
<div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #f9fafb; border-radius: 12px; margin-bottom: 32px;">
  <img src="YOUR-PHOTO-URL" alt="Your Name" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover;">
  <div style="flex: 1;">
    <h4 style="margin: 0 0 4px 0; font-size: 18px;">Your Name</h4>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Title · Your Company</p>
  </div>
  <div style="display: flex; gap: 12px;">
    <a href="https://linkedin.com/in/USERNAME" target="_blank" title="LinkedIn" style="color: #0A66C2;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
    <a href="https://twitter.com/USERNAME" target="_blank" title="X" style="color: #000;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
    <a href="https://github.com/USERNAME" target="_blank" title="GitHub" style="color: #333;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    </a>
    <a href="mailto:you@example.com" title="Email" style="color: #6b7280;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
    </a>
  </div>
</div>
```

**Edit these values:**
- `YOUR-PHOTO-URL` — Link to your headshot
- `Your Name` / `Your Title · Your Company`
- `USERNAME` in each social link (or delete icons you don't need)
- `you@example.com`

---

## Step 2: One-Liner Pitch

Click **+** → select **Quote**

Type your biggest win in one sentence. Example:

> We cut mission planning time from 4 hours to 20 minutes for three PACAF squadrons.

---

## Step 3: Hero Image

Click **+** → select **Image**

Upload or drag your hero image. Add a caption below it:

*Team demoing the new mission planning UI during AFRL visit.*

---

## Step 4: Divider

Click **+** → select **Divider**

---

## Step 5: Problem We're Solving

Click **+** → select **Heading** (H2)

Type: `Problem We're Solving`

Then just type regular paragraphs:

**Stakeholder:** [Who is the customer?]

**Mission Gap:** [What operational gap are they experiencing?]

**Why Now:** [Why is it urgent?]

---

## Step 6: Our Solution

Click **+** → select **Heading** (H2)

Type: `Our Solution`

Use Ghost's **bulleted list** (or just paragraphs):

- **Capability Shipped:** [What you delivered this cycle]
- **Impact:** [How it improves speed, accuracy, or readiness]
- **Proof Point:** [Pilot data, quote, or adoption metric]

---

## Step 7: Customer Quote (Optional)

Click **+** → select **HTML** → paste:

```html
<div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 24px 32px; border-radius: 12px; margin: 24px 0;">
  <p style="font-size: 1.1em; font-style: italic; margin: 0 0 12px 0;">
    "This changed how we run operations."
  </p>
  <p style="margin: 0; font-size: 14px; opacity: 0.9;">
    — Jane Doe, Ops Lead, 15th Wing
  </p>
</div>
```

**Edit:** The quote text, name, title, and organization.

---

## Step 8: About Us

Click **+** → select **Heading** (H2)

Type: `About Us`

Write 2-3 paragraphs covering:
- What differentiates your team
- Relevant partnerships or certifications
- Team size / open roles (if applicable)

Optionally add another **Image** card for a team photo.

---

## Step 9: Call to Action

Click **+** → select **HTML** → paste:

```html
<div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 32px; text-align: center; margin: 40px 0;">
  <h3 style="margin: 0 0 12px 0; color: #1e40af;">Ready to Learn More?</h3>
  <p style="margin: 0 0 20px 0; color: #374151;">Schedule a briefing or connect us with your program office.</p>
  <a href="https://your-booking-link.com" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
    Schedule a Briefing →
  </a>
  <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
    Or email us: <a href="mailto:contact@sigmablox.com" style="color: #2563eb;">contact@sigmablox.com</a>
  </p>
</div>
```

**Edit:**
- The CTA text and description
- `https://your-booking-link.com`
- Email address

---

## Step 10: Post Settings (Sidebar)

Before publishing, set these in Ghost's right sidebar:

- **Post URL:** `/updates/your-slug`
- **Feature Image:** Upload hero image again (shows in previews/cards)
- **Excerpt:** Paste your one-liner pitch
- **Tags:** `stakeholder-update`, `2025`, etc.

---

## Quick Reference: Ghost Native Components Used

| Section | Ghost Component |
|---------|-----------------|
| One-liner pitch | Quote |
| Hero image | Image |
| Section break | Divider |
| Section headers | Heading (H2) |
| Solution bullets | Bulleted List |
| Team photo | Image |

## HTML Blocks (Copy/Paste)

| Section | Why HTML? |
|---------|-----------|
| Author Card | Social icons + custom layout |
| Customer Quote | Styled gradient background |
| CTA Box | Button styling + branded colors |

---

## Checklist Before Publishing

- [ ] Author card: photo, name, title, social links
- [ ] One-liner pitch filled in
- [ ] Hero image uploaded with caption
- [ ] Problem section complete
- [ ] Solution with proof points
- [ ] CTA links working
- [ ] Feature image set in sidebar
- [ ] Preview on mobile

---

*Questions? Reach out to the SigmaBlox team.*