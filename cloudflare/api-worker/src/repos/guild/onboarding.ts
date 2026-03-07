import type { PrismaClient } from '@prisma/client'

export interface CreateOnboardingProfileParams {
  email: string
  name: string
  organization?: string
  areas: string[]
  outcomes: string[]
  journeyStage?: string
  source?: string
  roleAssigned: string
  viaUserId?: string
}

export async function createOnboardingProfile(
  prisma: PrismaClient,
  params: CreateOnboardingProfileParams
): Promise<string> {
  const profile = await prisma.onboardingProfile.create({
    data: {
      email: params.email,
      name: params.name,
      organization: params.organization,
      areas: params.areas,
      outcomes: params.outcomes,
      journeyStage: params.journeyStage,
      source: params.source,
      roleAssigned: params.roleAssigned,
      viaUserId: params.viaUserId,
      provisionedAt: params.viaUserId ? new Date() : null,
    },
    select: { id: true },
  })
  return profile.id
}

/**
 * Link an onboarding profile to a guild user on first login.
 * Called by ensure-guild-user middleware when a new user's email matches.
 */
export async function linkOnboardingToGuildUser(
  prisma: PrismaClient,
  email: string,
  guildUserId: string
): Promise<void> {
  await prisma.onboardingProfile.updateMany({
    where: {
      email: email.toLowerCase(),
      guildUserId: null,
    },
    data: { guildUserId },
  })
}

export async function getOnboardingProfile(
  prisma: PrismaClient,
  guildUserId: string
) {
  return prisma.onboardingProfile.findUnique({
    where: { guildUserId },
  })
}
