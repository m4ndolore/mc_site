#!/usr/bin/env node
/**
 * Router Test Script
 *
 * Tests route matching order, sanitizeReturnTo, and provides smoke tests.
 * Run with: node cloudflare/test-router.mjs [staging|prod]
 */

const STAGING_URL = "https://mc-router-staging.defensebuilders.workers.dev";
const PROD_URL = "https://mergecombinator.com";

// ============================================================================
// Unit Tests (run in Node.js)
// ============================================================================

// Inline the route matching logic for testing
function getRoutes() {
  return [
    { prefix: "/app/wingman", origin: "wingman", stripPrefix: true, preserveRoot: true },
    { prefix: "/app", origin: "app", stripPrefix: true },
    { prefix: "/control", origin: "control", stripPrefix: true },
    { prefix: "/api", origin: "api", stripPrefix: false, isApi: true },
    { prefix: "/combine", origin: "sigmablox", stripPrefix: true, preserveRoot: true },
    { prefix: "/opportunities", origin: "sbir", stripPrefix: true },
  ];
}

function matchRoute(pathname) {
  const routes = getRoutes();
  return routes.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );
}

// Test route matching order
function testRouteMatching() {
  console.log("Testing route matching order...");

  const testCases = [
    // [pathname, expected origin or null]
    ["/", null],  // Should fall through to Pages
    ["/app", "app"],
    ["/app/", "app"],
    ["/app/dashboard", "app"],
    ["/app/wingman", "wingman"],  // More specific route should match
    ["/app/wingman/chat", "wingman"],
    ["/control", "control"],
    ["/control/users", "control"],
    ["/api", "api"],
    ["/api/v1/users", "api"],
    ["/combine", "sigmablox"],
    ["/combine/blog", "sigmablox"],
    ["/opportunities", "sbir"],
    ["/wingman", null],  // Marketing page, no route match
    ["/builders", null],  // Static page
  ];

  let passed = 0;
  let failed = 0;

  for (const [pathname, expectedOrigin] of testCases) {
    const route = matchRoute(pathname);
    const actualOrigin = route ? route.origin : null;

    if (actualOrigin === expectedOrigin) {
      console.log(`  ✓ ${pathname} → ${actualOrigin || "(Pages)"}`);
      passed++;
    } else {
      console.log(`  ✗ ${pathname} → ${actualOrigin || "(Pages)"} (expected: ${expectedOrigin || "(Pages)"})`);
      failed++;
    }
  }

  console.log(`\nRoute matching: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Inline sanitizeReturnTo logic for testing
function isAllowedHost(hostname) {
  if (!hostname) return false;
  if (hostname === "mergecombinator.com") return true;
  if (hostname === "www.mergecombinator.com") return true;
  return hostname.endsWith(".mergecombinator.com");
}

function sanitizeReturnTo(returnTo) {
  if (!returnTo) return null;
  if (returnTo.startsWith("//")) return null;
  if (returnTo.startsWith("/")) return returnTo;
  try {
    const url = new URL(returnTo);
    if (!isAllowedHost(url.hostname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function testSanitizeReturnTo() {
  console.log("Testing sanitizeReturnTo...");

  const testCases = [
    // [input, expected output]
    [null, null],
    ["", null],
    ["/app", "/app"],
    ["/app?foo=bar", "/app?foo=bar"],
    ["/app#section", "/app#section"],
    ["//evil.com/path", null],  // Protocol-relative URL attack
    ["https://mergecombinator.com/app", "/app"],
    ["https://www.mergecombinator.com/app", "/app"],
    ["https://docs.mergecombinator.com/guide", "/guide"],
    ["https://evil.com/attack", null],  // External domain
    ["https://fakemergecombinator.com/app", null],  // Lookalike domain
    ["javascript:alert(1)", null],  // XSS attempt
    ["data:text/html,<script>", null],  // Data URL attack
  ];

  let passed = 0;
  let failed = 0;

  for (const [input, expected] of testCases) {
    const actual = sanitizeReturnTo(input);

    if (actual === expected) {
      console.log(`  ✓ "${input}" → ${actual === null ? "null" : `"${actual}"`}`);
      passed++;
    } else {
      console.log(`  ✗ "${input}" → ${actual === null ? "null" : `"${actual}"`} (expected: ${expected === null ? "null" : `"${expected}"`})`);
      failed++;
    }
  }

  console.log(`\nSanitizeReturnTo: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============================================================================
// Integration Tests (HTTP smoke tests)
// ============================================================================

async function smokeTest(baseUrl) {
  console.log(`Running smoke tests against ${baseUrl}...\n`);

  const testCases = [
    // [path, expected status, description]
    ["/", 200, "Homepage"],
    ["/wingman", 200, "Wingman marketing page"],
    ["/builders", 200, "Builders page"],
    ["/app", 302, "App console (should redirect to login)"],
    ["/control", 302, "Control console (should redirect to login)"],
    ["/combine", 200, "Sigmablox proxy"],
    ["/auth/me", 200, "Auth me endpoint"],
  ];

  let passed = 0;
  let failed = 0;

  for (const [path, expectedStatus, description] of testCases) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "HEAD",
        redirect: "manual"  // Don't follow redirects
      });

      if (response.status === expectedStatus) {
        console.log(`  ✓ ${path} → ${response.status} (${description})`);
        passed++;
      } else {
        console.log(`  ✗ ${path} → ${response.status} (expected ${expectedStatus}) - ${description}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${path} → ERROR: ${error.message} - ${description}`);
      failed++;
    }
  }

  console.log(`\nSmoke tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const env = process.argv[2] || "staging";
  const baseUrl = env === "prod" ? PROD_URL : STAGING_URL;

  console.log("=" .repeat(60));
  console.log("MC Router Test Suite");
  console.log("=" .repeat(60));
  console.log();

  // Unit tests
  const routeTestsPassed = testRouteMatching();
  const sanitizeTestsPassed = testSanitizeReturnTo();

  // Integration tests
  console.log("-".repeat(60));
  const smokeTestsPassed = await smokeTest(baseUrl);

  // Summary
  console.log("=".repeat(60));
  const allPassed = routeTestsPassed && sanitizeTestsPassed && smokeTestsPassed;

  if (allPassed) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("✗ Some tests failed!");
    process.exit(1);
  }
}

main().catch(console.error);
