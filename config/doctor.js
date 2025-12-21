#!/usr/bin/env node
/**
 * Configuration Doctor - Validate and diagnose configuration issues
 *
 * Checks:
 * - All required environment variables present
 * - Valid configuration values
 * - Derived URLs correct
 * - External services reachable
 *
 * Usage:
 *     node config/doctor.js
 *     npm run doctor
 */

const { validateConfig, printConfigStatus, CONFIG_SCHEMA } = require('./schema');
const urlHelpers = require('./url-helpers');
const https = require('https');
const http = require('http');

/**
 * Print section header
 */
function printSection(title) {
  console.log('');
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
  console.log('');
}

/**
 * Check if a URL is reachable
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{reachable: boolean, status?: number, error?: string}>}
 */
function checkUrlReachable(url, timeout = 5000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(
        url,
        {
          timeout,
          headers: {
            'User-Agent': 'SigmaBlox-Config-Doctor/1.0',
          },
        },
        (res) => {
          resolve({
            reachable: true,
            status: res.statusCode,
          });
          res.resume(); // Consume response
        }
      );

      req.on('error', (error) => {
        resolve({
          reachable: false,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          reachable: false,
          error: 'Request timeout',
        });
      });
    } catch (error) {
      resolve({
        reachable: false,
        error: error.message,
      });
    }
  });
}

/**
 * Check Authentik well-known OIDC endpoint
 */
