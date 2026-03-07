/**
 * OTP generation and verification.
 *
 * Uses crypto.getRandomValues for secure 6-digit codes.
 * Codes expire after 10 minutes. Max 5 verification attempts.
 */

import type { PrismaClient } from '@prisma/client'

const OTP_LENGTH = 6
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

export function generateOtp(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, '0')
}

export async function createOtpChallenge(
  prisma: PrismaClient,
  email: string
): Promise<{ id: string; code: string }> {
  const code = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

  const challenge = await prisma.otpChallenge.create({
    data: { email: email.toLowerCase(), code, expiresAt },
    select: { id: true },
  })

  return { id: challenge.id, code }
}

export type VerifyResult =
  | { valid: true; challengeId: string }
  | { valid: false; reason: 'expired' | 'invalid' | 'max_attempts' | 'not_found' }

export async function verifyOtp(
  prisma: PrismaClient,
  email: string,
  code: string
): Promise<VerifyResult> {
  // Find the most recent unexpired, unverified challenge for this email
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      email: email.toLowerCase(),
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!challenge) {
    return { valid: false, reason: 'not_found' }
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'max_attempts' }
  }

  // Increment attempts
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  })

  if (challenge.code !== code) {
    return { valid: false, reason: 'invalid' }
  }

  // Mark as verified
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { verified: true },
  })

  return { valid: true, challengeId: challenge.id }
}
