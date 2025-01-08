import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Log queries in development
if (process.env.NODE_ENV !== "production") {
  prisma.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    console.log('Query:', JSON.stringify(e.query, null, 2))
    console.log('Params:', JSON.stringify(e.params, null, 2))
    console.log('Duration:', e.duration + 'ms\n')
  })
} 