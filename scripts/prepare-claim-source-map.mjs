#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    input: "",
    outCsv: "",
    outJson: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") {
      i += 1;
      args.input = argv[i] || "";
      continue;
    }
    if (token === "--out-csv") {
      i += 1;
      args.outCsv = argv[i] || "";
      continue;
    }
    if (token === "--out-json") {
      i += 1;
      args.outJson = argv[i] || "";
      continue;
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!args.input) throw new Error("Missing required --input");
  return args;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function csvEscape(value) {
  const v = value ?? "";
  return `"${String(v).replace(/"/g, "\"\"")}"`;
}

function sourcePlanFor(record) {
  const isHigh = record.risk_level === "high" || record.materiality === "high";
  if (record.claim_type === "factual") {
    return {
      priority: isHigh ? "P0" : "P1",
      source_requirement: "required",
      proposed_source_type: isHigh ? "public-evidence+owner-attestation" : "owner-attestation",
      verification_status: "needs-source",
      source_owner: "content-ops",
      evidence_notes: "",
    };
  }
  if (record.claim_type === "aspirational") {
    return {
      priority: isHigh ? "P1" : "P2",
      source_requirement: "optional",
      proposed_source_type: "positioning-review",
      verification_status: "needs-editorial-review",
      source_owner: "content",
      evidence_notes: "",
    };
  }
  return {
    priority: isHigh ? "P1" : "P2",
    source_requirement: "optional",
    proposed_source_type: "opinion-review",
    verification_status: "needs-editorial-review",
    source_owner: "content",
    evidence_notes: "",
  };
}

function buildRows(records) {
  return records.map((record) => {
    const plan = sourcePlanFor(record);
    return {
      claim_id: record.id,
      page_path: record.page_path,
      claim_text: record.claim_text,
      claim_type: record.claim_type,
      risk_level: record.risk_level,
      materiality: record.materiality,
      priority: plan.priority,
      source_requirement: plan.source_requirement,
      proposed_source_type: plan.proposed_source_type,
      source_reference: "",
      source_owner: plan.source_owner,
      verification_status: plan.verification_status,
      verification_method: "",
      last_verified: "",
      next_review_date: "",
      evidence_notes: plan.evidence_notes,
    };
  });
}

function toCsv(rows) {
  const headers = [
    "claim_id",
    "page_path",
    "claim_text",
    "claim_type",
    "risk_level",
    "materiality",
    "priority",
    "source_requirement",
    "proposed_source_type",
    "source_reference",
    "source_owner",
    "verification_status",
    "verification_method",
    "last_verified",
    "next_review_date",
    "evidence_notes",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function defaultDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPayload = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const rows = buildRows(inputPayload.records || []);

  const stamp = defaultDateStamp();
  const outCsv = args.outCsv || `docs/content/claims/claims-source-map-${stamp}.csv`;
  const outJson = args.outJson || `docs/content/claims/claims-source-map-${stamp}.json`;

  ensureDir(outCsv);
  ensureDir(outJson);

  const outputJson = {
    generated_at: new Date().toISOString(),
    generator: "scripts/prepare-claim-source-map.mjs",
    source_inventory: args.input,
    total_rows: rows.length,
    rows,
  };

  fs.writeFileSync(outCsv, toCsv(rows), "utf8");
  fs.writeFileSync(outJson, `${JSON.stringify(outputJson, null, 2)}\n`, "utf8");

  const p0 = rows.filter((row) => row.priority === "P0").length;
  const p1 = rows.filter((row) => row.priority === "P1").length;
  const p2 = rows.filter((row) => row.priority === "P2").length;

  console.log(`Wrote ${rows.length} source-map rows.`);
  console.log(`CSV:  ${outCsv}`);
  console.log(`JSON: ${outJson}`);
  console.log(`Priority split: P0=${p0}, P1=${p1}, P2=${p2}`);
}

main();
