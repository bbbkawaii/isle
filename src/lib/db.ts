import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Reuse a client while a Vercel instance stays warm. This also avoids creating
// an extra database pool when Next reloads modules during local development.
globalForPrisma.prisma = prisma
