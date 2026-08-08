import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the migrate-time connection URL out of schema.prisma and
// into this file. The app's own runtime client (src/lib/db.ts) is separate
// and always connects via a driver adapter (Turso in production, the same
// local SQLite file here in dev) — this config is only used by `prisma
// migrate`/`prisma studio` etc.
export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
