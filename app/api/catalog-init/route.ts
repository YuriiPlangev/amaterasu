import { NextResponse } from "next/server";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

export const revalidate = 3600;

export async function GET() {
  try {
    if (!WP_URL) {
      return NextResponse.json({ error: "WP_URL is not configured" }, { status: 500 });
    }

    const url = `${WP_URL.replace(/\/+$/, "")}/wp-json/amaterasu/v1/catalog-init`;
    const res = await fetch(url, {
      next: { revalidate },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Catalog init failed", details: text || res.statusText },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Убираем avatar и "Без категории" (ID 15) из списка категорий
    if (data && Array.isArray(data.categories)) {
      const AVATAR_ID = 7012;
      const UNCATEGORIZED_ID = 15;
      const excludeSlugs = ['avatars', 'avatar', 'uncategorized', 'bez-kategorii'];
      const excludeNames = ['без категории', 'uncategorized'];
      data.categories = data.categories.filter((c: any) => {
        if (Number(c?.id) === AVATAR_ID || Number(c?.id) === UNCATEGORIZED_ID) return false;
        const slug = String(c?.slug || '').toLowerCase();
        if (excludeSlugs.includes(slug)) return false;
        const name = String(c?.name || '').toLowerCase();
        if (excludeNames.includes(name)) return false;
        return true;
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
      },
    });
  } catch (err: any) {
    console.error("[Catalog-init API] error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err?.message },
      { status: 500 }
    );
  }
}
