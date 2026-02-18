#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_OWNER = "content-ops";
const DEFAULT_REVIEW_INTERVAL_DAYS = 30;
const SCHEMA_VERSION = "1.0.0";

function parseArgs(argv) {
  const args = {
    inputs: [],
    outJson: "",
    outCsv: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") {
      i += 1;
      if (!argv[i]) throw new Error("--input requires a file path");
      args.inputs.push(argv[i]);
      continue;
    }
    if (token === "--out-json") {
      i += 1;
      if (!argv[i]) throw new Error("--out-json requires a file path");
      args.outJson = argv[i];
      continue;
    }
    if (token === "--out-csv") {
      i += 1;
      if (!argv[i]) throw new Error("--out-csv requires a file path");
      args.outCsv = argv[i];
      continue;
    }
    if (token.startsWith("--")) {
      throw new Error(`Unknown option: ${token}`);
    }
    args.inputs.push(token);
  }

  if (args.inputs.length === 0) {
    throw new Error("Provide at least one input file.");
  }

  return args;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function toPagePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.slice(0, -"index.html".length)}`.replace(/\/+$/, "/");
  }
  if (normalized.endsWith(".html")) {
    return `/${normalized.slice(0, -".html".length)}`;
  }
  return `/${normalized}`;
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripNestedMarkup(html) {
  return html.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(input) {
  return input.replace(/\s+/g, " ").trim();
}

function stripNonContentBlocks(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<header\b[\s\S]*?<\/header>/gi, "");
}

function materialityForTag(tag) {
  if (tag === "h1" || tag === "h2") return "high";
  if (tag === "h3" || tag === "blockquote") return "medium";
  return "low";
}

function riskLevelFromText(text) {
  const highRiskPatterns = [
    /\b\d+\b/,
    /\b(proven|trusted|validated|deployed|classified)\b/i,
    /\b(in weeks|in days|under .* months|not years)\b/i,
    /\b(best|first|most|only|guaranteed)\b/i,
  ];
  const mediumRiskPatterns = [
    /\b(indo-pacific|mission owners|operators)\b/i,
    /\b(open|applications|cohort)\b/i,
  ];

  if (highRiskPatterns.some((pattern) => pattern.test(text))) return "high";
  if (mediumRiskPatterns.some((pattern) => pattern.test(text))) return "medium";
  return "low";
}

function shouldKeepClaim(text) {
  if (text.length < 30) return false;
  if (text.split(" ").length < 6) return false;

  const ctaOnlyPatterns = [
    /^apply (now|today)/i,
    /^join defense builders/i,
    /^learn more/i,
    /^sign in/i,
    /^back to /i,
  ];
  if (ctaOnlyPatterns.some((pattern) => pattern.test(text))) return false;

  return true;
}

function extractSelectorHint(tag, rawAttrs, tagCount) {
  const idMatch = rawAttrs.match(/\sid=["']([^"']+)["']/i);
  const classMatch = rawAttrs.match(/\sclass=["']([^"']+)["']/i);

  let selector = tag;
  if (idMatch?.[1]) selector += `#${idMatch[1]}`;
  if (classMatch?.[1]) {
    const classes = classMatch[1]
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((cls) => `.${cls}`)
      .join("");
    selector += classes;
  }
  selector += `:nth(${tagCount})`;
  return selector;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function extractClaimsFromFile(filePath) {
  const pagePath = toPagePath(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const cleaned = stripNonContentBlocks(raw);
  const tagPattern = /<(h1|h2|h3|p|li|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  const claims = [];
  const seenText = new Set();
  const tagCounters = new Map();
  let match;

  while ((match = tagPattern.exec(cleaned)) !== null) {
    const [fullMatch, tag, attrs, innerHtml] = match;
    const contentIndex = match.index;
    const tagCount = (tagCounters.get(tag) || 0) + 1;
    tagCounters.set(tag, tagCount);

    const text = normalizeWhitespace(decodeHtmlEntities(stripNestedMarkup(innerHtml)));
    if (!shouldKeepClaim(text)) continue;
    if (seenText.has(text)) continue;
    seenText.add(text);

    claims.push({
      pagePath,
      sourceFile: filePath,
      selectorHint: extractSelectorHint(tag, attrs, tagCount),
      line: lineNumberAt(cleaned, contentIndex),
      claimText: text,
      claimType: "unclassified",
      materiality: materialityForTag(tag),
      riskLevel: riskLevelFromText(text),
      sourceStatus: "unsourced",
      sourceReference: null,
      status: "open",
      owner: DEFAULT_OWNER,
      lastReviewed: null,
      reviewIntervalDays: DEFAULT_REVIEW_INTERVAL_DAYS,
      evidenceNotes: "",
      _sourceOrderKey: `${filePath}:${contentIndex}:${fullMatch.length}`,
    });
  }

  claims.sort((a, b) => a._sourceOrderKey.localeCompare(b._sourceOrderKey));
  return claims;
}

function assignIds(recordsByPage) {
  const output = [];
  for (const [pagePath, records] of recordsByPage.entries()) {
    const pageSlug = slugify(pagePath === "/" ? "home" : pagePath);
    records.forEach((record, idx) => {
      output.push({
        id: `CLAIM-${pageSlug}-${String(idx + 1).padStart(3, "0")}`,
        page_path: record.pagePath,
        source_file: record.sourceFile,
        selector_hint: record.selectorHint,
        line: record.line,
        claim_text: record.claimText,
        claim_type: record.claimType,
        materiality: record.materiality,
        risk_level: record.riskLevel,
        source_status: record.sourceStatus,
        source_reference: record.sourceReference,
        status: record.status,
        owner: record.owner,
        last_reviewed: record.lastReviewed,
        review_interval_days: record.reviewIntervalDays,
        evidence_notes: record.evidenceNotes,
      });
    });
  }
  return output;
}

function toCsv(records) {
  const headers = [
    "id",
    "page_path",
    "source_file",
    "selector_hint",
    "line",
    "claim_text",
    "claim_type",
    "materiality",
    "risk_level",
    "source_status",
    "source_reference",
    "status",
    "owner",
    "last_reviewed",
    "review_interval_days",
    "evidence_notes",
  ];
  const rows = [headers.join(",")];
  for (const record of records) {
    const row = headers.map((key) => {
      const value = record[key] ?? "";
      const encoded = String(value).replace(/"/g, "\"\"");
      return `"${encoded}"`;
    });
    rows.push(row.join(","));
  }
  return `${rows.join("\n")}\n`;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function defaultOutputPath(ext) {
  const now = new Date().toISOString().slice(0, 10);
  return path.join("docs", "content", "claims", `claims-inventory-${now}.${ext}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputFiles = [...new Set(args.inputs)];

  const missing = inputFiles.filter((file) => !fs.existsSync(file));
  if (missing.length > 0) {
    throw new Error(`Input files not found: ${missing.join(", ")}`);
  }

  const recordsByPage = new Map();
  for (const filePath of inputFiles) {
    const extracted = extractClaimsFromFile(filePath);
    const pagePath = toPagePath(filePath);
    recordsByPage.set(pagePath, extracted);
  }

  const records = assignIds(recordsByPage);
  const payload = {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    generator: "scripts/extract-claims.mjs",
    records,
  };

  const outJson = args.outJson || defaultOutputPath("json");
  const outCsv = args.outCsv || defaultOutputPath("csv");
  ensureParentDir(outJson);
  ensureParentDir(outCsv);

  fs.writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(outCsv, toCsv(records), "utf8");

  const summary = {};
  for (const record of records) {
    summary[record.page_path] = (summary[record.page_path] || 0) + 1;
  }

  console.log(`Wrote ${records.length} records.`);
  console.log(`JSON: ${outJson}`);
  console.log(`CSV:  ${outCsv}`);
  console.log("Counts by page:");
  Object.entries(summary)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([page, count]) => {
      console.log(`- ${page}: ${count}`);
    });
}

main();
