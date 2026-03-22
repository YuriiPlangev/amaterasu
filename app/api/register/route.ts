// app/api/register/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // Basic validation
  if (!body.username || !body.email || !body.phone || !body.password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const usernameLower = String(body.username || '').toLowerCase();
  if (usernameLower.includes('admin')) {
    return NextResponse.json({ error: 'Ім\'я користувача не може містити слово "Admin"' }, { status: 400 });
  }

  // Optional: recaptcha check here, rate-limit

  const wpRes = await fetch(`${process.env.WP_URL}/wp-json/custom/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await wpRes.json().catch(() => ({}));

  if (!wpRes.ok) {
    const errMsg = data.message || data.error || data.code || 'Помилка реєстрації';
    return NextResponse.json({ error: String(errMsg) }, { status: wpRes.status });
  }

  // After creating user, optionally auto-login: we can create JWT here
  // But keep registration separate; user can then login.
  return NextResponse.json({ success: true, data }, { status: 201 });
}
