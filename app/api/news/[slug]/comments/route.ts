import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';
import axios from 'axios';

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);

    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL не настроен' }, { status: 500 });
    }

    // Сначала получаем пост по slug, чтобы узнать его ID
    const postResponse = await axios.get(`${WP_URL}/wp-json/wp/v2/posts`, {
      params: { slug },
    });

    if (!postResponse.data || postResponse.data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const postId = postResponse.data[0].id;

    // Получаем комментарии к посту через кастомный endpoint
    const commentsResponse = await axios.get(
      `${WP_URL}/wp-json/custom/v1/posts/${postId}/comments`
    );

    return NextResponse.json(commentsResponse.data);
  } catch (error: any) {
    console.error('Error fetching comments:', error.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);

    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL не настроен' }, { status: 500 });
    }

    // Проверяем авторизацию
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

    // Получаем контент комментария
    const body = await request.json().catch(() => ({}));
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Получаем ID поста по slug
    const postResponse = await axios.get(`${WP_URL}/wp-json/wp/v2/posts`, {
      params: { slug },
    });

    if (!postResponse.data || postResponse.data.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postId = postResponse.data[0].id;

    // Создаем комментарий через кастомный endpoint WordPress
    const commentResponse = await axios.post(
      `${WP_URL}/wp-json/custom/v1/comments`,
      {
        post_id: postId,
        user_id: decoded.sub,
        content: content.trim(),
      }
    );

    return NextResponse.json(commentResponse.data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}