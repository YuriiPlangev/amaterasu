import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ userId: null }, { status: 200 });
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ userId: null }, { status: 200 });
    }
    return NextResponse.json({ userId: decoded?.sub || null }, { status: 200 });
  } catch {
    return NextResponse.json({ userId: null }, { status: 200 });
  }
}
