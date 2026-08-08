import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 moved the migrate-time connection URL out of schema.prisma and
// into this file. The app's own runtime client (src/lib/db.ts) is separate
// and always connects via a driver adapter (Turso in production, the same
// local SQLite file here in dev) — this config is only used by `prisma
// migrate`/`prisma studio` etc.
//
// `prisma generate` also evaluates this file, but needs no live connection —
// it just can't crash without one. Vercel's build runs `prisma generate`
// with no plain DATABASE_URL set (only TURSO_DATABASE_URL there), so this
// must fall back instead of using the strict `env()` helper, which throws on
// a missing var.
export default defineConfig({
  datasource: {
    url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
