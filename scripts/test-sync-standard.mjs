#!/usr/bin/env node
/**
 * Unit tests for scripts/sync-standard.mjs. No network: fetch is injected.
 *
 * Usage: node --test scripts/test-sync-standard.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FILES, parseRef, rawUrl, archivePaths, sync, check } from './sync-standard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = 'v2026.09.18';

function fakeFetch(files, tree = []) {
  return async (url) => {
    if (url.startsWith('https://api.github.com/')) {
      return { ok: true, status: 200, json: async () => ({ truncated: false, tree }) };
    }
    const prefix = `https://raw.githubusercontent.com/mergecombinator/standard/${REF}/`;
    const path = url.slice(prefix.length);
    if (!url.startsWith(prefix) || !(path in files)) {
      return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    }
    const bytes = Buffer.from(files[path]);
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    };
  };
}

const REMOTE = Object.fromEntries(Object.keys(FILES).map((path) => [path, `# ${path}\n`]));

test('parseRef accepts release tags and rejects branches', () => {
  assert.equal(parseRef('v2026.09.18\n'), 'v2026.09.18');
  assert.equal(parseRef('v2026.09.18.2'), 'v2026.09.18.2');
  assert.throws(() => parseRef('main'));
  assert.throws(() => parseRef(''));
  assert.throws(() => parseRef('v2026.9.18'));
});

test('the committed standard.ref is a release tag', () => {
  assert.doesNotThrow(() => parseRef(readFileSync(join(ROOT, 'standard.ref'), 'utf-8')));
});

test('rawUrl pins the tag', () => {
  assert.equal(
    rawUrl(REF, 'explore-agreement.md'),
    'https://raw.githubusercontent.com/mergecombinator/standard/v2026.09.18/explore-agreement.md'
  );
});

test('the five documents and the index map to the published URLs', () => {
  assert.deepEqual(Object.values(FILES).sort(), [
    'explore.md',
    'form.md',
    'llms.txt',
    'pipeline.md',
    'pursue.md',
    'roles.md',
  ]);
});

test('archivePaths keeps versioned markdown and nothing else', () => {
  const tree = [
    { type: 'blob', path: 'archive/README.md' },
    { type: 'blob', path: 'archive/1.1/explore-agreement.md' },
    { type: 'tree', path: 'archive/1.1' },
    { type: 'blob', path: 'archive/1.1/../../secrets.md' },
    { type: 'blob', path: 'explore-agreement.md' },
  ];
  assert.deepEqual(archivePaths(tree), ['archive/1.1/explore-agreement.md']);
});

test('sync writes every mapped file and mirrors the archive', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'standard-'));
  const files = { ...REMOTE, 'archive/1.0/pursue-agreement.md': '# old pursue\n' };
  const tree = [{ type: 'blob', path: 'archive/1.0/pursue-agreement.md' }];
  const written = await sync({ ref: REF, outDir, fetchImpl: fakeFetch(files, tree) });
  assert.equal(written.length, 7);
  assert.equal(readFileSync(join(outDir, 'explore.md'), 'utf-8'), '# explore-agreement.md\n');
  assert.ok(existsSync(join(outDir, 'archive', '1.0', 'pursue-agreement.md')));
});

test('sync fails loudly when a document is missing from the tag', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'standard-'));
  const { 'form-agreement.md': _dropped, ...partial } = REMOTE;
  await assert.rejects(sync({ ref: REF, outDir, fetchImpl: fakeFetch(partial) }), /404/);
});

test('check passes on a fresh sync and reports edits, deletions, and archive drift', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'standard-'));
  const files = { ...REMOTE, 'archive/1.0/pursue-agreement.md': '# old pursue\n' };
  const tree = [{ type: 'blob', path: 'archive/1.0/pursue-agreement.md' }];
  const fetchImpl = fakeFetch(files, tree);
  await sync({ ref: REF, outDir, fetchImpl });
  assert.deepEqual(await check({ ref: REF, outDir, fetchImpl }), []);

  writeFileSync(join(outDir, 'explore.md'), '# edited locally\n');
  writeFileSync(join(outDir, 'archive', '1.0', 'pursue-agreement.md'), '# rewritten history\n');
  const problems = await check({ ref: REF, outDir, fetchImpl });
  assert.equal(problems.length, 2);
  assert.match(problems.join('\n'), /explore\.md: differs/);
  assert.match(problems.join('\n'), /archive\/1\.0\/pursue-agreement\.md: differs/);

  const emptyDir = mkdtempSync(join(tmpdir(), 'standard-'));
  mkdirSync(emptyDir, { recursive: true });
  const missing = await check({ ref: REF, outDir: emptyDir, fetchImpl });
  assert.equal(missing.length, 6);
});

test('_headers serves /standard/ as plain text with open CORS', () => {
  const headers = readFileSync(join(ROOT, 'public', '_headers'), 'utf-8');
  const block = headers.split(/\n(?=\/)/).find((part) => part.startsWith('/standard/*'));
  assert.ok(block, 'public/_headers needs a /standard/* block');
  assert.match(block, /Content-Type: text\/plain; charset=utf-8/);
  assert.match(block, /X-Content-Type-Options: nosniff/);
  assert.match(block, /Access-Control-Allow-Origin: \*/);
  assert.doesNotMatch(block, /Content-Disposition/);
});
