/**
 * Authentik Admin API client for user provisioning.
 *
 * Uses the Authentik Core API to create users and assign them to groups.
 * Requires an API token with user-create + group-assign permissions.
 *
 * Docs: https://docs.goauthentik.io/developer-docs/api/
 */

export interface ProvisionResult {
  userId: string
  username: string
  role: string
  passwordSetUrl: string | null
}

interface AuthentikConfig {
  baseUrl: string        // e.g. "https://via.mergecombinator.com"
  apiToken: string       // Service account API token
  restrictedGroupId: string
  trustedGroupId: string
  recoveryFlowSlug: string  // Flow slug for password-set emails
}

// .mil, .gov, and common DoD subdomains → auto-promote to trusted
const GOV_SUFFIXES = [
  '.mil', '.gov', '.af.mil', '.army.mil', '.navy.mil',
  '.marines.mil', '.uscg.mil', '.socom.mil', '.disa.mil',
]

// Major defense contractors and FFRDCs — users with these corporate
// domains get auto-promoted to skip the password-set friction.
const TRUSTED_DOMAINS = new Set([
  // Primes
  'lockheedmartin.com', 'rtx.com', 'raytheon.com', 'northropgrumman.com',
  'gd.com', 'gdls.com', 'baesystems.com', 'l3harris.com',
  'leidos.com', 'saic.com', 'boozallen.com', 'caci.com',
  'mantech.com', 'parsons.com', 'peraton.com',
  // Defense tech
  'anduril.com', 'palantir.com', 'shieldai.com', 'epirus.com',
  'hermeus.com', 'relativityspace.com', 'rocketlabusa.com',
  'aerojet.com', 'bwxt.com', 'hii-co.com', 'textron.com',
  // FFRDCs and UARCs
  'mitre.org', 'rand.org', 'ida.org', 'sei.cmu.edu',
  'jhuapl.edu', 'll.mit.edu', 'sandia.gov', 'lanl.gov',
  // DIU, In-Q-Tel, service labs
  'iqt.org', 'nsin.mil',
])

export function shouldAutoPromote(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  if (GOV_SUFFIXES.some(suffix => domain === suffix.slice(1) || domain.endsWith(suffix))) return true
  return TRUSTED_DOMAINS.has(domain)
}

export async function provisionUser(
  config: AuthentikConfig,
  params: { email: string; name: string; skipRecoveryEmail?: boolean }
): Promise<ProvisionResult> {
  const { baseUrl, apiToken, restrictedGroupId, trustedGroupId, recoveryFlowSlug } = config
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }

  const autoPromote = shouldAutoPromote(params.email)
  const role = autoPromote ? 'trusted' : 'restricted'
  const groupId = autoPromote ? trustedGroupId : restrictedGroupId

  // Generate a username from email (before @, deduped if needed)
  const baseUsername = params.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')
  const username = await findAvailableUsername(baseUrl, headers, baseUsername)

  // 1. Create user
  const createRes = await fetch(`${baseUrl}/api/v3/core/users/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username,
      name: params.name,
      email: params.email,
      is_active: true,
      groups: [groupId],
    }),
  })

  if (!createRes.ok) {
    // Check if user already exists (409 or validation error with "already exists")
    const errBody = await createRes.text()
    if (createRes.status === 400 && errBody.includes('already exists')) {
      throw new ProvisionError('EMAIL_EXISTS', 'An account with this email already exists')
    }
    throw new ProvisionError('PROVISION_FAILED', `Authentik user creation failed: ${createRes.status} ${errBody}`)
  }

  const user = await createRes.json() as { pk: number; username: string }

  // 2. Send password-set email via recovery flow (skip if email already verified via OTP)
  let passwordSetUrl: string | null = null
  if (!params.skipRecoveryEmail) {
    try {
      const recoveryRes = await fetch(`${baseUrl}/api/v3/core/users/${user.pk}/recovery_email/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email_stage: recoveryFlowSlug,
        }),
      })
      if (recoveryRes.ok) {
        const recoveryData = await recoveryRes.json() as { link?: string }
        passwordSetUrl = recoveryData.link ?? null
      }
    } catch {
      // Non-fatal: user can use "forgot password" flow later
    }
  }

  return {
    userId: String(user.pk),
    username: user.username,
    role,
    passwordSetUrl,
  }
}

async function findAvailableUsername(
  baseUrl: string,
  headers: Record<string, string>,
  base: string
): Promise<string> {
  // Check if base username is available
  const checkRes = await fetch(
    `${baseUrl}/api/v3/core/users/?username=${encodeURIComponent(base)}`,
    { headers }
  )
  if (checkRes.ok) {
    const data = await checkRes.json() as { results: unknown[] }
    if (data.results.length === 0) return base
  }

  // Append random suffix
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export class ProvisionError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ProvisionError'
  }
}
