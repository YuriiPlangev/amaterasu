import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  // Удаляем cookie с токеном
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Удаляем cookie
  });

  return new NextResponse(
    JSON.stringify({ success: true, message: "Logged out successfully" }),
    {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
        "Content-Type": "application/json",
      },
    }
  );
}



