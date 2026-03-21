import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";

// 1. Принудительно отключаем кэширование на уровне всего роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let profile: { displayName?: string; email?: string; phone?: string; avatarId?: string } = {};
  try {
    const profileCookie = cookieStore.get(PROFILE_COOKIE)?.value;
    if (profileCookie) profile = JSON.parse(decodeURIComponent(profileCookie));
  } catch {
    // ignore
  }

  let availableAvatars: string[] = ["default"];
  let currentAvatar: string | null = null;

  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  // Берем данные для Application Password из .env
  const appLogin = process.env.WP_USER_LOGIN;
  const appPass = process.env.WP_USER_PASS;
  
  const userId = payload.sub;

  // Проверяем наличие именно новых переменных
  if (wpUrl && appLogin && appPass && userId) {
    try {
      const url = new URL(`${wpUrl.replace(/\/+$/, "")}/wp-json/wp/v2/users/${userId}`);
      url.searchParams.set("v", Date.now().toString()); 
      url.searchParams.set("_fields", "id,availableAvatars,currentAvatar,current_avatar");

      // Формируем Basic Auth из Логина и Пароля приложения
      const authHeader = Buffer.from(`${appLogin}:${appPass}`).toString("base64");
      
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        
        const rawAvailable = data.availableAvatars; 
        if (Array.isArray(rawAvailable)) {
          availableAvatars = rawAvailable.map((v: any) => String(v));
        }

        const rawAvatar = data.currentAvatar ?? data.current_avatar;
        if (rawAvatar) {
          currentAvatar = String(rawAvatar);
        }
      } else {
        console.error("WP Response Error:", res.status);
      }
    } catch (e) {
        console.error("WP Fetch Error:", e);
    }
  }
  if (!currentAvatar && profile.avatarId && String(profile.avatarId).trim() !== "default") {
    currentAvatar = String(profile.avatarId).trim();
  }

  return NextResponse.json({
    id: payload.sub,
    login,
    roles: (payload.roles as string[]) || [],
    displayName: profile.displayName ?? login,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    avatarId: profile.avatarId ?? "",
    availableAvatars, // Должно быть ["default", "avatar_premium"]
    currentAvatar,
  });
}