#!/usr/bin/env node
/**
 * momentum-approve.mjs — human review gate between the momentum-curate.mjs
 * queue and the live ledger. Nothing reaches public/data/momentum.json
 * without an explicit approve here.
 *
 * Usage:
 *   node scripts/momentum-approve.mjs --list
 *   node scripts/momentum-approve.mjs <id>              # publish to momentum.json
 *   node scripts/momentum-approve.mjs <id> --reject      # discard, no publish
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, 'data', 'momentum-queue.json');
const MOMENTUM_PATH = join(__dirname, '..', 'public', 'data', 'momentum.json');

function fail(msg) {
  console.error(`[momentum-approve] ERROR: ${msg}`);
  process.exit(1);
}

function loadQueue() {
  if (!existsSync(QUEUE_PATH)) return { pending: [] };
  return JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
}

const args = process.argv.slice(2);
const queue = loadQueue();

if (args.includes('--list')) {
  if (!queue.pending.length) {
    console.log('Queue is empty.');
  } else {
    for (const e of queue.pending) {
      console.log(`\n[${e.id}]`);
      console.log(`  ${e.date}  ${e.type}  ${e.source_name}`);
      console.log(`  ${e.title}`);
      console.log(`  ${e.source_url}`);
      if (e.why) console.log(`  why: ${e.why}`);
      if (e.type === 'partner' && !e.why) console.log('  ⚠ partner entry with no `why` — do not approve without one');
    }
  }
  process.exit(0);
}

const id = args.find((a) => !a.startsWith('--'));
if (!id) fail('usage: node scripts/momentum-approve.mjs <id> [--reject]  (or --list)');

const idx = queue.pending.findIndex((e) => e.id === id);
if (idx === -1) fail(`no queued entry with id "${id}" — run --list to see what's pending`);

const [entry] = queue.pending.splice(idx, 1);

if (args.includes('--reject')) {
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`✓ rejected and removed ${id} from queue`);
  process.exit(0);
}

if (entry.type === 'partner' && !entry.why) {
  fail(`entry "${id}" is type partner but has no \`why\` — add one before approving (edit the queue entry, then re-run)`);
}

const momentum = JSON.parse(readFileSync(MOMENTUM_PATH, 'utf-8'));
if (momentum.entries.some((e) => e.source_url && e.source_url === entry.source_url)) {
  fail(`an entry with source_url ${entry.source_url} is already published`);
}

const { id: _drop, ...published } = entry;
void _drop;
momentum.entries.unshift(published); // ledger.js sorts by date regardless

writeFileSync(MOMENTUM_PATH, JSON.stringify(momentum, null, 2) + '\n');
writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');

console.log(`✓ published to public/data/momentum.json: ${entry.title}`);
console.log(`✓ removed from queue`);
