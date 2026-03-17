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
  const wcKey = process.env.WC_KEY;
  const wcSecret = process.env.WC_SECRET;
  const userId = payload.sub;

  if (wpUrl && wcKey && wcSecret && userId) {
    try {
      const url = new URL(`${wpUrl.replace(/\/+$/, "")}/wp-json/wp/v2/users/${userId}`);

// Указываем правильные поля (те, что в register_rest_field)
url.searchParams.set("_fields", "id,availableAvatars,currentAvatar");

const basic = Buffer.from(`${wcKey}:${wcSecret}`).toString("base64");
const res = await fetch(url.toString(), {
  headers: {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/json",
  },
  cache: "no-store",
});

if (res.ok) {
  const data = await res.json();

  // Берем данные из camelCase ключей
  const rawAvailable = data.availableAvatars; 
  if (Array.isArray(rawAvailable)) {
    availableAvatars = rawAvailable.map((v: any) => String(v));
  }

  if (data.currentAvatar) {
    currentAvatar = String(data.currentAvatar);
  }
}
    } catch (e) {
        console.error("WP Fetch Error:", e);
    }
  }

  return NextResponse.json({
    id: payload.sub,
    login,
    roles: (payload.roles as string[]) || [],
    displayName: profile.displayName ?? login,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    avatarId: profile.avatarId ?? "",
    availableAvatars,
    currentAvatar,
  });
}
