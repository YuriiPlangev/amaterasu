import { NextRequest } from "next/server";
import { decodeHtmlEntities } from "../../../lib/html";
import { woo } from "../../../lib/woo";
import { toBooleanFlag, readMetaValue } from "../../../lib/wooUtils";

export const revalidate = 60;

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;
const REVALIDATE_SECONDS = 600;

type WooListResponse<T> = {
  data: T[];
  total: number;
  totalPages: number;
};

const ATTR_TO_TAXONOMY: Record<string, string> = {
  title: "pa_title",
  character: "pa_character",
  genre: "pa_genre",
  game: "pa_game",
  kpop: "pa_kpop",
};

function clampPerPage(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 16;
  return Math.min(30, Math.max(1, Math.floor(parsed)));
}

function parseIdList(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

async function wooList<T = any>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<WooListResponse<T>> {
  const canUseFetch = Boolean(WP_URL && WC_KEY && WC_SECRET);
  if (canUseFetch) {
    try {
      const base = String(WP_URL).replace(/\/+$/, "");
      const url = new URL(`${base}/wp-json/wc/v3/${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }

      const token = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Basic ${token}` },
        next: { revalidate: REVALIDATE_SECONDS },
      });

      if (res.ok) {
        const data = (await res.json()) as T[];
        const total = Number(res.headers.get("x-wp-total") || data.length || 0);
        const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
        return {
          data: Array.isArray(data) ? data : [],
          total,
          totalPages,
        };
      }

      if (res.status === 400) {
        return {
          data: [],
          total: 0,
          totalPages: 0,
        };
      }
    } catch {
      // fallback to Woo REST client
    }
  }

  let response: any;
  try {
    response = await woo.get(path, params);
  } catch (err: any) {
    const status = Number(err?.response?.status || err?.status || 0);
    if (status === 400) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
      };
    }
    throw err;
  }

  const data = (response.data || []) as T[];
  const headers = response.headers || {};
  const total = Number(headers["x-wp-total"] || data.length || 0);
  const totalPages = Number(headers["x-wp-totalpages"] || 1);

  return {
    data: Array.isArray(data) ? data : [],
    total,
    totalPages,
  };
}

async function wpAcfByProductIds(productIds: number[]): Promise<Map<number, any>> {
  const map = new Map<number, any>();
  if (!WP_URL || productIds.length === 0) return map;

  const url = new URL(`${WP_URL.replace(/\/+$/, "")}/wp-json/wp/v2/product`);
  url.searchParams.set("include", productIds.join(","));
  url.searchParams.set("per_page", String(Math.min(100, productIds.length)));
  url.searchParams.set("_fields", "id,acf");

  const res = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) return map;

  const rows = await res.json();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (row?.id != null) {
      map.set(Number(row.id), row?.acf || {});
    }
  }

  return map;
}

