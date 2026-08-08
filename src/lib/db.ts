import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 always connects through a driver adapter — there's no more
// schema-embedded connection URL. Local dev and production both use the
// same libSQL adapter (libSQL is SQLite-compatible and supports local
// `file:` URLs directly); only the target URL differs — a local file in
// dev, the hosted Turso database in production.
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
