/**
 * Environment Variable Schema - Authoritative Contract
 *
 * This is the single source of truth for all configuration.
 * All applications read ONLY from process.env.
 * No YAML loading. No Secret Manager access in app code.
 *
 * @module config/schema
 */

/**
 * Configuration variable definition
 * @typedef {Object} ConfigVar
 * @property {string} name - Environment variable name
 * @property {boolean} required - Is this variable required?
 * @property {boolean} secret - Is this a secret value?
 * @property {string} type - Variable type: 'string' | 'number' | 'boolean' | 'url' | 'email'
 * @property {string} description - What this variable controls
 * @property {string} [defaultValue] - Default value if not provided
 * @property {string[]} [validValues] - Valid enum values (optional)
 */

/**
 * Environment variable groups matching the contract
 */
const CONFIG_SCHEMA = {
  // 🔹 Core Runtime
  coreRuntime: [
    {
      name: 'APP_ENV',
      required: true,
      secret: false,
      type: 'string',
      validValues: ['dev', 'prod'],
      description: 'Controls config overlays (dev|prod)',
    },
    {
      name: 'NODE_ENV',
      required: true,
      secret: false,
      type: 'string',
      validValues: ['development', 'production'],
      description: 'Framework/runtime environment',
    },
  ],

  // 🔹 URL & Proxy (NON-SECRET, CRITICAL)
  urlAndProxy: [
    {
      name: 'PUBLIC_BASE_URL',
      required: true,
      secret: false,
      type: 'url',
      description: 'Single source of truth for all public URLs',
    },
    {
      name: 'THEME_API_BASE_URL',
      required: true,
      secret: false,
      type: 'url',
      description: 'Public API base URL injected into Ghost theme runtime-config.js',
    },
    {
      name: 'THEME_SAM_VALIDATOR_URL',
      required: true,
      secret: false,
      type: 'url',
      description: 'SAM validator base URL injected into Ghost theme runtime-config.js',
    },
    // DEPRECATED: INTERNAL_BASE_URL - do not use. Use PUBLIC_BASE_URL or GHOST_INTERNAL_URL instead.
    // Kept for backward compatibility only - will be removed in future version.
    {
      name: 'TRUST_PROXY',
      required: false,
      secret: false,
      type: 'boolean',
      defaultValue: 'false',
      description: 'Trust X-Forwarded-* headers (required for Cloudflare)',
    },
  ],

  // 🔹 Ghost CMS
  ghostCms: [
    {
      name: 'GHOST_PUBLIC_URL',
      required: false,
      secret: false,
      type: 'url',
      description: 'Optional explicit Ghost public URL (defaults to PUBLIC_BASE_URL)',
    },
    {
      name: 'GHOST_INTERNAL_URL',
      required: false,
      secret: false,
      type: 'url',
      description: 'Optional internal Ghost URL for server-to-server API calls (defaults to GHOST_PUBLIC_URL/PUBLIC_BASE_URL)',
    },
    {
      name: 'GHOST_ADMIN_API_KEY',
      required: true,
      secret: true,
      type: 'string',
      description: 'Ghost Admin API key for integration',
    },
    {
      name: 'GHOST_CONTENT_API_KEY',
      required: false,
      secret: false,
      type: 'string',
      description: 'Ghost Content API key (public)',
    },
    {
      name: 'GHOST_DB_CLIENT',
      required: true,
      secret: false,
      type: 'string',
      validValues: ['sqlite3', 'mysql'],
      description: 'Ghost database client (sqlite3 only for dev)',
    },
    {
      name: 'GHOST_DB_HOST',
      required: false,
      secret: false,
      type: 'string',
      description: 'MySQL host (required if GHOST_DB_CLIENT=mysql)',
    },
    {
      name: 'GHOST_DB_PORT',
      required: false,
      secret: false,
      type: 'number',
      defaultValue: '3306',
      description: 'MySQL port',
    },
    {
      name: 'GHOST_DB_NAME',
      required: false,
      secret: false,
      type: 'string',
      description: 'MySQL database name',
    },
    {
      name: 'GHOST_DB_USER',
      required: false,
      secret: false,
      type: 'string',
      description: 'MySQL username',
    },
    {
      name: 'GHOST_DB_PASSWORD',
      required: false, // Only required if GHOST_DB_CLIENT=mysql
      secret: true,
      type: 'string',
      description: 'MySQL password (only if using MySQL)',
    },
  ],

  // 🔹 MongoDB (Managed, App Data Only)
  mongodb: [
    {
      name: 'MONGODB_URI',
      required: true,
      secret: true,
      type: 'string',
      description: 'MongoDB Atlas connection URI',
    },
    {
      name: 'MONGODB_DB_NAME',
      required: true,
      secret: false,
      type: 'string',
      description: 'MongoDB database name for app data',
    },
    // Transitional: MONGODB_PASSWORD is the new standard name
    {
      name: 'MONGODB_PASSWORD',
      required: false,
      secret: true,
      type: 'string',
      description: 'MongoDB password (alternative to full MONGODB_URI)',
    },
    // Legacy variables (for backward compatibility during migration)
    {
      name: 'DB_USERNAME',
      required: false,
      secret: false,
      type: 'string',
      description: 'LEGACY: MongoDB username (use MONGODB_URI instead)',
    },
    {
      name: 'DB_PASSWORD',
      required: false,
      secret: true,
      type: 'string',
      description: 'DEPRECATED: Use MONGODB_PASSWORD or MONGODB_URI instead',
    },
    {
      name: 'DB_HOST',
      required: false,
      secret: false,
      type: 'string',
      description: 'LEGACY: MongoDB host (use MONGODB_URI instead)',
    },
    {
      name: 'DB_NAME',
      required: false,
      secret: false,
      type: 'string',
      description: 'LEGACY: MongoDB database name (use MONGODB_DB_NAME)',
    },
  ],

  // 🔹 Auth / OIDC (Authentik)
  authOidc: [
    {
      name: 'OIDC_ISSUER_URL',
      required: true,
      secret: false,
      type: 'url',
      description: 'Authentik OIDC issuer URL',
    },
    {
      name: 'OIDC_CLIENT_ID',
      required: true,
      secret: false,
      type: 'string',
      description: 'OIDC client ID (non-secret)',
    },
    {
      name: 'OIDC_CLIENT_SECRET',
      required: true,
      secret: true,
      type: 'string',
      description: 'OIDC client secret',
    },
    {
      name: 'OIDC_REDIRECT_URI',
      required: false,
      secret: false,
      type: 'url',
      description: 'OIDC redirect URI (derived from PUBLIC_BASE_URL)',
    },
    {
      name: 'SESSION_COOKIE_DOMAIN',
      required: false,
      secret: false,
      type: 'string',
      description: 'Session cookie domain (must align with PUBLIC_BASE_URL)',
    },
    {
      name: 'SESSION_COOKIE_SECURE',
      required: false,
      secret: false,
      type: 'boolean',
      defaultValue: 'true',
      description: 'Use secure cookies (HTTPS only)',
    },
    {
      name: 'CSRF_TRUSTED_ORIGINS',
      required: false,
      secret: false,
      type: 'string',
      description: 'Comma-separated list of trusted origins',
    },
    // Legacy Authentik variables
    {
      name: 'AUTHENTIK_BASE_URL',
      required: false,
      secret: false,
      type: 'url',
      description: 'LEGACY: Use OIDC_ISSUER_URL instead',
    },
    {
      name: 'AUTHENTIK_ADMIN_TOKEN',
      required: false,
      secret: true,
      type: 'string',
      description: 'Authentik admin API token',
    },
    {
      name: 'AUTHENTIK_WEBHOOK_SERVICE_TOKEN',
      required: false,
      secret: true,
      type: 'string',
      description: 'Webhook service token for Authentik',
    },
    {
      name: 'OAUTH_CLIENT_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'LEGACY: Use OIDC_CLIENT_ID',
    },
    {
      name: 'OAUTH_CLIENT_SECRET',
      required: false,
      secret: true,
      type: 'string',
      description: 'LEGACY: Use OIDC_CLIENT_SECRET',
    },
  ],

  // 🔹 Cloudflare (External Assets / Video)
  cloudflare: [
    {
      name: 'CLOUDFLARE_ACCOUNT_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'Cloudflare account ID',
    },
    {
      name: 'CLOUDFLARE_STREAM_TOKEN',
      required: false,
      secret: true,
      type: 'string',
      description: 'Cloudflare Stream API token',
    },
    {
      name: 'CF_ACCESS_AUDIENCE',
      required: false,
      secret: false,
      type: 'string',
      description: 'Cloudflare Access audience tag',
    },
    {
      name: 'CF_ACCESS_CLIENT_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'Cloudflare Access client ID',
    },
    {
      name: 'CF_ACCESS_CLIENT_SECRET',
      required: false,
      secret: true,
      type: 'string',
      description: 'Cloudflare Access client secret',
    },
    {
      name: 'CF_ACCESS_TEAM_DOMAIN',
      required: false,
      secret: false,
      type: 'url',
      description: 'Cloudflare Access team domain',
    },
  ],

  // 🔹 Email / SMTP
  emailSmtp: [
    {
      name: 'SMTP_HOST',
      required: true,
      secret: false,
      type: 'string',
      description: 'SMTP server hostname',
    },
    {
      name: 'SMTP_PORT',
      required: true,
      secret: false,
      type: 'number',
      description: 'SMTP server port',
    },
    {
      name: 'SMTP_USER',
      required: false,
      secret: false,
      type: 'string',
      description: 'SMTP username',
    },
    {
      name: 'SMTP_PASS',
      required: false,
      secret: true,
      type: 'string',
      description: 'SMTP password',
    },
    {
      name: 'SMTP_SECURE',
      required: false,
      secret: false,
      type: 'boolean',
      defaultValue: 'false',
      description: 'Use TLS/SSL for SMTP',
    },
    {
      name: 'ADMIN_EMAIL',
      required: false,
      secret: false,
      type: 'email',
      description: 'Primary admin email address',
    },
  ],

  // 🔹 Application Specific
  application: [
    {
      name: 'PORT',
      required: false,
      secret: false,
      type: 'number',
      defaultValue: '2000',
      description: 'Application server port',
    },
    {
      name: 'JWT_SECRET',
      required: false,
      secret: true,
      type: 'string',
      description: 'JWT signing secret',
    },
    {
      name: 'SESSION_SECRET',
      required: true,
      secret: true,
      type: 'string',
      description: 'Session encryption secret',
    },
    {
      name: 'ALLOWED_ORIGINS',
      required: false,
      secret: false,
      type: 'string',
      description: 'Comma-separated CORS allowed origins',
    },
  ],

  // 🔹 Third-Party Services
  thirdParty: [
    {
      name: 'SAM_VALIDATOR_URL',
      required: true,
      secret: false,
      type: 'url',
      description: 'SAM validator base URL used by the webhook service',
    },
    {
      name: 'AIRTABLE_API_KEY',
      required: false,
      secret: true,
      type: 'string',
      description: 'Airtable API key',
    },
    {
      name: 'AIRTABLE_COMPANIES_BASE_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'Airtable companies base ID',
    },
    {
      name: 'AIRTABLE_COACHES_BASE_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'Airtable coaches base ID',
    },
    {
      name: 'GCP_PROJECT_ID',
      required: false,
      secret: false,
      type: 'string',
      description: 'Google Cloud project ID',
    },
    {
      name: 'AI_PROVIDER',
      required: false,
      secret: false,
      type: 'string',
      validValues: ['perplexity', 'openai', 'anthropic'],
      description: 'AI content assistant provider',
    },
    {
      name: 'AI_API_KEY',
      required: false,
      secret: true,
      type: 'string',
      description: 'AI provider API key',
    },
  ],
};