async function checkAuthentikOidc() {
  try {
    const issuerUrl = process.env.OIDC_ISSUER_URL;
    if (!issuerUrl) {
      return {
        available: false,
        error: 'OIDC_ISSUER_URL not set',
      };
    }

    // OIDC well-known endpoint
    const wellKnownUrl = `${issuerUrl}/.well-known/openid-configuration`;

    const result = await checkUrlReachable(wellKnownUrl);

    if (result.reachable) {
      return {
        available: true,
        url: wellKnownUrl,
        status: result.status,
      };
    } else {
      return {
        available: false,
        url: wellKnownUrl,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Check if Cloudflare hostname resolves
 */
async function checkPublicUrlReachable() {
  try {
    const publicUrl = urlHelpers.getPublicBaseUrl();

    const result = await checkUrlReachable(publicUrl);

    if (result.reachable) {
      return {
        reachable: true,
        url: publicUrl,
        status: result.status,
      };
    } else {
      return {
        reachable: false,
        url: publicUrl,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      reachable: false,
      error: error.message,
    };
  }
}

/**
 * Print secret status (without revealing values)
 */
function printSecretStatus() {
  const secrets = [];

  // Collect all secret variables from schema
  for (const group of Object.values(CONFIG_SCHEMA)) {
    for (const configVar of group) {
      if (configVar.secret) {
        const isSet = !!process.env[configVar.name];
        secrets.push({
          name: configVar.name,
          set: isSet,
        });
      }
    }
  }

  const setSecrets = secrets.filter((s) => s.set);
  const missingSecrets = secrets.filter((s) => !s.set);

  console.log(`Secrets configured: ${setSecrets.length}/${secrets.length}`);
  console.log('');

  if (missingSecrets.length > 0) {
    console.log('⚠️  Missing secrets:');
    missingSecrets.forEach((secret) => {
      console.log(`  • ${secret.name}`);
    });
    console.log('');
  } else {
    console.log('✅ All secrets are configured');
    console.log('');
  }
}

/**
 * Main doctor function
 */
async function runDoctor() {
  console.log('🏥 Configuration Doctor');
  console.log('Checking configuration health...\n');

  // 1. Environment Info
  printSection('Environment Information');
  console.log(`APP_ENV:         ${process.env.APP_ENV || 'NOT SET'}`);
  console.log(`NODE_ENV:        ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log(`Platform:        ${process.platform}`);
  console.log(`Node Version:    ${process.version}`);
  console.log(`Working Dir:     ${process.cwd()}`);

  // 2. URL Configuration
  printSection('URL Configuration');
  try {
    const urls = urlHelpers.getAllUrls();
    console.log('Public Base URL:      ', urls.publicBaseUrl);
    console.log('Internal Base URL:    ', urls.internalBaseUrl);
    console.log('Ghost Public URL:     ', urls.ghostPublicUrl);
    console.log('Ghost Internal URL:   ', urls.ghostInternalUrl);
    console.log('Ghost URL:            ', urls.ghostUrl);
    console.log('OIDC Redirect URI:    ', urls.oidcRedirectUri);
    console.log('OAuth Redirect URI:   ', urls.oauthRedirectUri);
    console.log('Ghost SSO Callback:   ', urls.ghostSsoCallbackUri);
    console.log('OIDC Issuer URL:      ', urls.oidcIssuerUrl);
    console.log('Authentik Base URL:   ', urls.authentikBaseUrl);

    // Validate no localhost in production
    if (process.env.APP_ENV === 'prod') {
      try {
        urlHelpers.validateNoLocalhostInProduction();
        console.log('');
        console.log('✅ No localhost URLs in production');
      } catch (error) {
        console.log('');
        console.log('❌ Localhost URLs found in production!');
        console.log(error.message);
      }
    }
  } catch (error) {
    console.log('❌ Error getting URLs:', error.message);
  }

  // 3. Configuration Validation
  printSection('Configuration Validation');
  const validation = validateConfig();

  if (validation.valid) {
    console.log('✅ All required configuration is valid\n');
  } else {
    console.log('❌ Configuration validation failed\n');
    validation.errors.forEach((error) => {
      console.log(`  • ${error}`);
    });
    console.log('');
  }

  if (validation.missing.length > 0) {
    console.log('Missing required variables:');
    validation.missing.forEach((name) => {
      console.log(`  • ${name}`);
    });
    console.log('');
  }

  // 4. Secret Status
  printSection('Secrets Status');
  printSecretStatus();

  // 5. External Service Checks
  printSection('External Service Checks');

  // Check Authentik OIDC endpoint
  console.log('Checking Authentik OIDC endpoint...');
  const authentikCheck = await checkAuthentikOidc();
  if (authentikCheck.available) {
    console.log(`✅ Authentik OIDC is reachable (HTTP ${authentikCheck.status})`);
    console.log(`   ${authentikCheck.url}`);
  } else {
    console.log('❌ Authentik OIDC is NOT reachable');
    console.log(`   Error: ${authentikCheck.error}`);
    if (authentikCheck.url) {
      console.log(`   URL: ${authentikCheck.url}`);
    }
  }
  console.log('');

  // Check public URL reachable
  console.log('Checking public URL reachable...');
  const publicUrlCheck = await checkPublicUrlReachable();
  if (publicUrlCheck.reachable) {
    console.log(`✅ Public URL is reachable (HTTP ${publicUrlCheck.status})`);
    console.log(`   ${publicUrlCheck.url}`);
  } else {
    console.log('⚠️  Public URL is NOT reachable');
    console.log(`   Error: ${publicUrlCheck.error}`);
    if (publicUrlCheck.url) {
      console.log(`   URL: ${publicUrlCheck.url}`);
    }
    console.log('   (This is normal if services are not running yet)');
  }

  // 6. Summary
  printSection('Summary');

  const issues = [];

  if (!validation.valid) {
    issues.push('Configuration validation failed');
  }

  if (validation.missing.length > 0) {
    issues.push(`${validation.missing.length} required variables missing`);
  }

  if (!authentikCheck.available) {
    issues.push('Authentik OIDC endpoint not reachable');
  }

  if (issues.length === 0) {
    console.log('✅ Configuration is healthy!');
    console.log('   All checks passed. System is ready to start.');
  } else {
    console.log('⚠️  Configuration has issues:');
    issues.forEach((issue) => {
      console.log(`   • ${issue}`);
    });
    console.log('');
    console.log('Fix the issues above before starting the application.');
    process.exit(1);
  }

  console.log('');
}

// Run if called directly
if (require.main === module) {
  runDoctor().catch((error) => {
    console.error('Doctor failed:', error);
    process.exit(1);
  });
}

module.exports = { runDoctor };