function minimizeProductPayload(product: any, acf: any) {
  const deliveryStatus =
    toBooleanFlag(acf?.delivery_status) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "delivery_status")) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "_delivery_status")) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "acf_delivery_status"));

  return {
    id: product?.id,
    name: decodeHtmlEntities(product?.name || ""),
    slug: product?.slug || String(product?.id || ""),
    sku: product?.sku || "",
    price: String(product?.price || ""),
    regular_price: String(product?.regular_price || ""),
    stock_status: String(product?.stock_status || "instock"),
    short_description: decodeHtmlEntities(product?.short_description || ""),
    virtual: Boolean(product?.virtual),
    images: Array.isArray(product?.images)
      ? product.images.slice(0, 3).map((img: any) => ({ src: img?.src, alt: img?.alt || "" }))
      : [],
    categories: Array.isArray(product?.categories)
      ? product.categories.map((c: any) => ({
          id: c?.id,
          name: c?.name,
          slug: c?.slug,
        }))
      : [],
    attributes: Array.isArray(product?.attributes) ? product.attributes : [],
    brands: Array.isArray(product?.brands) ? product.brands : [],
    brand: product?.brand || null,
    deliveryInfo: {
      delivery_status: deliveryStatus,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    const page = Math.max(1, Number(params.get("page") || 1));
    const perPage = clampPerPage(params.get("per_page") || 20);

    const wcParams: Record<string, string | number | undefined> = {
      page,
      per_page: perPage,
      orderby: "date",
      order: "desc",
      status: "publish",
    };

    const slug = (params.get("slug") || "").trim();
    if (slug) wcParams.slug = slug;

    const sku = (params.get("sku") || "").trim();
    if (sku) wcParams.sku = sku;

    const sort = params.get("sort") || "date";
    if (sort === "price_asc") {
      wcParams.orderby = "price";
      wcParams.order = "asc";
    } else if (sort === "price_desc") {
      wcParams.orderby = "price";
      wcParams.order = "desc";
    }

    const search = (params.get("search") || "").trim();
    if (search) wcParams.search = search;

    const priceMin = params.get("price_min");
    const priceMax = params.get("price_max");
    if (priceMin) wcParams.min_price = priceMin;
    if (priceMax) wcParams.max_price = priceMax;

    // Категории: category_id или categories — сразу числовые ID
    const categoryId = params.get("category_id");
    const categories = categoryId
      ? [Number(categoryId)]
      : parseIdList(params.get("categories") || params.get("category") || undefined);
    if (categories.length > 0) {
      wcParams.category = categories.join(",");
    }

    // Тег: только числовой ID
    const tagId = params.get("tag");
    if (tagId && Number.isFinite(Number(tagId))) {
      wcParams.tag = Number(tagId);
    }

    // Атрибуты: ожидаем числовые ID, маппим напрямую в pa_* и attribute_term
    const attrConfig = [
      { param: "attribute_title", taxonomy: ATTR_TO_TAXONOMY.title },
      { param: "attribute_character", taxonomy: ATTR_TO_TAXONOMY.character },
      { param: "attribute_genre", taxonomy: ATTR_TO_TAXONOMY.genre },
      { param: "attribute_games", taxonomy: ATTR_TO_TAXONOMY.game },
      { param: "attribute_kpop", taxonomy: ATTR_TO_TAXONOMY.kpop },
    ] as const;

    const firstAttrWithIds = attrConfig.find((c) => {
      const ids = parseIdList(params.get(c.param) || undefined);
      return ids.length > 0;
    });

    if (firstAttrWithIds) {
      const ids = parseIdList(params.get(firstAttrWithIds.param) || undefined);
      wcParams.attribute = firstAttrWithIds.taxonomy;
      wcParams.attribute_term = ids.join(",");
    }

    const isBestseller = params.get("bestseller") === "true";
    const wooStart = performance.now();

    const list = isBestseller
      ? await wooList<any>("products", { ...wcParams, featured: "true" })
      : await wooList<any>("products", wcParams);

    const wooTimeMs = Math.round(performance.now() - wooStart);
    const pageProducts = list.data;

    const productIds = pageProducts
      .map((p: any) => Number(p?.id))
      .filter((id: number) => Number.isFinite(id));

    const isListRequest = !slug && !sku;
    const acfById = isListRequest ? new Map<number, any>() : await wpAcfByProductIds(productIds);

    let finalProducts = pageProducts;
    if (isBestseller) {
      finalProducts = pageProducts.filter((product: any) => toBooleanFlag(product?.featured));
    }

    const products = finalProducts.map((product: any) =>
      minimizeProductPayload(product, acfById.get(Number(product?.id)) || {})
    );

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
      "Server-Timing": `woo;dur=${wooTimeMs};desc="WooCommerce fetch"`,
      "X-WooCommerce-Ms": String(wooTimeMs),
    };

    return new Response(
      JSON.stringify({
        products,
        hasMore: page < list.totalPages,
        total: list.total,
        page,
        perPage,
        totalPages: list.totalPages,
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (err: any) {
    console.error("[Products API] error:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch products",
        message: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
