import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;
const AVATAR_CATEGORY_ID = 7012;

async function fetchImageBuffer(imageUrl: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const imgRes = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!imgRes.ok) return null;
  const buffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  return { buffer, contentType };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  if (!sku) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const decodedSku = decodeURIComponent(sku).trim();
  if (!decodedSku) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let imageUrl: string | null = null;

  try {
    // 1) Direct WooCommerce (sku + category, then sku only)
    if (WP_URL && WC_KEY && WC_SECRET) {
      const base = String(WP_URL).replace(/\/+$/, "");
      const token = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

      for (const withCategory of [true, false]) {
        const url = new URL(`${base}/wp-json/wc/v3/products`);
        url.searchParams.set("sku", decodedSku);
        if (withCategory) url.searchParams.set("category", String(AVATAR_CATEGORY_ID));
        url.searchParams.set("per_page", "1");
        url.searchParams.set("status", "publish");

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Basic ${token}` },
          next: { revalidate: 3600 },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const product = Array.isArray(data) ? data[0] : null;
        if (product?.images?.[0]?.src) {
          if (!withCategory && Array.isArray(product.categories)) {
            const inCat = product.categories.some((c: { id?: number }) => Number(c?.id) === AVATAR_CATEGORY_ID);
            if (!inCat) continue;
          }
          imageUrl = product.images[0].src;
          break;
        }
      }
    }

    // 2) Fallback: products API (тот же источник, что и список аватаров в форме — он работает)
    if (!imageUrl) {
      const origin = new URL(req.url).origin;
      const productsRes = await fetch(
        `${origin}/api/products?category=7012&per_page=50`,
        { next: { revalidate: 3600 } }
      );
      if (productsRes.ok) {
        const data = await productsRes.json();
        const list = data?.products ?? [];
        const norm = (s: string) => String(s ?? "").trim().toLowerCase();
        const found = list.find((p: { sku?: string }) => norm(p?.sku ?? "") === norm(decodedSku));
        if (found?.images?.[0]?.src) imageUrl = found.images[0].src;
      }
    }

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await fetchImageBuffer(imageUrl);
    if (!result) return NextResponse.json({ error: "No image" }, { status: 404 });

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
