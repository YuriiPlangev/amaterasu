import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";
import { serialize } from "cookie";

const PROFILE_COOKIE = "profile";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** PATCH /api/auth/profile — оновити контактні дані (зберігається в cookie) */
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: { displayName?: string; email?: string; phone?: string; avatarId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const login = (payload.login as string) || "Unknown";
  let profile: { displayName?: string; email?: string; phone?: string; avatarId?: string } = {};
  try {
    const profileCookie = cookieStore.get(PROFILE_COOKIE)?.value;
    if (profileCookie) profile = JSON.parse(decodeURIComponent(profileCookie));
  } catch {
    // ignore
  }

  if (body.displayName !== undefined) profile.displayName = String(body.displayName).trim() || login;
  if (body.email !== undefined) profile.email = String(body.email).trim();
  if (body.phone !== undefined) profile.phone = String(body.phone).trim();
  if (body.avatarId !== undefined) profile.avatarId = String(body.avatarId).trim();

  const value = encodeURIComponent(JSON.stringify(profile));
  const cookie = serialize(PROFILE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return new NextResponse(JSON.stringify({ success: true, profile: { displayName: profile.displayName, email: profile.email, phone: profile.phone, avatarId: profile.avatarId } }), {
    status: 200,
    headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
  });
}
