import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAuthConfigError,
  buildFacebookAuthorizationUrl,
  generateRandomToken,
  sanitizeNextPath,
} from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  const state = generateRandomToken();

  let authorizationUrl: string;
  try {
    authorizationUrl = buildFacebookAuthorizationUrl(state);
  } catch (error) {
    if (error instanceof OAuthConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: "/",
  };
  cookieStore.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  cookieStore.set(OAUTH_NEXT_COOKIE, next, cookieOptions);

  return NextResponse.redirect(authorizationUrl);
}
