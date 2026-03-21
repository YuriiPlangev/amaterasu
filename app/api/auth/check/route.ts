import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { 'Cache-Control': 'private, max-age=60' } }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { 'Cache-Control': 'private, max-age=60' } }
    );
  }

  return NextResponse.json(
    { authenticated: true },
    { headers: { 'Cache-Control': 'private, max-age=60' } }
  );
}



