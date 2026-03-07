import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";

function isTelegramDataValid(data: Record<string, any>, botToken: string): boolean {
  const receivedHash = String(data.hash || "");
  if (!receivedHash) return false;

  const entries = Object.entries(data)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  const dataCheckString = entries
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(calculatedHash, "hex"), Buffer.from(receivedHash, "hex"));
}

function safeUsername(base: string, fallback: string): string {
  const normalized = String(base || "")
    .replace(/[^a-zA-Z0-9_\-.]/g, "_")
    .slice(0, 40);
  return normalized || fallback;
}

export async function POST(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  const wpUrl = process.env.WP_URL;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!jwtSecret || !wpUrl || !botToken) {
    return NextResponse.json({ error: "Telegram auth is not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const returnToRaw = String(body?.returnTo || "/uk/account");

    if (!body?.id || !body?.auth_date || !body?.hash) {
      return NextResponse.json({ error: "Invalid telegram payload" }, { status: 400 });
    }

    const authDate = Number(body.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || now - authDate > 86400) {
      return NextResponse.json({ error: "Telegram auth data expired" }, { status: 401 });
    }

    const isValid = isTelegramDataValid(body, botToken);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid telegram signature" }, { status: 401 });
    }

    const providerUserId = String(body.id);
    const fallbackUsername = `tg_${providerUserId}`;
    const username = safeUsername(body.username || fallbackUsername, fallbackUsername);
    const displayName = [body.first_name, body.last_name].filter(Boolean).join(" ") || username;

    const socialRes = await fetch(`${wpUrl}/wp-json/custom/v1/social-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "telegram",
        provider_user_id: providerUserId,
        email: null,
        username,
        display_name: displayName,
      }),
    });

    const socialData = await socialRes.json();
    if (!socialRes.ok || !socialData?.user?.ID) {
      return NextResponse.json({ error: socialData?.message || "Social auth failed" }, { status: 500 });
    }

    const user = socialData.user;
    const payload = {
      sub: String(user.ID),
      login: user.user_login,
      roles: user.roles || [],
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
    const isSafeReturnTo = returnToRaw.startsWith("/");

    const response = NextResponse.json({
      success: true,
      returnTo: isSafeReturnTo ? returnToRaw : "/uk/account",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Telegram auth error:", error);
    return NextResponse.json({ error: "Telegram auth failed" }, { status: 500 });
  }
}
