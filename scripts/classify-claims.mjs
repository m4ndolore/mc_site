#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    input: "",
    outJson: "",
    outCsv: "",
    outQueue: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") {
      i += 1;
      if (!argv[i]) throw new Error("--input requires a file path");
      args.input = argv[i];
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
    if (token === "--out-queue") {
      i += 1;
      if (!argv[i]) throw new Error("--out-queue requires a file path");
      args.outQueue = argv[i];
      continue;
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!args.input) throw new Error("Missing --input path.");
  return args;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  return `"${raw.replace(/"/g, "\"\"")}"`;
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
  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((h) => csvEscape(record[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function classifyClaim(text) {
  const lower = text.toLowerCase();
  const scores = { factual: 0, aspirational: 0, opinion: 0 };
  const reasons = [];

  const factualPatterns = [
    /\b\d+\b/,
    /\bq[1-4]\s*20\d{2}\b/i,
    /\bapplications open\b/i,
    /\bprivate beta\b/i,
    /\bindo-pacific\b/i,
    /\bone week\b/i,
    /\bday \d\b/i,
    /\bclassified\b/i,
    /\bdeployed?\b/i,
    /\bfunded\b/i,
    /\brevenue-backed\b/i,
  ];
  if (factualPatterns.some((p) => p.test(text))) {
    scores.factual += 3;
    reasons.push("contains concrete/timebound detail");
  }

  const opinionPatterns = [
    /\bdemands better\b/i,
    /\bmust\b/i,
    /\btransformative\b/i,
    /\bseamlessly\b/i,
    /\bvaluable\b/i,
    /\bbetter\b/i,
    /\baccelerating threats\b/i,
    /\bnew model\b/i,
  ];
  if (opinionPatterns.some((p) => p.test(text))) {
    scores.opinion += 3;
    reasons.push("contains normative/value language");
  }

  const aspirationalPatterns = [
    /\bbuild\b/i,
    /\bcreate\b/i,
    /\bstart\b/i,
    /\bready for\b/i,
    /\bnext-step\b/i,
    /\bcan commit\b/i,
    /\blooking for\b/i,
  ];
  if (aspirationalPatterns.some((p) => p.test(text))) {
    scores.aspirational += 2;
    reasons.push("contains intent/capability language");
  }

  if (/\b(weeks|months|years|days)\b/i.test(text)) {
    scores.factual += 1;
  }
  if (/\b(we|our)\b/.test(lower)) {
    scores.opinion += 1;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let [label, topScore] = ranked[0];
  const secondScore = ranked[1][1];

  if (topScore === 0) {
    label = "opinion";
    topScore = 1;
    reasons.push("defaulted: no strong objective markers");
  }

  if (reasons.length === 0) {
    reasons.push("heuristic fallback");
  }

  const confidenceRaw = 0.55 + Math.min(0.4, (topScore - secondScore) * 0.15);
  const confidence = Number(Math.min(0.95, Math.max(0.5, confidenceRaw)).toFixed(2));

  return { label, confidence, reason: reasons.join("; ") };
}

function reviewPriority(record, confidence) {
  if (record.risk_level === "high" && confidence < 0.8) return "P0";
  if (record.risk_level === "high" || record.materiality === "high") return "P1";
  if (confidence < 0.7) return "P1";
  return "P2";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.input)) {
    throw new Error(`Input not found: ${args.input}`);
  }

  const payload = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const now = new Date().toISOString();
  const records = payload.records.map((record) => {
    const { label, confidence, reason } = classifyClaim(record.claim_text);
    const priorNotes = record.evidence_notes ? `${record.evidence_notes}; ` : "";
    return {
      ...record,
      claim_type: label,
      evidence_notes: `${priorNotes}auto_classification=${label}; confidence=${confidence}; rationale=${reason}`.trim(),
      _auto_confidence: confidence,
      _auto_reason: reason,
    };
  });

  const queue = records
    .map((record) => ({
      id: record.id,
      page_path: record.page_path,
      claim_text: record.claim_text,
      auto_claim_type: record.claim_type,
      auto_confidence: record._auto_confidence,
      risk_level: record.risk_level,
      materiality: record.materiality,
      review_priority: reviewPriority(record, record._auto_confidence),
      needs_human_review: record._auto_confidence < 0.85 || record.risk_level === "high",
      rationale: record._auto_reason,
    }))
    .filter((item) => item.needs_human_review)
    .sort((a, b) => {
      const order = { P0: 0, P1: 1, P2: 2 };
      return order[a.review_priority] - order[b.review_priority];
    });

  const cleanedRecords = records.map(({ _auto_confidence, _auto_reason, ...rest }) => rest);
  const classifiedPayload = {
    ...payload,
    generated_at: now,
    generator: "scripts/classify-claims.mjs",
    records: cleanedRecords,
  };

  const outJson =
    args.outJson ||
    args.input.replace(/\.json$/i, "-classified.json");
  const outCsv =
    args.outCsv ||
    outJson.replace(/\.json$/i, ".csv");
  const outQueue =
    args.outQueue ||
    outJson.replace(/-classified\.json$/i, "-review-queue.json");

  ensureParentDir(outJson);
  ensureParentDir(outCsv);
  ensureParentDir(outQueue);

  fs.writeFileSync(outJson, `${JSON.stringify(classifiedPayload, null, 2)}\n`, "utf8");
  fs.writeFileSync(outCsv, toCsv(cleanedRecords), "utf8");
  fs.writeFileSync(
    outQueue,
    `${JSON.stringify(
      {
        generated_at: now,
        generator: "scripts/classify-claims.mjs",
        source_inventory: args.input,
        total_records: cleanedRecords.length,
        review_items: queue,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const counts = cleanedRecords.reduce((acc, record) => {
    acc[record.claim_type] = (acc[record.claim_type] || 0) + 1;
    return acc;
  }, {});
  console.log(`Classified ${cleanedRecords.length} claims.`);
  Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => console.log(`- ${key}: ${value}`));
  console.log(`JSON:  ${outJson}`);
  console.log(`CSV:   ${outCsv}`);
  console.log(`Queue: ${outQueue} (${queue.length} items)`);
}

main();
