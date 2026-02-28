import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const { Pool } = pg

// Module-scope singleton — reused across requests within the Worker isolate
let pool: InstanceType<typeof Pool> | null = null
let prisma: PrismaClient | null = null

export function getDb(hyperdrive: Hyperdrive) {
  if (!pool) {
    pool = new Pool({ connectionString: hyperdrive.connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })
  }
  return { prisma: prisma!, pool: pool! }
}
