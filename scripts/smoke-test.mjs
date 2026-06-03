#!/usr/bin/env node
/**
 * Post-deploy smoke test — verifies critical pages return 200.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                    # test production
 *   node scripts/smoke-test.mjs --origin <url>     # test specific origin
 *   node scripts/smoke-test.mjs --retries 3        # retry on failure (deploy propagation)
 */

const PROD_ORIGIN = 'https://mergecombinator.com';

const CRITICAL_PATHS = [
  '/',
  '/access',
  '/builders',
  '/signals',
  '/about',
  '/programs/the-combine',
  '/knowledge/sbir',
];

function parseArgs() {
  const args = process.argv.slice(2);
  let origin = PROD_ORIGIN;
  let retries = 2;
  let delay = 5000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--origin' && args[i + 1]) origin = args[++i];
    if (args[i] === '--retries' && args[i + 1]) retries = parseInt(args[++i], 10);
    if (args[i] === '--delay' && args[i + 1]) delay = parseInt(args[++i], 10);
  }
  return { origin, retries, delay };
}

async function checkUrl(url) {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': 'mc-smoke-test/1.0' },
    redirect: 'follow',
  });
  return { url, status: res.status, ok: res.status === 200 };
}

async function runChecks(origin) {
  const results = await Promise.all(
    CRITICAL_PATHS.map(path => checkUrl(`${origin}${path}`))
  );
  return results;
}

async function main() {
  const { origin, retries, delay } = parseArgs();
  console.log(`\n🔍 Smoke test: ${origin}`);
  console.log(`   Checking ${CRITICAL_PATHS.length} critical pages...\n`);

  let results;
  let attempt = 0;

  while (attempt <= retries) {
    if (attempt > 0) {
      console.log(`   Retry ${attempt}/${retries} after ${delay / 1000}s...\n`);
      await new Promise(r => setTimeout(r, delay));
    }

    results = await runChecks(origin);
    const failures = results.filter(r => !r.ok);

    if (failures.length === 0) break;
    attempt++;
  }

  let hasFailure = false;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    const color = r.ok ? '\x1b[32m' : '\x1b[31m';
    console.log(`   ${color}${icon}\x1b[0m ${r.status} ${r.url}`);
    if (!r.ok) hasFailure = true;
  }

  console.log('');

  if (hasFailure) {
    console.error('❌ SMOKE TEST FAILED — critical pages are not responding correctly.');
    console.error('   The deploy may have shipped a broken build.');
    process.exit(1);
  }

  console.log('✅ All critical pages responding 200.');
}

main().catch(err => {
  console.error('Smoke test error:', err.message);
  process.exit(1);
});
