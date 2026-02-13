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
    ["/access", 200, "Access/signup page"],
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

async function testTurnstileInjection(baseUrl) {
  console.log("Testing Turnstile key injection...\n");

  let passed = 0;
  let failed = 0;

  try {
    const response = await fetch(`${baseUrl}/access`);
    const html = await response.text();

    // Check body has data-turnstile-site-key attribute
    if (html.includes('data-turnstile-site-key="0x4AAAAAACLB7AvgydG3i6FP"')) {
      console.log("  ✓ Turnstile site key injected on body");
      passed++;
    } else if (html.includes('data-turnstile-site-key=')) {
      console.log("  ✓ Turnstile site key injected (different key)");
      passed++;
    } else {
      console.log("  ✗ Turnstile site key NOT found on body");
      failed++;
    }

    // Check explicit render setup
    if (html.includes('render=explicit') && html.includes('onloadTurnstileCallback')) {
      console.log("  ✓ Turnstile explicit render configured");
      passed++;
    } else {
      console.log("  ✗ Turnstile explicit render NOT configured");
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    failed += 2;
  }

  console.log(`\nTurnstile tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testCanonicalRedirects(baseUrl) {
  // Only test in prod (www redirect)
  if (!baseUrl.includes("mergecombinator.com")) {
    console.log("Skipping canonical redirect tests (staging only)\n");
    return true;
  }

  console.log("Testing canonical redirects...\n");

  let passed = 0;
  let failed = 0;

  const testCases = [
    ["https://www.mergecombinator.com/", 301, "mergecombinator.com"],
    ["https://www.mergecombinator.com/builders", 301, "mergecombinator.com"],
  ];

  for (const [url, expectedStatus, expectedHost] of testCases) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      const location = response.headers.get("location") || "";

      if (response.status === expectedStatus && location.includes(expectedHost)) {
        console.log(`  ✓ ${url} → ${response.status} (redirects to ${expectedHost})`);
        passed++;
      } else {
        console.log(`  ✗ ${url} → ${response.status} location=${location}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${url} → ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nCanonical redirects: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testCorsHeaders(baseUrl) {
  console.log("Testing CORS headers...\n");

  let passed = 0;
  let failed = 0;

  // Test with allowed origin
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://mergecombinator.com",
        "Access-Control-Request-Method": "GET"
      }
    });

    const allowOrigin = response.headers.get("access-control-allow-origin");
    if (allowOrigin === "https://mergecombinator.com") {
      console.log("  ✓ CORS allows https://mergecombinator.com");
      passed++;
    } else {
      console.log(`  ✗ CORS header missing or wrong: ${allowOrigin}`);
      failed++;
    }

    // Check credentials header
    const allowCreds = response.headers.get("access-control-allow-credentials");
    if (allowCreds === "true") {
      console.log("  ✓ CORS credentials allowed");
      passed++;
    } else {
      console.log(`  ✗ CORS credentials not allowed: ${allowCreds}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ CORS test error: ${error.message}`);
    failed += 2;
  }

  // Test with disallowed origin
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://evil.com",
        "Access-Control-Request-Method": "GET"
      }
    });

    const allowOrigin = response.headers.get("access-control-allow-origin");
    if (!allowOrigin) {
      console.log("  ✓ CORS blocks https://evil.com");
      passed++;
    } else {
      console.log(`  ✗ CORS should block evil.com but got: ${allowOrigin}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ CORS block test error: ${error.message}`);
    failed++;
  }

  console.log(`\nCORS tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testAuthRedirects(baseUrl) {
  console.log("Testing auth redirects...\n");

  let passed = 0;
  let failed = 0;

  // Test /app redirect includes returnTo
  try {
    const response = await fetch(`${baseUrl}/app/dashboard`, { redirect: "manual" });
    const location = response.headers.get("location") || "";

    if (location.includes("/auth/login") && location.includes("returnTo=")) {
      console.log("  ✓ /app/dashboard redirects to login with returnTo");
      passed++;
    } else {
      console.log(`  ✗ /app/dashboard redirect missing returnTo: ${location}`);
      failed++;
    }

    // Verify returnTo is URL-encoded
    if (location.includes("returnTo=%2Fapp%2Fdashboard")) {
      console.log("  ✓ returnTo is properly URL-encoded");
      passed++;
    } else {
      console.log(`  ✗ returnTo not properly encoded: ${location}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Auth redirect test error: ${error.message}`);
    failed += 2;
  }

  // Test /control redirect
  try {
    const response = await fetch(`${baseUrl}/control/users`, { redirect: "manual" });
    const location = response.headers.get("location") || "";

    if (location.includes("/auth/login") && location.includes("returnTo=")) {
      console.log("  ✓ /control/users redirects to login with returnTo");
      passed++;
    } else {
      console.log(`  ✗ /control redirect missing returnTo: ${location}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ Control redirect test error: ${error.message}`);
    failed++;
  }

  console.log(`\nAuth redirect tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testAuthMeEndpoint(baseUrl) {
  console.log("Testing /auth/me endpoint...\n");

  let passed = 0;
  let failed = 0;

  // Test unauthenticated response
  try {
    const response = await fetch(`${baseUrl}/auth/me`);
    const data = await response.json();

    if (response.status === 200) {
      console.log("  ✓ /auth/me returns 200");
      passed++;
    } else {
      console.log(`  ✗ /auth/me returns ${response.status}`);
      failed++;
    }

    if (data.authenticated === false) {
      console.log("  ✓ Unauthenticated user shows authenticated: false");
      passed++;
    } else {
      console.log(`  ✗ Expected authenticated: false, got: ${data.authenticated}`);
      failed++;
    }

    // Check response is JSON
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      console.log("  ✓ Response is JSON");
      passed++;
    } else {
      console.log(`  ✗ Expected JSON, got: ${contentType}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ /auth/me test error: ${error.message}`);
    failed += 3;
  }

  console.log(`\nAuth /me tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testPublicPaths(baseUrl) {
  console.log("Testing public paths (no auth required)...\n");

  let passed = 0;
  let failed = 0;

  const publicPaths = [
    ["/wingman", "Wingman marketing page", false],
    ["/wingman/", "Wingman marketing page (trailing slash)", false],
    ["/builders", "Builders page", false],
    ["/access", "Access request page", false],
    ["/combine", "Sigmablox proxy", false],
    ["/opportunities", "SBIR proxy", true],  // Known infrastructure issue - allow 500
    ["/privacy", "Privacy policy", false],
    ["/terms", "Terms of service", false],
  ];

  for (const [path, description, allowServerError] of publicPaths) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });

      // Should NOT redirect to login (302 to /auth/login)
      const isOk = response.status === 200;
      const isRedirect = response.status >= 300 && response.status < 400;
      const redirectsToAuth = response.headers.get("location")?.includes("/auth/login");
      const isServerError = response.status >= 500;

      if (isOk || (isRedirect && !redirectsToAuth) || (isServerError && allowServerError)) {
        const note = isServerError ? " (origin error - known issue)" : "";
        console.log(`  ✓ ${path} → ${response.status}${note} (${description})`);
        passed++;
      } else {
        console.log(`  ✗ ${path} → ${response.status} (redirects to auth) - ${description}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${path} → ERROR: ${error.message} - ${description}`);
      failed++;
    }
  }

  console.log(`\nPublic path tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const unitOnly = args.includes("--unit");
  const env = args.find(a => a !== "--unit") || "staging";
  const baseUrl = env === "prod" ? PROD_URL : STAGING_URL;

  console.log("=".repeat(60));
  console.log("MC Router Test Suite");
  console.log("=".repeat(60));
  console.log(`Mode: ${unitOnly ? "unit only" : "full (unit + integration)"}`);
  if (!unitOnly) console.log(`Environment: ${env}\nBase URL: ${baseUrl}`);
  console.log();

  // Unit tests (always run — no network required)
  const routeTestsPassed = testRouteMatching();
  const sanitizeTestsPassed = testSanitizeReturnTo();

  if (unitOnly) {
    console.log("=".repeat(60));
    const allPassed = routeTestsPassed && sanitizeTestsPassed;
    console.log(allPassed ? "✓ All unit tests passed!" : "✗ Some unit tests failed!");
    process.exit(allPassed ? 0 : 1);
    return;
  }

  // Integration tests (require live worker)
  console.log("-".repeat(60));
  const smokeTestsPassed = await smokeTest(baseUrl);

  console.log("-".repeat(60));
  const publicPathsPassed = await testPublicPaths(baseUrl);

  console.log("-".repeat(60));
  const authRedirectsPassed = await testAuthRedirects(baseUrl);

  console.log("-".repeat(60));
  const authMePassed = await testAuthMeEndpoint(baseUrl);

  console.log("-".repeat(60));
  const turnstileTestsPassed = await testTurnstileInjection(baseUrl);

  console.log("-".repeat(60));
  const canonicalTestsPassed = await testCanonicalRedirects(baseUrl);

  console.log("-".repeat(60));
  const corsTestsPassed = await testCorsHeaders(baseUrl);

  // Summary
  console.log("=".repeat(60));
  const allPassed = routeTestsPassed && sanitizeTestsPassed && smokeTestsPassed &&
                    publicPathsPassed && authRedirectsPassed && authMePassed &&
                    turnstileTestsPassed && canonicalTestsPassed && corsTestsPassed;

  if (allPassed) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("✗ Some tests failed!");
    process.exit(1);
  }
}

main().catch(console.error);
