#!/usr/bin/env node
/**
 * promote-signal.mjs — scaffold a /signals article from a markdown draft.
 *
 * Turns an mc-content (or hand-written) markdown draft into:
 *   1. signals/<slug>.html   — from the existing article template
 *   2. a public/data/signals.json entry (prepended; newest first)
 *   3. the vite.config.js input line to add (printed for you to paste)
 *
 * This is a SCAFFOLDER, not an auto-publisher. It gets you 90% of the way;
 * a human finishes the design polish (hero image, lede note, related links)
 * and reviews voice before committing. Nothing is published automatically.
 *
 * Usage:
 *   node scripts/promote-signal.mjs --in <draft.md> [--slug my-slug] [--dry-run]
 *
 * Draft frontmatter (YAML) recognized (all optional except title):
 *   title:        "A Disciplined Case for the A-10"      (required)
 *   slug:         disciplined-case-for-the-a-10          (else derived from title)
 *   subtitle:     "..."   (also used as excerpt/description)
 *   excerpt:      "..."   (overrides subtitle for the feed excerpt)
 *   category:     Analysis                               (default: Analysis)
 *   author:       "Paul Garcia, Founder"                 (default)
 *   date:         2026-06-23                             (default: today via --date)
 *   tags:         [a-10, air force, readiness]
 *   image:        /assets/signals/<file>.jpg             (default: placeholder)
 *   keywords:     "a-10, warthog, ..."                   (default: tags joined)
 *   featured:     true|false                             (default: false)
 *
 * The markdown BODY (everything after frontmatter) becomes the article
 * paragraphs. Plain paragraphs → <p>. Keep it simple; rich layout is added
 * by hand afterward.
 *
 * IMPORTANT: pass --date explicitly (Date.now is intentionally not used so
 * output is deterministic). If omitted, frontmatter `date` is required.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--in') out.in = argv[++i];
    else if (a === '--slug') out.slug = argv[++i];
    else if (a === '--date') out.date = argv[++i];
  }
  return out;
}

function fail(msg) {
  console.error(`[promote-signal] ERROR: ${msg}`);
  process.exit(1);
}

// ── frontmatter + body ───────────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw.trim() };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    // inline array: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    fm[key] = val;
  }
  return { fm, body: m[2].trim() };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Convert the markdown body to article <p> blocks. Channel headers like
// "## LinkedIn" (social drafts) are stripped — promotion is for long-form web,
// so the human is expected to supply/expand prose. Bare paragraphs pass through.
function bodyToParagraphs(body) {
  const blocks = body
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)
    .filter(b => !/^#{1,6}\s/.test(b)); // drop markdown headers (channel markers etc.)
  if (blocks.length === 0) {
    return '        <p>TODO: write the article body. (The source draft had no prose paragraphs — likely a social-only draft.)</p>';
  }
  return blocks.map(b => `        <p>${escHtml(b.replace(/\s+/g, ' '))}</p>`).join('\n\n');
}

function readTime(body) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220)); // ~220 wpm
}

function fmtDate(iso) {
  // iso = YYYY-MM-DD → "Jun 15, 2026" without Date.now/new Date (deterministic)
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ── template ─────────────────────────────────────────────────────────────────
function renderArticle(meta) {
  const tagSpans = meta.tags.map(t => `            <span class="blog-article__tag">${escHtml(t)}</span>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    // FOUC prevention: apply theme before first paint
    (function(){var t=localStorage.getItem('mc-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}if(t==='light'){document.documentElement.classList.add('light-theme','no-transitions');requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('no-transitions')})})}})();
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escHtml(meta.excerpt)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://mergecombinator.com/signals/${meta.slug}">
  <meta name="keywords" content="${escHtml(meta.keywords)}">
  <meta name="author" content="${escHtml(meta.authorName)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escHtml(meta.title)}">
  <meta property="og:description" content="${escHtml(meta.excerpt)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${escHtml(meta.image)}">
  <meta property="og:url" content="https://mergecombinator.com/signals/${meta.slug}">
  <meta property="article:published_time" content="${meta.date}">
  <meta property="article:section" content="${escHtml(meta.category)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(meta.title)} — Merge Combinator">
  <meta name="twitter:description" content="${escHtml(meta.excerpt)}">
  <meta name="twitter:image" content="${escHtml(meta.image)}">

  <title>${escHtml(meta.title)} — Merge Combinator</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Styles -->
  <style>body{opacity:0;background:#0a0a0a}body.page-ready{opacity:1;transition:opacity .15s ease-in}</style>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../styles/light-theme.css">
  <link rel="icon" href="../favicon.ico" type="image/x-icon">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(meta.title)},
    "description": ${JSON.stringify(meta.excerpt)},
    "datePublished": "${meta.date}",
    "author": { "@type": "Person", "name": ${JSON.stringify(meta.authorName)} },
    "publisher": { "@type": "Organization", "name": "Merge Combinator", "url": "https://mergecombinator.com", "logo": { "@type": "ImageObject", "url": "https://mergecombinator.com/assets/logowhite.png" } },
    "url": "https://mergecombinator.com/signals/${meta.slug}",
    "mainEntityOfPage": "https://mergecombinator.com/signals/${meta.slug}",
    "articleSection": ${JSON.stringify(meta.category)}
  }
  </script>
</head>
<body>
  <div id="mc-navbar"></div>

  <!-- Article -->
  <article class="blog-article">
    <header class="blog-article__header">
      <div class="container container--narrow">
        <div class="blog-article__meta">
          <a href="/signals" class="blog-article__back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M3 8L8 3M3 8L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Back to Signals
          </a>
          <div class="blog-article__tags">
${tagSpans}
          </div>
        </div>
        <h1 class="blog-article__title">${escHtml(meta.title)}</h1>
        <p class="blog-article__subtitle">${escHtml(meta.subtitle)}</p>
        <div class="blog-article__byline">
          <span class="blog-article__author">${escHtml(meta.author)}</span>
          <span class="blog-article__divider">&bull;</span>
          <time class="blog-article__date" datetime="${meta.date}">${meta.dateHuman}</time>
          <span class="blog-article__divider">&bull;</span>
          <span class="blog-article__read-time">${meta.readTime} min read</span>
        </div>
      </div>
    </header>

    <!-- TODO(human): add a hero image. Drop the file in /assets/signals/ and set meta image. -->
    <figure class="blog-article__hero-image" style="margin: 0; padding: 0 0 8px;">
      <div class="container container--narrow">
        <img src="${escHtml(meta.image)}" alt="TODO: descriptive alt text" style="width: 100%; border-radius: 4px;">
      </div>
    </figure>

    <div class="blog-article__content">
      <div class="container container--narrow">

${meta.paragraphs}

        <p style="margin-top: 40px;"><em>${escHtml(meta.authorName)} is the founder of <a href="/about">Merge Combinator</a>, a venture studio for national security.</em></p>

        <!-- TODO(human): add Related Articles block (2 links) like other signals. -->

      </div>
    </div>
  </article>

  <!-- Footer (shared) — keep in sync with other /signals articles -->
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="/" class="footer__logo">
            <img src="/assets/logowhite.png" alt="Merge Combinator" class="footer__logo-img">
          </a>
          <p class="footer__tagline">Venture studio for national security.</p>
        </div>
        <div class="footer__links">
          <div class="footer__column">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__list">
              <li><a href="/signals">Signals</a></li>
              <li><a href="/knowledge">Knowledge</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__copyright">&copy; 2026 Merge Combinator. All rights reserved.</p>
        <p class="footer__location">Honolulu &bull; Seattle &bull; Las Vegas</p>
      </div>
    </div>
  </footer>

  <!-- Scripts -->
  <script type="module" src="/js/navbar.js"></script>
  <script type="module" src="../script.js"></script>
</body>
</html>
`;
}

// ── main ─────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
if (!args.in) fail('--in <draft.md> is required');
if (!existsSync(args.in)) fail(`input not found: ${args.in}`);

const raw = readFileSync(args.in, 'utf-8');
const { fm, body } = parseFrontmatter(raw);

const title = fm.title;
if (!title) fail('draft needs a `title` in frontmatter');

const slug = args.slug || fm.slug || slugify(title);
const date = args.date || fm.date;
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  fail('a date is required (frontmatter `date:` or --date YYYY-MM-DD)');
}

const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []);
const subtitle = fm.subtitle || fm.excerpt || '';
const excerpt = fm.excerpt || fm.subtitle || '';
const category = fm.category ? (fm.category[0].toUpperCase() + fm.category.slice(1)) : 'Analysis';
const author = fm.author || 'Paul Garcia, Founder';
const authorName = author.split(',')[0].trim();

const meta = {
  title, slug, subtitle, excerpt, category, author, authorName,
  date,
  dateHuman: fmtDate(date),
  tags: tags.length ? tags : ['defense'],
  image: fm.image || '/assets/signals/PLACEHOLDER.jpg',
  keywords: fm.keywords || [...tags, 'Merge Combinator', authorName].join(', '),
  featured: String(fm.featured) === 'true',
  readTime: readTime(body),
  paragraphs: bodyToParagraphs(body),
};

const html = renderArticle(meta);
const htmlPath = join(ROOT, 'signals', `${slug}.html`);

const signalsPath = join(ROOT, 'public', 'data', 'signals.json');
const signals = JSON.parse(readFileSync(signalsPath, 'utf-8'));
const entry = {
  id: slug,
  title,
  excerpt,
  url: `/signals/${slug}`,
  date,
  category,
  author,
  tags: meta.tags,
  image: meta.image,
  featured: meta.featured,
};
const exists = signals.articles.some(a => a.id === slug);

// vite registration line
const viteKey = `signals-${slug.split('-').slice(0, 2).join('-')}`;
const viteLine = `        '${viteKey}': resolve(__dirname, 'signals/${slug}.html'),`;

console.log(`\n[promote-signal] slug:        ${slug}`);
console.log(`[promote-signal] category:    ${category}`);
console.log(`[promote-signal] read time:   ${meta.readTime} min`);
console.log(`[promote-signal] paragraphs:  ${meta.paragraphs.split('\n\n').length}`);
console.log(`[promote-signal] in signals.json already? ${exists ? 'YES (will not duplicate)' : 'no'}`);

if (args.dryRun) {
  console.log('\n--- DRY RUN: nothing written ---');
  console.log(`Would write: signals/${slug}.html`);
  console.log(`Would ${exists ? 'SKIP (dup)' : 'prepend'} signals.json entry`);
  console.log(`Add to vite.config.js rollupOptions.input:\n${viteLine}`);
  process.exit(0);
}

if (existsSync(htmlPath)) fail(`signals/${slug}.html already exists — refusing to overwrite`);
writeFileSync(htmlPath, html);
console.log(`\n✓ wrote signals/${slug}.html`);

if (!exists) {
  signals.articles.unshift(entry); // newest first
  writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');
  console.log('✓ prepended entry to public/data/signals.json');
}

console.log('\n── FINISH BY HAND (the scaffolder did the skeleton) ──');
console.log(`1. Add to vite.config.js rollupOptions.input:\n   ${viteLine}`);
console.log('2. Add the hero image to /assets/signals/ and set image path (html + signals.json).');
console.log('3. Review/expand the body prose — social drafts are short; web wants long-form.');
console.log('4. Add a lede-note + Related Articles block to match sibling signals.');
console.log('5. Voice check against assets/branding/voice-profile.md, then npm run build && npm run lint.');
