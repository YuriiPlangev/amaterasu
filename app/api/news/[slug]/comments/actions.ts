import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';
import axios from 'axios';

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

// PATCH: редактирование комментария
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL не настроен' }, { status: 500 });
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { commentId, content } = body;
    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    // Проверяем владельца комментария через WordPress кастомный endpoint
    // (реализуйте проверку userId на стороне WP API)
    const response = await axios.patch(
      `${WP_URL}/wp-json/custom/v1/comments/${commentId}`,
      { content: content.trim(), user_id: decoded.sub }
    );
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: удаление комментария
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL не настроен' }, { status: 500 });
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { commentId } = body;
    if (!commentId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    // Проверяем владельца комментария через WordPress кастомный endpoint
    // (реализуйте проверку userId на стороне WP API)
    const response = await axios.delete(
      `${WP_URL}/wp-json/custom/v1/comments/${commentId}`,
      { data: { user_id: decoded.sub } }
    );
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
