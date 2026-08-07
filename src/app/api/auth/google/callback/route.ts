import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  fetchGoogleIdentity,
  findOrCreateOAuthUser,
  sanitizeNextPath,
  verifyState,
} from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(OAUTH_VERIFIER_COOKIE)?.value;
  const next = sanitizeNextPath(cookieStore.get(OAUTH_NEXT_COOKIE)?.value);

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_VERIFIER_COOKIE);
  cookieStore.delete(OAUTH_NEXT_COOKIE);

  const callbackState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !codeVerifier || !verifyState(storedState, callbackState)) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  try {
    const identity = await fetchGoogleIdentity(code, codeVerifier);
    const user = await findOrCreateOAuthUser("google", identity);
    await createSession(user.id);

    if (user.isVendor) {
      const ownedSalon = await prisma.salon.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (!ownedSalon) return NextResponse.redirect(new URL("/vendor/setup", request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
