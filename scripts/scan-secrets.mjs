#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EXCLUDED_PATH_FRAGMENTS = [
  "node_modules/",
  "dist/",
  ".git/",
  ".playwright-mcp/",
  "framer_site_content/",
];

const EXCLUDED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mov",
  ".mp3",
  ".tsbuildinfo",
]);

const RULES = [
  {
    id: "private_key_block",
    regex: /-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----/g,
  },
  {
    id: "github_pat",
    regex: /github_pat_[A-Za-z0-9_]{20,}/g,
  },
  {
    id: "github_token",
    regex: /\bghp_[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "openai_like_key",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "aws_access_key",
    regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "literal_secret_assignment",
    regex:
      /\b(?:TOKEN|SECRET|API_KEY|PASSWORD|PASSWD|AUTHENTIK_ADMIN_TOKEN|CLOUDFLARE_API_TOKEN)\b\s*[:=]\s*["'][^"'$\n]{16,}["']/g,
  },
  {
    id: "literal_bearer_token",
    regex: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/g,
  },
];

const ALLOWLIST_PATTERNS = [
  /\$AUTHENTIK_ADMIN_TOKEN/,
  /export TOKEN="\$AUTHENTIK_ADMIN_TOKEN"/,
  /TOKEN="\$AUTHENTIK_ADMIN_TOKEN"/,
  /your-api-key/i,
  /example/i,
  /placeholder/i,
  /dummy/i,
];

function isLikelyBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let nonPrintable = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13) continue;
    if (byte >= 32 && byte <= 126) continue;
    nonPrintable += 1;
  }
  return sample.length > 0 && nonPrintable / sample.length > 0.3;
}

function getTrackedFiles() {
  const output = execSync("git ls-files -z");
  return output
    .toString("utf8")
    .split("\u0000")
    .filter(Boolean);
}

function shouldSkipFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (EXCLUDED_PATH_FRAGMENTS.some((frag) => normalized.includes(frag))) return true;
  const ext = path.extname(normalized).toLowerCase();
  return EXCLUDED_EXTENSIONS.has(ext);
}

function scanFile(filePath) {
  const findings = [];
  const bytes = fs.readFileSync(filePath);
  if (isLikelyBinary(bytes)) return findings;

  const text = bytes.toString("utf8");
  const lines = text.split("\n");

  for (const rule of RULES) {
    const matches = [...text.matchAll(rule.regex)];
    for (const match of matches) {
      const matched = match[0];
      const index = match.index ?? 0;
      const before = text.slice(0, index);
      const line = before.split("\n").length;
      const lineText = lines[line - 1] ?? "";

      if (ALLOWLIST_PATTERNS.some((pattern) => pattern.test(lineText))) {
        continue;
      }

      findings.push({
        file: filePath,
        line,
        rule: rule.id,
        snippet: matched.length > 96 ? `${matched.slice(0, 96)}...` : matched,
      });
    }
  }

  return findings;
}

function main() {
  const files = getTrackedFiles().filter((filePath) => !shouldSkipFile(filePath));
  const findings = [];

  for (const file of files) {
    const fileFindings = scanFile(file);
    findings.push(...fileFindings);
  }

  if (findings.length === 0) {
    console.log("Secret scan passed: no leaked credentials detected in tracked files.");
    process.exit(0);
  }

  console.error("Secret scan failed. Potential leaked credentials:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.snippet}`);
  }
  process.exit(1);
}

main();
