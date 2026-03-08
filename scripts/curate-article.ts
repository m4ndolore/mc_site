#!/usr/bin/env npx tsx
/**
 * Article Curation CLI — converts a URL into a branded MC intel JSON entry.
 *
 * Usage:
 *   npx tsx scripts/curate-article.ts <url>
 *   npx tsx scripts/curate-article.ts --write <url>
 *
 * Without --write: prints JSON entry to stdout.
 * With --write: appends the entry to public/data/intel.json.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const INTEL_JSON_PATH = resolve(
  import.meta.dirname ?? ".",
  "../public/data/intel.json"
);

// Source detection from URL domain
const DOMAIN_SOURCE_MAP: Record<string, string> = {
  "govbase.com": "govbase",
  "executivegov.com": "executivegov",
  "breakingdefense.com": "breakingdefense",
  "defenseone.com": "defenseone",
  "news.ycombinator.com": "hackernews",
  "irregulars.io": "irregulars",
};

function detectSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return DOMAIN_SOURCE_MAP[hostname] ?? "curated";
  } catch {
    return "curated";
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function extractMeta(
  html: string,
  property: string
): string {
  // Try property="..." then name="..."
  const propRe = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(propRe);
  if (match) return match[1].trim();

  // Reversed attribute order: content before property
  const revRe = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const rev = html.match(revRe);
  return rev?.[1]?.trim() ?? "";
}

function extractTitle(html: string): string {
  return (
    extractMeta(html, "og:title") ||
    extractMeta(html, "twitter:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    ""
  );
}

function extractDescription(html: string): string {
  return (
    extractMeta(html, "og:description") ||
    extractMeta(html, "description") ||
    extractMeta(html, "twitter:description") ||
    html
      .match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 300) ||
    ""
  );
}

function extractDate(html: string): string {
  const isoDate =
    extractMeta(html, "article:published_time") ||
    extractMeta(html, "datePublished") ||
    extractMeta(html, "date");

  if (isoDate) {
    try {
      return new Date(isoDate).toISOString().split("T")[0];
    } catch {
      // fall through
    }
  }

  // Fallback: today's date
  return new Date().toISOString().split("T")[0];
}

function extractTags(html: string, source: string): string[] {
  const tags: string[] = [];

  // From meta keywords
  const keywords = extractMeta(html, "keywords");
  if (keywords) {
    keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 4)
      .forEach((k) => tags.push(k));
  }

  // GovBase-specific: look for policy tags
  if (source === "govbase") {
    const tagRe = /class="[^"]*tag[^"]*"[^>]*>([^<]+)</gi;
    let m;
    while ((m = tagRe.exec(html)) !== null && tags.length < 5) {
      const t = m[1].trim();
      if (t && !tags.includes(t)) tags.push(t);
    }
  }

  // Fallback: empty tags are fine
  return tags.slice(0, 5);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Domains that need browser rendering (JS SPAs, aggressive rate limiting)
const JS_HEAVY_DOMAINS = ["govbase.com"];
const STAGEHAND_URL =
  process.env.STAGEHAND_URL ?? "https://mc-stagehand-tests.defensebuilders.workers.dev";

async function curateViaBrowser(
  url: string
): Promise<Record<string, unknown>> {
  console.error(`Using Stagehand browser scraper for ${url}...`);
  const scrapeRes = await fetch(
    `${STAGEHAND_URL}/scrape?url=${encodeURIComponent(url)}&extract=metadata`
  );
  if (!scrapeRes.ok) {
    throw new Error(`Stagehand scrape failed: ${scrapeRes.status} ${scrapeRes.statusText}`);
  }
  const result = (await scrapeRes.json()) as {
    ok: boolean;
    data: {
      title?: string;
      description?: string;
      date?: string;
      tags?: string[];
      policyTags?: string[];
    };
    error?: string;
  };
  if (!result.ok) {
    throw new Error(`Stagehand scrape error: ${result.error ?? "unknown"}`);
  }

  const d = result.data;
  const source = detectSource(url);
  const title = decodeEntities(String(d.title ?? ""));
  const excerpt = decodeEntities(String(d.description ?? "")).slice(0, 300);
  const rawDate = d.date ? String(d.date) : "";
  let date: string;
  try {
    date = rawDate ? new Date(rawDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  } catch {
    date = new Date().toISOString().split("T")[0];
  }
  const tags = ((d.policyTags?.length ? d.policyTags : d.tags) ?? []).slice(0, 5);
  const id = `${source}-${slugify(title)}`;

  return { id, source, title, excerpt, url, date, tags, priority: "normal" };
}

async function curateViaFetch(
  url: string
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "MergeCombinator-Curator/1.0 (https://mergecombinator.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const source = detectSource(url);
  const title = decodeEntities(extractTitle(html));
  const excerpt = decodeEntities(extractDescription(html)).slice(0, 300);
  const date = extractDate(html);
  const tags = extractTags(html, source);
  const id = `${source}-${slugify(title)}`;

  return { id, source, title, excerpt, url, date, tags, priority: "normal" };
}

async function curateArticle(
  url: string
): Promise<Record<string, unknown>> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const needsBrowser = JS_HEAVY_DOMAINS.some((d) => hostname.endsWith(d));

  if (needsBrowser) {
    return curateViaBrowser(url);
  }
  return curateViaFetch(url);
}

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const url = args.find((a) => !a.startsWith("--"));

  if (!url) {
    console.error("Usage: npx tsx scripts/curate-article.ts [--write] <url>");
    process.exit(1);
  }

  try {
    new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  const entry = await curateArticle(url);

  if (!writeMode) {
    console.log(JSON.stringify(entry, null, 2));
    return;
  }

  // Append to intel.json
  const raw = readFileSync(INTEL_JSON_PATH, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.articles)) {
    console.error("intel.json does not have an articles array");
    process.exit(1);
  }

  // Check for duplicate
  if (data.articles.some((a: Record<string, unknown>) => a.url === url)) {
    console.error(`Article with URL ${url} already exists in intel.json`);
    process.exit(1);
  }

  data.articles.push(entry);
  writeFileSync(INTEL_JSON_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Added to intel.json: ${entry.title}`);
  console.log(JSON.stringify(entry, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
