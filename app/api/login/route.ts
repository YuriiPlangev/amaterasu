// app/api/login/route.ts
import { NextResponse } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'; // or '1h'

export async function POST(req: Request) {
  try {
    // Проверка наличия JWT_SECRET
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Проверка наличия WP_URL
    if (!process.env.WP_URL) {
      console.error('WP_URL is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const wpUrl = `${process.env.WP_URL}/wp-json/custom/v1/login`;

    let wpRes;
    try {
      wpRes = await fetch(wpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ 
        error: 'Не удалось подключиться к серверу. Проверьте настройки WP_URL.' 
      }, { status: 500 });
    }

    let wpData;
    try {
      const text = await wpRes.text();
      wpData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({ error: 'Ошибка при обработке ответа от сервера' }, { status: 500 });
    }

    if (!wpRes.ok) {
      const errorMessage = wpData.error || wpData.message || wpData.code || 'Invalid credentials';
      console.error('WordPress API error:', errorMessage, wpData);
      return NextResponse.json({ error: errorMessage }, { status: wpRes.status });
    }

    if (!wpData.user) {
      console.error('Invalid response format:', wpData);
      return NextResponse.json({ error: 'Неверный формат ответа от сервера' }, { status: 500 });
    }

    const user = wpData.user; // from plugin: ID, user_login, user_email, roles

    // Проверка наличия обязательных полей
    if (!user.ID || !user.user_login) {
      console.error('Missing user fields:', user);
      return NextResponse.json({ error: 'Неполные данные пользователя' }, { status: 500 });
    }

    // create JWT payload (minimal)
    const payload = {
      sub: String(user.ID),
      login: user.user_login,
      roles: user.roles || []
    };

    let token;
    try {
      token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    } catch (jwtError) {
      console.error('JWT sign error:', jwtError);
      return NextResponse.json({ error: 'Ошибка при создании токена' }, { status: 500 });
    }

    // set cookie (httpOnly, secure in production)
    const tokenCookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days, keep in sync with JWT_EXPIRES_IN
    });

    const profilePayload = {
      displayName: user.display_name || user.user_login || '',
      email: user.user_email || '',
      phone: user.phone || '',
    };

    const profileCookie = serialize('profile', encodeURIComponent(JSON.stringify(profilePayload)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Set-Cookie': `${tokenCookie}, ${profileCookie}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error in login route:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
}
