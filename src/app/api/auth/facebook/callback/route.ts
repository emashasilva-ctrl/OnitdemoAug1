import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  fetchFacebookIdentity,
  findOrCreateOAuthUser,
  sanitizeNextPath,
  verifyState,
} from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const next = sanitizeNextPath(cookieStore.get(OAUTH_NEXT_COOKIE)?.value);

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_NEXT_COOKIE);

  const callbackState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !verifyState(storedState, callbackState)) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  try {
    const identity = await fetchFacebookIdentity(code);
    const { user, isNew } = await findOrCreateOAuthUser("facebook", identity);
    await createSession(user.id);

    if (isNew) {
      const chooserUrl = new URL("/become-a-vendor", request.url);
      chooserUrl.searchParams.set("next", next);
      return NextResponse.redirect(chooserUrl);
    }

    if (user.isVendor) {
      const ownedSalon = await prisma.salon.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (!ownedSalon) return NextResponse.redirect(new URL("/vendor/setup", request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Facebook OAuth callback failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
