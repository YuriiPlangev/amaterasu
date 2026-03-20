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
