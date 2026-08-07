import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Diagnostic only — logs where/whether an env var has a character outside
// the ByteString range (0-255) that would break HTTP header construction,
// without ever logging the actual value.
function logByteStringCheck(name: string, value: string | undefined) {
  if (!value) {
    console.log(`[db] ${name} is not set`);
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      console.error(
        `[db] ${name} has a non-ByteString character at index ${i} (code ${code}), length ${value.length}`
      );
      return;
    }
  }
  console.log(`[db] ${name} OK — length ${value.length}, all characters in ByteString range`);
}

// Local dev keeps using the plain file-based SQLite client (prisma/dev.db).
// Production (Vercel) has no writable/shared filesystem, so it connects to
// Turso instead via the libSQL driver adapter — same schema, hosted database.
function createPrismaClient(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    logByteStringCheck("TURSO_DATABASE_URL", process.env.TURSO_DATABASE_URL);
    logByteStringCheck("TURSO_AUTH_TOKEN", process.env.TURSO_AUTH_TOKEN);
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
