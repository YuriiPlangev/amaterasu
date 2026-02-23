import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";

const PROFILE_COOKIE = "profile";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const login = (payload.login as string) || "Unknown";
  let profile: { displayName?: string; email?: string; phone?: string } = {};
  try {
    const profileCookie = cookieStore.get(PROFILE_COOKIE)?.value;
    if (profileCookie) profile = JSON.parse(decodeURIComponent(profileCookie));
  } catch {
    // ignore
  }

  return NextResponse.json({
    id: payload.sub,
    login,
    roles: (payload.roles as string[]) || [],
    displayName: profile.displayName ?? login,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
  });
}



