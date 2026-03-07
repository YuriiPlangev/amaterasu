import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const OAUTH_STATE_COOKIE = "oauth_state";

function safeUsernameFromEmail(email?: string, fallback = "google_user") {
  if (!email) return fallback;
  const localPart = email.split("@")[0] || fallback;
  return localPart.replace(/[^a-zA-Z0-9_\-.]/g, "_").slice(0, 40) || fallback;
}

export async function GET(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const wpUrl = process.env.WP_URL;
  const requestOrigin = new URL(req.url).origin;
  const baseUrl = requestOrigin;

  if (!jwtSecret || !clientId || !clientSecret || !wpUrl) {
    return NextResponse.json({ error: "Google auth is not configured" }, { status: 500 });
  }

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state") || "";

  console.log("🔷 Google OAuth callback started");
  console.log("Code:", code ? "✓ received" : "✗ missing");
  console.log("State:", state ? "✓ received" : "✗ missing");

  if (!code || !state.includes("|")) {
    console.error("❌ Missing code or state");
    return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=google_auth_failed`);
  }

  const [nonceFromState, returnToRaw] = state.split("|", 2);
  const nonceFromCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value || "";

  if (!nonceFromState || !nonceFromCookie || nonceFromState !== nonceFromCookie) {
    return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=google_state_mismatch`);
  }

  const redirectUri = new URL("/api/auth/google/callback", requestOrigin).toString();

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("🔷 Token response:", tokenRes.ok ? "✓ success" : `✗ ${tokenRes.status}`);
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("❌ Token error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=google_token_failed`);
    }

    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });

    const profile = await profileRes.json();
    console.log("🔷 Profile response:", profileRes.ok ? "✓ success" : `✗ ${profileRes.status}`);
    console.log("Profile data:", { sub: profile?.sub, email: profile?.email, name: profile?.name });
    if (!profileRes.ok || !profile?.sub) {
      console.error("❌ Profile error:", profile);
      return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=google_profile_failed`);
    }

    const socialRes = await fetch(`${wpUrl}/wp-json/custom/v1/social-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google",
        provider_user_id: String(profile.sub),
        email: profile.email || null,
        username: safeUsernameFromEmail(profile.email, `google_${profile.sub}`),
        display_name: profile.name || profile.email || "Google User",
      }),
    });

    const socialData = await socialRes.json();
    console.log("🔷 WordPress social-auth response:", socialRes.ok ? "✓ success" : `✗ ${socialRes.status}`);
    console.log("WordPress response:", socialData);
    if (!socialRes.ok || !socialData?.user?.ID) {
      console.error("❌ Social auth error:", { status: socialRes.status, wpUrl, data: socialData });
      return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=social_auth_failed`);
    }

    const user = socialData.user;
    const payload = {
      sub: String(user.ID),
      login: user.user_login,
      roles: user.roles || [],
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    const isSafeReturnTo = returnToRaw.startsWith("/");
    const returnTo = isSafeReturnTo ? returnToRaw : "/uk/account";
    const response = NextResponse.redirect(`${baseUrl}${returnTo}`);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${baseUrl}/uk/auth/login?error=google_unexpected_error`);
  }
}
