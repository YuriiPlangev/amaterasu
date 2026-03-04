import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';

// Используем глобальную переменную, чтобы Map не стирался так часто при HMR в разработке
const globalForComments = global as unknown as { commentsStore: Map<string, any[]> };
const commentsStore = globalForComments.commentsStore || new Map();
if (process.env.NODE_ENV !== 'production') globalForComments.commentsStore = commentsStore;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug); // ДЕКОДИРУЕМ КИРИЛЛИЦУ
    
    const comments = (commentsStore.get(slug) || [])
      .map(({ id, author, content, date }: any) => ({
        id, author, content, date,
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(comments);
  } catch (e) {
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
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})); // Защита от пустого body
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const comment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      postId: slug,
      author: decoded.login || decoded.name || 'User', // Проверь, какое поле в токене
      userId: decoded.sub,
      content: content.trim(),
      date: new Date().toISOString(),
    };

    const postComments = commentsStore.get(slug) || [];
    postComments.push(comment);
    commentsStore.set(slug, postComments);

    return NextResponse.json(
      { id: comment.id, author: comment.author, content: comment.content, date: comment.date },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('CRITICAL ERROR:', error); // Смотри это в терминале!
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}