import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Single Prisma instance. In dev, global caching prevents exhausting
 * connections during hot-reloads of ts-node-dev.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ["error"] : ["error", "warn"],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;