/**
 * Get all configuration variables as a flat array
 * @returns {ConfigVar[]} All configuration variables
 */
function getAllConfigVars() {
  return Object.values(CONFIG_SCHEMA).flat();
}

/**
 * Validate environment variables against schema
 * @param {Object} env - Environment variables object (defaults to process.env)
 * @returns {Object} Validation result
 */
function validateConfig(env = process.env) {
  const errors = [];
  const warnings = [];
  const missing = [];

  const appEnv = env.APP_ENV || 'dev';
  const allVars = getAllConfigVars();

  for (const configVar of allVars) {
    const value = env[configVar.name];

    // Check if required variable is missing
    if (configVar.required && !value) {
      missing.push(configVar.name);
      errors.push(`Missing required variable: ${configVar.name} - ${configVar.description}`);
      continue;
    }

    // Skip validation if not set and not required
    if (!value) {
      continue;
    }

    // Type validation
    switch (configVar.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${configVar.name} must be a number, got: ${value}`);
        }
        break;

      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          errors.push(`${configVar.name} must be a boolean (true/false), got: ${value}`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch (e) {
          errors.push(`${configVar.name} must be a valid URL, got: ${value}`);
        }
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${configVar.name} must be a valid email, got: ${value}`);
        }
        break;
    }

    // Enum validation
    if (configVar.validValues && !configVar.validValues.includes(value)) {
      errors.push(
        `${configVar.name} must be one of: ${configVar.validValues.join(', ')}, got: ${value}`
      );
    }
  }

  // Environment-specific validation
  if (appEnv === 'prod') {
    // Production must use MySQL for Ghost
    if (env.GHOST_DB_CLIENT === 'sqlite3') {
      errors.push('CRITICAL: Production must use MySQL for Ghost (GHOST_DB_CLIENT=mysql)');
    }

    // Production must not have localhost URLs
    const urlVars = allVars.filter((v) => v.type === 'url');
    for (const configVar of urlVars) {
      const value = env[configVar.name];
      if (value && value.includes('localhost')) {
        errors.push(`${configVar.name} cannot contain localhost in production: ${value}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
  };
}

/**
 * Print configuration status to console
 * @param {Object} env - Environment variables object (defaults to process.env)
 */
function printConfigStatus(env = process.env) {
  console.log('🔍 Configuration Validation');
  console.log('==========================\n');

  const result = validateConfig(env);

  console.log(`APP_ENV: ${env.APP_ENV || 'NOT SET'}`);
  console.log(`NODE_ENV: ${env.NODE_ENV || 'NOT SET'}`);
  console.log(`PUBLIC_BASE_URL: ${env.PUBLIC_BASE_URL || 'NOT SET'}`);
  console.log('');

  if (result.valid) {
    console.log('✅ All required configuration is valid\n');
  } else {
    console.error('❌ Configuration validation failed:\n');
    result.errors.forEach((error) => {
      console.error(`  • ${error}`);
    });
    console.error('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    result.warnings.forEach((warning) => {
      console.warn(`  • ${warning}`);
    });
    console.warn('');
  }

  return result;
}

/**
 * Require valid configuration or crash
 * Call this at application startup
 * @param {Object} env - Environment variables object (defaults to process.env)
 */
function requireValidConfig(env = process.env) {
  const result = validateConfig(env);

  if (!result.valid) {
    printConfigStatus(env);
    console.error('❌ FATAL: Invalid configuration. Application cannot start.\n');
    console.error('Please fix the configuration errors above and try again.\n');
    process.exit(1);
  }
}

module.exports = {
  CONFIG_SCHEMA,
  getAllConfigVars,
  validateConfig,
  printConfigStatus,
  requireValidConfig,
};
