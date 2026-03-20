import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';
import axios from 'axios';

const WP_URL = (process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL || "").replace(/\/+$/, "");

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

    const raw = commentsResponse.data;
    let comments = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

    // Обогащаем avatarId: кастомный endpoint — один запрос на всех
    const userIdsNeedAvatar = [
      ...new Set(
        comments
          .filter((c: any) => c.userId && (!c.avatarId || String(c.avatarId).trim() === "default"))
          .map((c: any) => String(c.userId))
      ),
    ];

    let avatarMap: Record<string, string> = {};
    if (userIdsNeedAvatar.length > 0) {
      try {
        const avatarsRes = await axios.get(
          `${WP_URL}/wp-json/custom/v1/users/avatars`,
          { params: { ids: userIdsNeedAvatar.join(",") }, validateStatus: () => true }
        );
        if (avatarsRes.status === 200 && avatarsRes.data && typeof avatarsRes.data === "object") {
          const raw = avatarsRes.data as Record<string, unknown>;
          avatarMap = (raw.data as Record<string, string> | undefined) ?? (raw as Record<string, string>);
        }
        if (Object.keys(avatarMap).length === 0 && process.env.WP_USER_LOGIN && process.env.WP_USER_PASS) {
          const auth = Buffer.from(`${process.env.WP_USER_LOGIN}:${process.env.WP_USER_PASS}`).toString("base64");
          for (const uid of userIdsNeedAvatar) {
            try {
              const r = await axios.get(`${WP_URL}/wp-json/wp/v2/users/${uid}`, {
                params: { _fields: "id,current_avatar,currentAvatar" },
                headers: { Authorization: `Basic ${auth}` },
                validateStatus: () => true,
              });
              if (r.status === 200 && r.data) {
                const av = (r.data as any).current_avatar ?? (r.data as any).currentAvatar;
                if (av && String(av).trim() && String(av).trim() !== "default") {
                  avatarMap[uid] = String(av).trim();
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
        comments = comments.map((c: any) => {
          const need = c.userId && (!c.avatarId || String(c.avatarId).trim() === "default");
          if (need) {
            const av = avatarMap[String(c.userId)];
            if (av) return { ...c, avatarId: av };
          }
          return c;
        });
      } catch {
        // ignore
      }
    }

    // Добавляем абсолютный avatarSrc — на случай проблем с относительными URL
    const origin = new URL(request.url).origin;
    comments = comments.map((c: any) => {
      const aid = c.avatarId && String(c.avatarId).trim() && String(c.avatarId).trim() !== "default"
        ? String(c.avatarId).trim()
        : null;
      if (aid) {
        return { ...c, avatarSrc: `${origin}/api/avatars/${encodeURIComponent(aid)}` };
      }
      return c;
    });

    return NextResponse.json(comments, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Response-Source": "amaterasu-news-comments",
      },
    });
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

    let avatarId: string | undefined;
    try {
      const profileCookie = cookieStore.get("profile")?.value;
      if (profileCookie) {
        const profile = JSON.parse(decodeURIComponent(profileCookie));
        const aid = profile?.avatarId;
        if (aid && String(aid).trim() && String(aid).trim() !== "default") {
          avatarId = String(aid).trim();
        }
      }
    } catch {
      /* ignore */
    }

    const commentResponse = await axios.post(
      `${WP_URL}/wp-json/custom/v1/comments`,
      {
        post_id: postId,
        user_id: decoded.sub,
        content: content.trim(),
        ...(avatarId && { avatar_id: avatarId }),
      }
    );

    return NextResponse.json(commentResponse.data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}