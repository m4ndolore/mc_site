#!/usr/bin/env node
/**
 * Vendors the Merge Standard documents into public/standard/.
 *
 * The text is owned by https://github.com/mergecombinator/standard. This site
 * serves a pinned release of it as plain text, so agents and people can read the
 * documents at stable URLs without downloading a file. The release tag lives in
 * `standard.ref` at the repo root. The vendored files are committed, so a deploy
 * never depends on GitHub being reachable and the served legal text changes only
 * through a reviewed commit here.
 *
 * Usage:
 *   node scripts/sync-standard.mjs            # fetch the pinned tag, write public/standard/
 *   node scripts/sync-standard.mjs --check    # exit 1 if public/standard/ differs from the tag
 *
 * To publish a new version: tag the standard repo, put the tag in standard.ref,
 * run `npm run standard:sync`, commit, open a PR.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, sep } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF_PATH = join(ROOT, 'standard.ref');
const OUT_DIR = join(ROOT, 'public', 'standard');

export const REPO = 'mergecombinator/standard';
export const REF_PATTERN = /^v\d{4}\.\d{2}\.\d{2}(\.\d+)?$/;
const ARCHIVE_FILE_PATTERN = /^archive\/[0-9][0-9A-Za-z.]*\/[a-z0-9-]+\.md$/;

// The only place repo filenames map to served URLs.
// Key: path in the standard repo. Value: path under /standard/.
export const FILES = {
  'llms.txt': 'llms.txt',
  'explore-agreement.md': 'explore.md',
  'pursue-agreement.md': 'pursue.md',
  'form-agreement.md': 'form.md',
  'role-taxonomy.md': 'roles.md',
  'pipeline-and-gates.md': 'pipeline.md',
};

export function parseRef(text) {
  const ref = text.trim();
  if (!REF_PATTERN.test(ref)) {
    throw new Error(`standard.ref must hold a release tag like v2026.09.18, got "${ref}"`);
  }
  return ref;
}

export function rawUrl(ref, repoPath) {
  return `https://raw.githubusercontent.com/${REPO}/${ref}/${repoPath}`;
}

// Superseded versions are served at the same path they have in the repo.
export function archivePaths(treeEntries) {
  return treeEntries
    .filter((entry) => entry.type === 'blob' && ARCHIVE_FILE_PATTERN.test(entry.path))
    .map((entry) => entry.path)
    .sort();
}

async function fetchBytes(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { 'User-Agent': 'mc-site-sync-standard' } });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function listArchive(ref, fetchImpl) {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${ref}?recursive=1`;
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'mc-site-sync-standard', Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`${res.status} listing ${url}`);
  const body = await res.json();
  if (body.truncated) throw new Error('standard repo tree listing was truncated');
  return archivePaths(body.tree);
}

function localArchivePaths(outDir) {
  const base = join(outDir, 'archive');
  if (!existsSync(base)) return [];
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else found.push(relative(outDir, full).split(sep).join('/'));
    }
  };
  walk(base);
  return found.sort();
}

export async function sync({ ref, outDir = OUT_DIR, fetchImpl = fetch }) {
  const written = [];
  const put = async (repoPath, servedPath) => {
    const bytes = await fetchBytes(rawUrl(ref, repoPath), fetchImpl);
    const dest = join(outDir, servedPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, bytes);
    written.push(servedPath);
  };
  for (const [repoPath, servedPath] of Object.entries(FILES)) await put(repoPath, servedPath);
  for (const path of await listArchive(ref, fetchImpl)) await put(path, path);
  return written;
}

// Compares every vendored file with the pinned tag. Returns the served paths
// that are missing or different. Archive files are checked for the ones present
// locally, since listing the remote tree needs the rate-limited GitHub API.
export async function check({ ref, outDir = OUT_DIR, fetchImpl = fetch }) {
  const problems = [];
  const compare = async (repoPath, servedPath) => {
    const dest = join(outDir, servedPath);
    if (!existsSync(dest)) {
      problems.push(`${servedPath}: missing`);
      return;
    }
    const remote = await fetchBytes(rawUrl(ref, repoPath), fetchImpl);
    if (!remote.equals(readFileSync(dest))) problems.push(`${servedPath}: differs from ${ref}`);
  };
  for (const [repoPath, servedPath] of Object.entries(FILES)) await compare(repoPath, servedPath);
  for (const path of localArchivePaths(outDir)) await compare(path, path);
  return problems;
}

async function main() {
  const ref = parseRef(readFileSync(REF_PATH, 'utf-8'));
  if (process.argv.includes('--check')) {
    const problems = await check({ ref });
    if (problems.length > 0) {
      console.error(`public/standard/ does not match ${REPO}@${ref}:`);
      for (const problem of problems) console.error(`  ${problem}`);
      console.error('Run `npm run standard:sync` and commit the result.');
      process.exit(1);
    }
    console.log(`public/standard/ matches ${REPO}@${ref}`);
    return;
  }
  const written = await sync({ ref });
  console.log(`Wrote ${written.length} files from ${REPO}@${ref} to public/standard/`);
  for (const path of written) console.log(`  /standard/${path}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
