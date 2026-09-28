import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse a single client across invocations (dev hot-reload and serverless warm
// starts alike) to avoid opening a new database connection on every request,
// which reduces intermittent connection errors on the serverless database.
globalForPrisma.prisma = prisma;
