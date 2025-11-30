# Typography Standards - SigmaBlox Ghost Theme

## Overview

The SigmaBlox platform uses a professional, enterprise-grade typography system designed to convey credibility and precision appropriate for a defense technology platform. The aesthetic goal is **Nike × Anduril** — clean, confident, and serious without being corporate or stodgy.

## Core Principles

1. **Professional, Not Playful**: Typography should feel enterprise-grade, not consumer-facing
2. **Information Density**: Allow users to scan and consume information efficiently
3. **Clear Hierarchy**: Obvious visual distinction between primary, secondary, and tertiary information
4. **Consistent Scaling**: Use a defined type scale, not arbitrary sizes
5. **Responsive**: Typography adapts appropriately across device sizes

---

## Typography Scale

### Base Unit
- **Base font size**: `1rem` (16px)
- **System**: Use relative units (rem) for scalability
- **Font family**: Inter (primary), with system fallbacks

### Type Scale (Professionally Sized)

```css
:root {
  /* Body text */
  --font-size-xs: 0.75rem;     /* 12px - Labels, captions */
  --font-size-sm: 0.875rem;    /* 14px - Secondary UI text */
  --font-size-base: 1rem;      /* 16px - Body text, navigation */
  --font-size-md: 1.125rem;    /* 18px - Emphasized body */

  /* Headings */
  --font-size-lg: 1.2rem;      /* 19.2px - Section headings (h3) */
  --font-size-xl: 1.5rem;      /* 24px - Subsection headings (h2) */
  --font-size-2xl: 2rem;       /* 32px - Page titles (h1) */
  --font-size-3xl: 2.5rem;     /* 40px - Hero headlines (special cases only) */
}
```

---

## Component-Specific Typography

### Navigation
```css
/* Main navigation links */
.gh-head-menu, .gh-head-link {
  font-size: 1rem;              /* NEVER larger than body text */
  font-weight: 500;
}

/* Account/action buttons */
.sb-nav-account a, .sb-nav-account button {
  font-size: 0.95rem;           /* Slightly smaller, subdued */
  font-weight: 500;
}
```

**Principle**: Navigation should be readable but not draw attention away from content.

---

### Homepage Hero
```css
/* Hero title */
.video-title {
  font-size: 2.5rem;            /* 40px - Confident without being cartoonish */
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* Hero tagline */
.video-tagline {
  font-size: 1.1rem;            /* 17.6px - Supporting copy, not headline */
  font-weight: 300;
}

/* Cover description (search area) */
.is-home .cover-description {
  font-size: 0.95rem;           /* 15.2px - Descriptive text */
  font-weight: 600;
}
```

**Principle**: Hero should command attention without overwhelming. Supporting text steps down appropriately.

---

### Blog Posts & Content
```css
/* Post titles in feed */
.post-title {
  font-size: 1.8rem;            /* 28.8px - Clear but not excessive */
  font-weight: 700;
  line-height: 1.2;
}

/* Post metadata (author, date) */
.post-meta {
  font-size: 0.9rem;            /* 14.4px - Small and unobtrusive */
  color: var(--secondary-text-color);
}

/* Topic section titles */
.topic-name a {
  font-size: 1.2rem;            /* 19.2px - Section heading level */
  font-weight: 700;
}
```

**Principle**: Content hierarchy should be immediately apparent at a glance.

---

### Company Modal
```css
/* Modal title (company name) */
.modal-title h2 {
  font-size: 2rem;              /* 32px - Main modal heading */
}

/* Product name (subtitle) */
.modal-title .product-name {
  font-size: 0.95rem;           /* 15.2px - Supporting label */
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* Section headings within modal */
.modal-section h3 {
  font-size: 1.2rem;            /* 19.2px - Subsection divider */
}

/* Body text in modal */
.modal-section p {
  font-size: 1rem;              /* 16px - Standard readability */
  line-height: 1.8;
}

/* Field labels (two-column grids) */
.modal-field-label {
  font-size: 0.9rem;            /* 14.4px - Form labels */
  font-weight: 600;
}

/* Field values */
.modal-field-value {
  font-size: 1.1rem;            /* 17.6px - Data display */
  font-weight: 600;
}

/* Synopsis blocks (colored cards) */
.synopsis-block p {
  font-size: 1rem;              /* 16px - Readable summary text */
  line-height: 1.5;
}
```

**Principle**: Modal typography creates clear hierarchy while maximizing information density.

---

## Responsive Typography

### Desktop (1024px+)
- Use base scale as defined
- Allow generous spacing
- Optimize for scanning

### Tablet (768px-1024px)
- Reduce heading sizes by 10-15%
- Maintain readability
- Ensure touch targets remain accessible

