import { decodeHtmlEntities } from "../../../lib/html";
import { woo } from "../../../lib/woo";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;
const REVALIDATE_SECONDS = 600;

type WooListResponse<T> = {
  data: T[];
  total: number;
  totalPages: number;
};

type AttrInfo = {
  id: number;
  slug: string;
};

type AttrRequest = {
  key: "title" | "character" | "genre" | "game";
  values: string[];
};

function clampPerPage(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 16;
  return Math.min(30, Math.max(1, Math.floor(parsed)));
}

function toBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(normalized);
  }
  return false;
}

function readMetaValue(metaData: any[] | undefined, key: string): unknown {
  if (!Array.isArray(metaData)) return undefined;
  const entry = metaData.find((m: any) => m?.key === key);
  return entry?.value;
}

function parseStringList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => {
      try {
        return decodeURIComponent(v).trim();
      } catch {
        return v.trim();
      }
    })
    .filter(Boolean);
}

function normalizeText(value: unknown): string {
  return String(value || "").trim().toLowerCase();
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
    } catch {
      // fallback to Woo REST client
    }
  }

  const response = await woo.get(path, params);
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

const slugToCategoryIdCache = new Map<string, { id: number | null; expiresAt: number }>();
const slugToTagIdCache = new Map<string, { id: number | null; expiresAt: number }>();
const attrInfoCache = new Map<string, { info: AttrInfo | null; expiresAt: number }>();
const attrTermsCache = new Map<string, { terms: any[]; expiresAt: number }>();
const CACHE_TTL_MS = REVALIDATE_SECONDS * 1000;

async function resolveCategoryIdBySlug(slug: string): Promise<number | null> {
  const key = normalizeText(slug);
  const cached = slugToCategoryIdCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.id;

  const result = await wooList<any>("products/categories", { slug: key, per_page: 1 });
  const id = result.data[0]?.id ? Number(result.data[0].id) : null;
  slugToCategoryIdCache.set(key, { id, expiresAt: now + CACHE_TTL_MS });
  return id;
}

async function resolveTagIdBySlug(slug: string): Promise<number | null> {
  const key = normalizeText(slug);
  const cached = slugToTagIdCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.id;

  const result = await wooList<any>("products/tags", { slug: key, per_page: 1 });
  const id = result.data[0]?.id ? Number(result.data[0].id) : null;
  slugToTagIdCache.set(key, { id, expiresAt: now + CACHE_TTL_MS });
  return id;
}

function attrAliases(key: AttrRequest["key"]): string[] {
  if (key === "title") return ["pa_title", "title"];
  if (key === "character") return ["pa_character", "character"];
  if (key === "genre") return ["pa_genre", "genre"];
  return ["pa_game", "game", "pa_games", "games"];
}

async function getAttrInfo(key: AttrRequest["key"]): Promise<AttrInfo | null> {
  const cacheKey = `attr:${key}`;
  const cached = attrInfoCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.info;

  const attrs = await wooList<any>("products/attributes", { per_page: 100 });
  const aliases = attrAliases(key);
  const found = attrs.data.find((a: any) => aliases.includes(normalizeText(a?.slug)));

  const info = found
    ? {
        id: Number(found.id),
        slug: String(found.slug || "").trim(),
      }
    : null;

  attrInfoCache.set(cacheKey, { info, expiresAt: now + CACHE_TTL_MS });
  return info;
}

async function getAttrTerms(attrId: number): Promise<any[]> {
  const cacheKey = `terms:${attrId}`;
  const cached = attrTermsCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.terms;

  const terms = await wooList<any>(`products/attributes/${attrId}/terms`, {
    per_page: 100,
    page: 1,
  });

  attrTermsCache.set(cacheKey, { terms: terms.data, expiresAt: now + CACHE_TTL_MS });
  return terms.data;
}

async function resolveAttrTermIds(req: AttrRequest): Promise<{ taxonomy: string; termIds: number[] } | null> {
  const info = await getAttrInfo(req.key);
  if (!info) return null;

  const terms = await getAttrTerms(info.id);
  const wanted = req.values.map(normalizeText);

  const ids = terms
    .filter((term: any) => {
      const termName = normalizeText(term?.name);
      const termSlug = normalizeText(term?.slug);
      return wanted.some((w) => w === termName || w === termSlug || termName.includes(w));
    })
    .map((term: any) => Number(term?.id))
    .filter((id: number) => Number.isFinite(id));

  if (!ids.length) return null;

  return {
    taxonomy: info.slug,
    termIds: Array.from(new Set(ids)),
  };
}

