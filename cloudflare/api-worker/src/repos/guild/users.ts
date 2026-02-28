import type { PrismaClient } from '@prisma/client'

interface UpsertGuildUserParams {
  issuer: string
  subject: string
  email: string | null
  name: string | null
}

export async function upsertGuildUser(
  prisma: PrismaClient,
  params: UpsertGuildUserParams
): Promise<string> {
  const user = await prisma.guildUser.upsert({
    where: {
      issuer_subject: {
        issuer: params.issuer,
        subject: params.subject,
      },
    },
    create: {
      issuer: params.issuer,
      subject: params.subject,
      email: params.email,
      name: params.name,
    },
    update: {
      ...(params.email !== null && { email: params.email }),
      ...(params.name !== null && { name: params.name }),
      lastSeenAt: new Date(),
    },
    select: { id: true },
  })
  return user.id
}
