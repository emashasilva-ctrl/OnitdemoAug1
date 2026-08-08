import "server-only";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

// Hand-rolled OAuth 2.0 Authorization Code flow (+ PKCE for Google) using
// plain fetch. We intentionally don't depend on a client library here —
// the flow is a handful of well-documented HTTP calls, and it keeps this
// security-sensitive code auditable and free of third-party churn.

export type OAuthProvider = "google" | "facebook";

export const OAUTH_STATE_COOKIE = "onit_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "onit_oauth_verifier";
export const OAUTH_NEXT_COOKIE = "onit_oauth_next";
export const OAUTH_COOKIE_MAX_AGE = 600; // 10 minutes

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new OAuthConfigError(`${name} is not set. Add it to .env to enable this login option.`);
  }
  return value;
}

export class OAuthConfigError extends Error {}

function redirectUri(provider: OAuthProvider): string {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  return `${appUrl}/api/auth/${provider}/callback`;
}

export function generateRandomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("hex");
}

async function createPKCECodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return Buffer.from(digest).toString("base64url");
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.byteLength; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export function verifyState(storedState: string | undefined, callbackState: string | null): boolean {
  if (!storedState || !callbackState) return false;
  return constantTimeEqual(storedState, callbackState);
}

// Only allow same-site relative paths for post-login redirects, since this
// value round-trips through a query param and a cookie before we redirect to it.
export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

interface OAuthIdentity {
  providerId: string;
  email: string;
  name: string;
}

// --- Google ---

export async function buildGoogleAuthorizationUrl(state: string, codeVerifier: string) {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const codeChallenge = await createPKCECodeChallenge(codeVerifier);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri("google"));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", "openid email profile");
  return url.toString();
}

export async function fetchGoogleIdentity(code: string, codeVerifier: string): Promise<OAuthIdentity> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri("google"),
    code_verifier: codeVerifier,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${await tokenResponse.text()}`);
  }
  const tokens = (await tokenResponse.json()) as { access_token: string };

  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userInfoResponse.ok) {
    throw new Error(`Google userinfo request failed: ${await userInfoResponse.text()}`);
  }
  const profile = (await userInfoResponse.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!profile.email || profile.email_verified === false) {
    throw new Error("Google account has no verified email address.");
  }

  return { providerId: profile.sub, email: profile.email, name: profile.name ?? profile.email };
}

// --- Facebook ---

const FACEBOOK_API_VERSION = "v21.0";

export function buildFacebookAuthorizationUrl(state: string) {
  const clientId = requireEnv("FACEBOOK_CLIENT_ID");

  const url = new URL(`https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri("facebook"));
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "public_profile,email");
  return url.toString();
}

export async function fetchFacebookIdentity(code: string): Promise<OAuthIdentity> {
  const clientId = requireEnv("FACEBOOK_CLIENT_ID");
  const clientSecret = requireEnv("FACEBOOK_CLIENT_SECRET");

  const tokenUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri("facebook"));
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl);
  if (!tokenResponse.ok) {
    throw new Error(`Facebook token exchange failed: ${await tokenResponse.text()}`);
  }
  const tokens = (await tokenResponse.json()) as { access_token: string };

  const profileUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me`);
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", tokens.access_token);

  const profileResponse = await fetch(profileUrl);
  if (!profileResponse.ok) {
    throw new Error(`Facebook profile request failed: ${await profileResponse.text()}`);
  }
  const profile = (await profileResponse.json()) as { id: string; name?: string; email?: string };

  if (!profile.email) {
    throw new Error("Facebook account has no email address on file.");
  }

  return { providerId: profile.id, email: profile.email, name: profile.name ?? profile.email };
}

// --- Shared account linking ---

export async function findOrCreateOAuthUser(provider: OAuthProvider, identity: OAuthIdentity) {
  const existingByProvider = await prisma.user.findUnique({
    where:
      provider === "google"
        ? { googleId: identity.providerId }
        : { facebookId: identity.providerId },
  });
  if (existingByProvider) return { user: existingByProvider, isNew: false };

  const providerIdData = provider === "google"
    ? { googleId: identity.providerId }
    : { facebookId: identity.providerId };

  const existingByEmail = await prisma.user.findUnique({ where: { email: identity.email } });
  if (existingByEmail) {
    const user = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: providerIdData,
    });
    return { user, isNew: false };
  }

  const user = await prisma.user.create({
    data: {
      email: identity.email,
      name: identity.name,
      isVendor: false,
      ...providerIdData,
    },
  });
  await sendEmail({ to: user.email, ...welcomeEmail({ name: user.name, isVendor: user.isVendor }) });
  return { user, isNew: true };
}