function productHasAnyAttrValue(product: any, expectedValues: string[]): boolean {
  const normalizedExpected = expectedValues.map(normalizeText);
  const attrs = Array.isArray(product?.attributes) ? product.attributes : [];

  for (const attr of attrs) {
    const options = Array.isArray(attr?.options)
      ? attr.options
      : attr?.option
      ? [attr.option]
      : [];

    const optionNorm = options.map(normalizeText);
    if (normalizedExpected.some((w) => optionNorm.includes(w))) {
      return true;
    }
  }

  return false;
}

function productMatchesBestSellerMetaKey(product: any, metaKey: string): boolean {
  const direct = readMetaValue(product?.meta_data, metaKey);
  if (toBooleanFlag(direct)) return true;

  // Часто ACF значение хранится как _key и key одновременно.
  if (!metaKey.startsWith("_")) {
    const underscored = readMetaValue(product?.meta_data, `_${metaKey}`);
    if (toBooleanFlag(underscored)) return true;
  }

  return false;
}

function isBestSellerProduct(product: any, acf: any): boolean {
  return (
    toBooleanFlag(acf?.is_bestseller) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "is_bestseller")) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "_is_bestseller")) ||
    toBooleanFlag(readMetaValue(product?.meta_data, "acf_is_bestseller")) ||
    toBooleanFlag(product?.featured)
  );
}

async function fetchBestsellersPage(
  wcParams: Record<string, string | number | undefined>
): Promise<WooListResponse<any>> {
  // DB-side filter strategy: try dedicated meta keys first, then Woo built-in featured.
  const attempts: Record<string, string | number | undefined>[] = [
    { ...wcParams, meta_key: "is_bestseller", meta_value: "1" },
    { ...wcParams, meta_key: "_is_bestseller", meta_value: "1" },
    { ...wcParams, meta_key: "acf_is_bestseller", meta_value: "1" },
    { ...wcParams, featured: "true" },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const result = await wooList<any>("products", attempt);
    if (result.total <= 0 && result.data.length <= 0) {
      continue;
    }

    // Для meta_key-запросов убеждаемся, что Woo реально применил фильтр,
    // иначе мы можем получить обычный список всех товаров.
    if (i <= 2) {
      const metaKey = String(attempt.meta_key || "");
      const allMatchMeta = result.data.every((p: any) => productMatchesBestSellerMetaKey(p, metaKey));
      if (!allMatchMeta) {
        continue;
      }
    }

    if (result.total > 0 || result.data.length > 0) {
      return result;
    }
  }

  return { data: [], total: 0, totalPages: 0 };
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
    price: String(product?.price || ""),
    regular_price: String(product?.regular_price || ""),
    stock_status: String(product?.stock_status || "instock"),
    short_description: decodeHtmlEntities(product?.short_description || ""),
    images: Array.isArray(product?.images)
      ? product.images.slice(0, 3).map((img: any) => ({ src: img?.src, alt: img?.alt || "" }))
      : [],
    attributes: Array.isArray(product?.attributes) ? product.attributes : [],
    brands: Array.isArray(product?.brands) ? product.brands : [],
    brand: product?.brand || null,
    deliveryInfo: {
      delivery_status: deliveryStatus,
    },
  };
}

