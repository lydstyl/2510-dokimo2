import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
  const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const url = dbUrl.startsWith('file:') ? dbUrl : `file:${dbUrl}`
  const relativePath = url.replace(/^file:/, '')
  const absoluteUrl = path.isAbsolute(relativePath)
    ? url
    : `file:${path.join(process.cwd(), relativePath)}`
  const adapter = new PrismaBetterSqlite3({ url: absoluteUrl })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any)
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
