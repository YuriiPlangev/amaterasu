import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";
import { serialize } from "cookie";

const PROFILE_COOKIE = "profile";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** PATCH /api/auth/profile — оновити контактні дані (cookie + WordPress user meta для аватара) */
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
  const userId = String(payload.sub ?? "");
  let profile: { displayName?: string; email?: string; phone?: string; avatarId?: string } = {};
  try {
    const profileCookie = cookieStore.get(PROFILE_COOKIE)?.value;
    if (profileCookie) profile = JSON.parse(decodeURIComponent(profileCookie));
  } catch {
    // ignore
  }

  if (body.displayName !== undefined) {
    const name = String(body.displayName).trim() || login;
    if (name.toLowerCase().includes('admin')) {
      return NextResponse.json(
        { error: 'Відображуване ім\'я не може містити слово "Admin"' },
        { status: 400 }
      );
    }
    profile.displayName = name || login;
  }
  if (body.email !== undefined) profile.email = String(body.email).trim();
  if (body.phone !== undefined) profile.phone = String(body.phone).trim();
  if (body.avatarId !== undefined) profile.avatarId = String(body.avatarId).trim();

  // Синхронизируем аватар, displayName, phone і email в WordPress
  const needsWpSync = body.avatarId !== undefined || body.displayName !== undefined || body.phone !== undefined || body.email !== undefined;
  if (userId && needsWpSync) {
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    const appLogin = process.env.WP_USER_LOGIN;
    const appPass = process.env.WP_USER_PASS;
    if (wpUrl && appLogin && appPass) {
      try {
        const url = `${wpUrl.replace(/\/+$/, "")}/wp-json/wp/v2/users/${userId}`;
        const authHeader = Buffer.from(`${appLogin}:${appPass}`).toString("base64");
        const wpBody: Record<string, string> = {};
        if (body.avatarId !== undefined) wpBody.current_avatar = profile.avatarId || "";
        if (body.displayName !== undefined && profile.displayName !== undefined) wpBody.name = profile.displayName;
        if (body.phone !== undefined) wpBody.phone = profile.phone ?? "";
        if (body.email !== undefined && profile.email) wpBody.email = profile.email;
        if (Object.keys(wpBody).length > 0) {
          const wpRes = await fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(wpBody),
          });
          if (!wpRes.ok) {
            const errData = await wpRes.json().catch(() => ({}));
            const errMsg = errData?.message || errData?.code || errData?.error || wpRes.statusText;
            const userMsg = typeof errMsg === "string" && errMsg.includes("rest_")
              ? "Не вдалося зберегти дані в профілі. Спробуйте інше імʼя або зверніться до підтримки."
              : String(errMsg);
            return NextResponse.json({ error: userMsg }, { status: wpRes.status });
          }
        }
      } catch (e) {
        console.error("[Profile] Failed to sync to WordPress:", e);
        return NextResponse.json(
          { error: "Помилка зʼєднання з сервером. Спробуйте пізніше." },
          { status: 502 }
        );
      }
    }
  }

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