export async function GET(req: Request) {
  try {
    const requestUrl = new URL(req.url);
    const params = requestUrl.searchParams;

    const page = Math.max(1, Number(params.get("page") || 1));
    const perPage = clampPerPage(params.get("per_page") || 20);

    const wcParams: Record<string, string | number | undefined> = {
      page,
      per_page: perPage,
      orderby: "date",
      order: "desc",
      status: "publish",
    };

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

    const categories = parseStringList(params.get("categories") || params.get("category") || undefined)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));

    if (categories.length > 0) {
      wcParams.category = categories.join(",");
    } else {
      const categorySlug = params.get("category_slug");
      if (categorySlug) {
        const categoryId = await resolveCategoryIdBySlug(categorySlug);
        if (categoryId) wcParams.category = categoryId;
      }
    }

    const tagParam = params.get("tag");
    if (tagParam && Number.isFinite(Number(tagParam))) {
      wcParams.tag = Number(tagParam);
    } else {
      const tagSlug = params.get("tag_slug");
      if (tagSlug) {
        const tagId = await resolveTagIdBySlug(tagSlug);
        if (tagId) wcParams.tag = tagId;
      }
    }

    const attrRequests = ([
      { key: "title" as const, values: parseStringList(params.get("attribute_title") || undefined) },
      { key: "character" as const, values: parseStringList(params.get("attribute_character") || undefined) },
      { key: "genre" as const, values: parseStringList(params.get("attribute_genre") || undefined) },
      { key: "game" as const, values: parseStringList(params.get("attribute_games") || undefined) },
    ] satisfies AttrRequest[]).filter((x) => x.values.length > 0);

    // DB-side attribute filtering (when possible): attribute + attribute_term.
    // WooCommerce REST supports a single pair directly; we apply the first pair in DB
    // and keep additional pairs as lightweight in-page refinement.
    const firstAttrResolved = attrRequests.length ? await resolveAttrTermIds(attrRequests[0]) : null;
    if (firstAttrResolved) {
      wcParams.attribute = firstAttrResolved.taxonomy;
      wcParams.attribute_term = firstAttrResolved.termIds.join(",");
    }

    const isBestseller = params.get("bestseller") === "true";
    const list = isBestseller
      ? await fetchBestsellersPage(wcParams)
      : await wooList<any>("products", wcParams);

    let pageProducts = list.data;

    // Lightweight refinement for remaining attributes on already-paginated items.
    if (attrRequests.length > 1) {
      const remaining = attrRequests.slice(1);
      pageProducts = pageProducts.filter((product: any) =>
        remaining.every((req) => productHasAnyAttrValue(product, req.values))
      );
    }

    const productIds = pageProducts
      .map((p: any) => Number(p?.id))
      .filter((id: number) => Number.isFinite(id));

    const acfById = await wpAcfByProductIds(productIds);

    if (isBestseller) {
      pageProducts = pageProducts.filter((product: any) => {
        const id = Number(product?.id);
        const acf = acfById.get(id) || {};
        return isBestSellerProduct(product, acf);
      });

      // Fallback: если Woo не отфильтровал по meta/featured корректно,
      // делаем ограниченный скан первых страниц и собираем только bestsellers.
      if (pageProducts.length === 0) {
        const scanParams: Record<string, string | number | undefined> = {
          ...wcParams,
          page: 1,
          per_page: 50,
        };
        delete scanParams.meta_key;
        delete scanParams.meta_value;
        delete scanParams.featured;

        const collected: any[] = [];
        const seen = new Set<number>();
        const MAX_SCAN_PAGES = 2;

        for (let scanPage = 1; scanPage <= MAX_SCAN_PAGES && collected.length < perPage; scanPage++) {
          scanParams.page = scanPage;
          const scan = await wooList<any>("products", scanParams);
          if (!scan.data.length) break;

          const scanIds = scan.data
            .map((p: any) => Number(p?.id))
            .filter((id: number) => Number.isFinite(id));
          const scanAcfById = await wpAcfByProductIds(scanIds);

          for (const product of scan.data) {
            const id = Number(product?.id);
            if (!Number.isFinite(id) || seen.has(id)) continue;
            if (isBestSellerProduct(product, scanAcfById.get(id) || {})) {
              collected.push(product);
              seen.add(id);
              if (collected.length >= perPage) break;
            }
          }

          if (scanPage >= scan.totalPages) break;
        }

        pageProducts = collected;
      }
    }

    const products = pageProducts.map((product: any) =>
      minimizeProductPayload(product, acfById.get(Number(product?.id)) || {})
    );

    return new Response(
      JSON.stringify({
        products,
        hasMore: isBestseller ? false : page < list.totalPages,
        total: isBestseller ? products.length : list.total,
        page,
        perPage,
        totalPages: list.totalPages,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
        },
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
