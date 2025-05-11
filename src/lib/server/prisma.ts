import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// If the prisma client is already on globalThis, use it.
// Otherwise, create a new one and attach it.
const prismaClient = globalThis.prisma ?? new PrismaClient({
  log: ['query']
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaClient;
}

export const prisma = prismaClient;