/**
 * Cloudflare Turnstile server-side verification.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const body: Record<string, string> = {
    secret: secretKey,
    response: token,
  }
  if (remoteIp) body.remoteip = remoteIp

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return { valid: false, errors: [`HTTP ${res.status}`] }
  }

  const data = await res.json() as TurnstileResult
  return {
    valid: data.success,
    errors: data['error-codes'] ?? [],
  }
}