### Mobile (< 768px)
```css
@media (max-width: 768px) {
  .video-title {
    font-size: 2rem !important;       /* Reduce hero */
  }

  .video-tagline {
    font-size: 1rem !important;       /* Scale down tagline */
  }

  .post-title {
    font-size: 1.5rem;                /* Smaller post titles */
  }
}
```

**Principle**: Mobile typography should be proportionally smaller to prevent overwhelming small screens.

---

## Typography Utilities

### Fluid Scaling with clamp()
For future-proof responsive typography:

```css
h1 {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
}

h2 {
  font-size: clamp(1.4rem, 4vw, 2rem);
}

h3 {
  font-size: clamp(1.2rem, 3vw, 1.6rem);
}
```

### Common Text Utilities
```css
.text-nav {
  font-size: 1rem;
  font-weight: 500;
}

.text-meta {
  font-size: 0.9rem;
  color: var(--color-muted);
}

.text-heading {
  font-size: 1.2rem;
  font-weight: 600;
}

.text-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## What NOT To Do

### ❌ Oversized Typography
```css
/* NEVER do this */
.nav-link { font-size: 1.5rem; }      /* Navigation too large */
.hero-title { font-size: 4rem; }      /* Hero feels cartoonish */
.metadata { font-size: 1.5rem; }      /* Metadata competing with content */
```

### ❌ Inconsistent Scaling
```css
/* AVOID arbitrary sizes */
.heading-1 { font-size: 2.3rem; }     /* Use 2rem or 2.5rem from scale */
.heading-2 { font-size: 1.7rem; }     /* Use 1.5rem or 2rem from scale */
```

### ❌ Mixing Units Without Reason
```css
/* AVOID mixing px and rem arbitrarily */
.component-a { font-size: 20px; }     /* Use rem for scalability */
.component-b { font-size: 1.4rem; }   /* Good */
```

---

## Testing Checklist

When implementing or reviewing typography:

- [ ] All navigation text is 1rem or smaller
- [ ] Hero headlines are 2.5rem or smaller (never 4rem+)
- [ ] Section headings (h3) are 1.2rem
- [ ] Page headings (h2) are 1.5-2rem
- [ ] Body text is 1rem with 1.5-1.8 line-height
- [ ] Metadata/labels are 0.9rem or smaller
- [ ] Modal titles are 2rem or smaller
- [ ] Type scale is consistent (not arbitrary sizes)
- [ ] Responsive scaling works on mobile
- [ ] Overall aesthetic feels professional, not playful

---

## Key Files

Typography is defined across these files:
- `assets/css/typography.css` - Base typography system
- `assets/css/site/header.css` - Navigation typography
- `assets/css/sticky-nav.css` - Hero, cover, nav account buttons
- `assets/css/company-modal.css` - Modal component typography
- `assets/css/blog/post.css` - Blog post typography
- `assets/css/site/cover.css` - Cover/hero typography

---

## Before & After Comparison

### Before (Oversized, Cartoonish)
- Navigation: 1.5rem (24px) ❌
- Hero title: 4rem (64px) ❌
- Section headings: 2rem (32px) ❌
- Modal title: 2.8rem (44.8px) ❌
- Body text: 1.5rem (24px) ❌
- Metadata: 1.5rem (24px) ❌

**Result**: Felt consumer-app-like, excessive, crowded

### After (Professional, Enterprise-Grade)
- Navigation: 1rem (16px) ✅
- Hero title: 2.5rem (40px) ✅
- Section headings: 1.2rem (19.2px) ✅
- Modal title: 2rem (32px) ✅
- Body text: 1rem (16px) ✅
- Metadata: 0.9rem (14.4px) ✅

**Result**: Professional, crisp, efficient information density

---

## Maintenance

When adding new components:
1. Use the defined type scale (don't invent new sizes)
2. Follow hierarchy: headings > body > metadata
3. Test responsive behavior on mobile
4. Compare against existing components for consistency
5. Run typography review agent for validation

---

## Reference: Nike × Anduril Aesthetic

**What this means**:
- **Nike**: Confident, bold headlines that don't shout
- **Anduril**: Technical precision, clean lines, no decoration
- **Combined**: Professional without being corporate, serious without being boring

**Typography choices that support this**:
- Inter font family (modern, geometric, technical)
- Moderate font weights (500-700, not ultra-bold)
- Tight letter-spacing on headings (-0.02em to -0.01em)
- Generous line-height on body (1.5-1.8)
- Consistent use of uppercase labels with increased letter-spacing
- Subdued metadata (small, gray)

---

**Last Updated**: 2025-01-24
**Version**: 2.0 (Professional Refinement)
