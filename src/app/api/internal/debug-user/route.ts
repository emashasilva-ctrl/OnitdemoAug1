import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Temporary diagnostic endpoint — inspect a user record on production to
// debug the "no welcome email on Google sign-in" report. Delete after use.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-debug-secret");
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "missing email param" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      googleId: true,
      facebookId: true,
      passwordHash: true,
      isVendor: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}
