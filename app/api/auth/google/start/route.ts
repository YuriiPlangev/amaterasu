import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const OAUTH_STATE_COOKIE = "oauth_state";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !siteUrl) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  const requestUrl = new URL(req.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || "/uk/account";

  const stateNonce = crypto.randomBytes(24).toString("hex");
  const statePayload = `${stateNonce}|${returnTo}`;

  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", statePayload);
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, stateNonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
