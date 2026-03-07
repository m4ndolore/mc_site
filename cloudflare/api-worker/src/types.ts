export interface Env {
  // Cloudflare bindings
  HYPERDRIVE: Hyperdrive

  // Auth
  OIDC_ISSUER_ALLOWLIST: string
  OIDC_AUDIENCE: string
  OIDC_ROLES_CLAIM: string
  CONSOLE_ROLLOUT_MODE?: string
  CONSOLE_MIN_ROLE_LEVEL?: string

  // Authentik admin API (provisioning)
  VIA_API_TOKEN: string
  VIA_RESTRICTED_GROUP_ID: string
  VIA_TRUSTED_GROUP_ID: string
  VIA_RECOVERY_FLOW_SLUG: string

  // Turnstile
  TURNSTILE_SECRET_KEY: string

  // Email (OTP)
  OTP_FROM_EMAIL?: string
  RESEND_API_KEY?: string

  // Origins
  MC_PUBLIC_URL: string
  VIA_ISSUER_URL: string
  LEGACY_API_ORIGIN: string
  CORS_ALLOWED_ORIGINS: string
}

export interface UserContext {
  issuer: string
  sub: string
  email: string | null
  name: string | null
  roles: string[]
  roleLevel: number
}

export interface AppVars {
  requestId: string
  user: UserContext
  guildUserId: string
}
