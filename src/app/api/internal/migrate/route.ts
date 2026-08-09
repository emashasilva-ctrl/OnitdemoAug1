import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Temporary, one-off endpoint to apply a pending schema migration to
// production Turso. `prisma migrate deploy` can't connect to libsql:// URLs,
// and the Turso credentials are marked Sensitive in Vercel (unreadable
// outside the deployed app), so this runs the ALTER TABLE from inside the
// app itself, where those env vars are available normally. Delete after use.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-migrate-secret");
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT;`);

  return NextResponse.json({ ok: true });
}
