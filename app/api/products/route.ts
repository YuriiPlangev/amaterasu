import { woo } from "../../../lib/woo";
import { decodeHtmlEntities } from "../../../lib/html";

function normalizeAttrKey(val: string): string {
  return String(val || "").toLowerCase().replace(/^pa_/, "").trim();
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

function isBestSellerProduct(product: any): boolean {
  const acfValue = product?.acf?.is_bestseller;
  if (toBooleanFlag(acfValue)) return true;

  if (toBooleanFlag(product?.featured)) return true;

  // Fallback: інколи ACF значення доступне лише у meta_data WooCommerce.
  const metaCandidates = [
    readMetaValue(product?.meta_data, "is_bestseller"),
    readMetaValue(product?.meta_data, "_is_bestseller"),
    readMetaValue(product?.meta_data, "acf_is_bestseller"),
  ];

  return metaCandidates.some((v) => toBooleanFlag(v));
}

async function fetchAllWooProducts(wcParams: any): Promise<{
  products: any[];
  totalProducts: number;
  totalPages: number;
}> {
  const firstRes = await woo.get("products", { ...wcParams, page: 1, per_page: 100 });
  const firstBatch = firstRes.data || [];
  const totalProducts = firstRes.headers?.["x-wp-total"]
    ? parseInt(firstRes.headers["x-wp-total"])
    : firstBatch.length;
  const totalPages = firstRes.headers?.["x-wp-totalpages"]
    ? parseInt(firstRes.headers["x-wp-totalpages"])
    : 1;

  if (totalPages <= 1) {
    return { products: firstBatch, totalProducts, totalPages };
  }

  const pagePromises: Promise<any>[] = [];
  for (let page = 2; page <= totalPages; page++) {
    pagePromises.push(woo.get("products", { ...wcParams, page, per_page: 100 }));
  }

  const pageResponses = await Promise.all(pagePromises);
  const combined = [
    ...firstBatch,
    ...pageResponses.flatMap((r: any) => r.data || []),
  ];

  const uniqueById = new Map<number, any>();
  for (const product of combined) {
    if (product?.id != null) uniqueById.set(Number(product.id), product);
  }

  return {
    products: Array.from(uniqueById.values()),
    totalProducts,
    totalPages,
  };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function mergeWpAcfForProducts(products: any[]): Promise<any[]> {
  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  if (!wpUrl || !products.length) return products;

  const ids = products
    .map((p: any) => Number(p?.id))
    .filter((id: number) => Number.isFinite(id));

  if (!ids.length) return products;

  const idChunks = chunkArray(ids, 50);
  const acfMap = new Map<number, any>();

  await Promise.all(
    idChunks.map(async (chunk) => {
      const includeParam = chunk.join(",");
      const wpRes = await fetch(
        `${wpUrl}/wp-json/wp/v2/product?include=${includeParam}&per_page=100&_fields=id,acf`
      );
      if (!wpRes.ok) return;
      const data = await wpRes.json();
      if (!Array.isArray(data)) return;

      for (const row of data) {
        if (row?.id != null && row?.acf) {
          acfMap.set(Number(row.id), row.acf);
        }
      }
    })
  );

  if (!acfMap.size) return products;

  return products.map((p: any) => {
    const id = Number(p?.id);
    if (!Number.isFinite(id)) return p;
    const wpAcf = acfMap.get(id);
    if (!wpAcf) return p;
    return {
      ...p,
      acf: {
        ...(p?.acf || {}),
        ...wpAcf,
      },
    };
  });
}

/** Декодирует HTML-сущности в полях товара */
function decodeProductFields(product: any): any {
  return {
    ...product,
    name: decodeHtmlEntities(product.name || ''),
    short_description: decodeHtmlEntities(product.short_description || ''),
    description: decodeHtmlEntities(product.description || ''),
  };
}

/** Проверяет, есть ли подстрока в названии или описании товара (без учёта регистра, HTML убран) */
function productMatchesSearch(product: any, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;
  const name = String(product.name || "").toLowerCase();
  const shortDesc = String(product.short_description || "").replace(/<[^>]*>/g, " ").toLowerCase();
  const longDesc = String(product.description || "").replace(/<[^>]*>/g, " ").toLowerCase();
  return name.includes(term) || shortDesc.includes(term) || longDesc.includes(term);
}

/** Проверяет, подходит ли товар по атрибуту (title, character, genre, game) */
function productMatchesAttribute(
  product: any,
  attrName: string,
  allowedValues: string[]
): boolean {
  if (!allowedValues?.length) return true;
  const attrs = product.attributes || [];
  const targetNorm = attrName.toLowerCase();
  
  // Пробуем найти атрибут по разным критериям
  let attr = attrs.find((a: any) => {
    const n = normalizeAttrKey(a?.name || "");
    const s = normalizeAttrKey(a?.slug || "");
    return n === targetNorm || s === targetNorm;
  });
  
  // Если не нашли, пробуем поиск более гибкий (содержит substring)
  if (!attr) {
    attr = attrs.find((a: any) => {
      const n = (a?.name || "").toLowerCase();
      const s = (a?.slug || "").toLowerCase();
      return n.includes(targetNorm) || s.includes(targetNorm);
    });
  }
  
  if (!attr) {
    return false;
  }
  
  const opts = Array.isArray(attr.options)
    ? attr.options
    : attr.option
    ? [attr.option]
    : [];
  const productValues = opts.map((v: string) => String(v || "").trim().toLowerCase());
  
  return allowedValues.some((v) =>
    productValues.includes(String(v).trim().toLowerCase())
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  // Устанавливаем дефолтные значения для пагинации
  const wcParams: any = { 
    per_page: params.per_page ? Number(params.per_page) : 16,
    page: params.page ? Number(params.page) : 1  // ВАЖНО: всегда устанавливаем page
  };
  
  if (params.search && String(params.search).trim()) {
    wcParams.search = String(params.search).trim();
  }

  // Фильтр по одной категории — передаём в WC
  const categoryIds = params.categories
    ? String(params.categories)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean)
    : [];
  if (categoryIds.length === 1) {
    wcParams.category = categoryIds[0];
  }

  // Фильтр по slug категории
  if (!wcParams.category && params.category_slug) {
    try {
      const catRes = await woo.get("products/categories", {
        params: { slug: params.category_slug, per_page: 1 },
      });
      const category = Array.isArray(catRes.data) ? catRes.data[0] : null;
      if (category?.id) wcParams.category = category.id;
    } catch (e: any) {
      console.error("Woo category_slug lookup error:", e.message);
    }
  }

  // Теги
  if (params.tag) wcParams.tag = Number(params.tag);
  if (!wcParams.tag && params.tag_slug) {
    try {
      const tagRes = await woo.get("products/tags", {
        params: { slug: params.tag_slug, per_page: 1 },
      });
      const tag = Array.isArray(tagRes.data) ? tagRes.data[0] : null;
      if (tag?.id) wcParams.tag = tag.id;
    } catch (e: any) {
      console.error("Woo tag_slug lookup error:", e.message);
    }
  }

  if (params.bestseller === "true") wcParams.per_page = 100;

  // Сортировка: date (актуальність), price_asc, price_desc
  const sortParam = params.sort || "date";
  if (sortParam === "price_asc") {
    wcParams.orderby = "price";
    wcParams.order = "asc";
  } else if (sortParam === "price_desc") {
    wcParams.orderby = "price";
    wcParams.order = "desc";
  } else {
    wcParams.orderby = "date";
    wcParams.order = "desc";
  }

  // Загруженные значения фильтров
  const titleVals = params.attribute_title
    ? String(params.attribute_title).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const characterVals = params.attribute_character
    ? String(params.attribute_character).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const genreVals = params.attribute_genre
    ? String(params.attribute_genre).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const gameVals = params.attribute_games
    ? String(params.attribute_games).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const hasComplexFilters =
    categoryIds.length > 1 ||
    titleVals.length > 0 ||
    characterVals.length > 0 ||
    genreVals.length > 0 ||
    gameVals.length > 0 ||
    params.price_min ||
    params.price_max ||
    (params.search && String(params.search).trim());
  
  if (hasComplexFilters) {
    wcParams.per_page = 100;  // WooCommerce max is 100
    wcParams.page = 1;
  }

  try {
    let filteredProducts: any[] = [];
    let totalProducts = 0;
    let totalPages = 1;

    if (params.bestseller === "true") {
      const allProductsData = await fetchAllWooProducts(wcParams);
      filteredProducts = allProductsData.products;
      totalProducts = allProductsData.totalProducts;
      totalPages = allProductsData.totalPages;

      // Для бестселлерів подтягиваем ACF прямо из WP REST, если Woo его не вернул.
      filteredProducts = await mergeWpAcfForProducts(filteredProducts);
    } else {
      const res = await woo.get("products", wcParams);
      filteredProducts = res.data || [];
      totalProducts = res.headers?.["x-wp-total"]
        ? parseInt(res.headers["x-wp-total"])
        : filteredProducts.length;
      totalPages = res.headers?.["x-wp-totalpages"]
        ? parseInt(res.headers["x-wp-totalpages"])
        : 1;
    }
    

    // Поиск по названию и описанию (гарантированная фильтрация на нашей стороне)
    const searchTerm = params.search ? String(params.search).trim() : "";
    if (searchTerm) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesSearch(p, searchTerm)
      );
    }

    // Убедиться что все товары имеют slug (если нет - использовать ID как fallback)
    filteredProducts = filteredProducts.map((p: any) =>
      decodeProductFields({
        ...p,
        slug: p.slug || String(p.id)
      })
    );

    // Категории: при нескольких ID фильтруем вручную.
    // Для одного ID WooCommerce уже фильтрує коректно (з урахуванням дочірніх категорій),
    // а строгая ручная проверка по точному ID может скрыть валидные товары.
    if (categoryIds.length > 1) {
      filteredProducts = filteredProducts.filter((p: any) =>
        p.categories?.some((c: any) => categoryIds.includes(c.id))
      );
    }

    // Теги
    if (wcParams.tag) {
      const tagId = Number(wcParams.tag);
      filteredProducts = filteredProducts.filter((p: any) =>
        p.tags?.some((t: any) => t.id === tagId)
      );
    }
    
    // Фильтруем по атрибутам на нашей стороне
    if (characterVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "character", characterVals)
      );
    }
    if (titleVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "title", titleVals)
      );
    }
    if (genreVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "genre", genreVals)
      );
    }
    if (gameVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "game", gameVals)
      );
    }

    // Бестселлеры
    if (params.bestseller === "true") {
      filteredProducts = filteredProducts.filter((p: any) => isBestSellerProduct(p));
    }

    // Ціна від/до
    const priceMin = params.price_min ? parseFloat(String(params.price_min)) : null;
    const priceMax = params.price_max ? parseFloat(String(params.price_max)) : null;
    if (priceMin != null && !isNaN(priceMin)) {
      filteredProducts = filteredProducts.filter((p: any) => {
        const price = parseFloat(String(p.price || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        return price >= priceMin;
      });
    }
    if (priceMax != null && !isNaN(priceMax)) {
      filteredProducts = filteredProducts.filter((p: any) => {
        const price = parseFloat(String(p.price || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        return price <= priceMax;
      });
    }

    // Сортировка (при complex-фильтрах WC не сортирует — сортируем вручную)
    const sortParam = params.sort || "date";
    if (sortParam === "price_asc" || sortParam === "price_desc") {
      const sign = sortParam === "price_asc" ? 1 : -1;
      filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
        const pa = parseFloat(String(a.price || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        const pb = parseFloat(String(b.price || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        return sign * (pa - pb);
      });
    } else {
      // date desc — нові спочатку
      filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
        const da = new Date(a.date_created || 0).getTime();
        const db = new Date(b.date_created || 0).getTime();
        return db - da;
      });
    }

    // Пагинация при complex-фільтрах
    if (hasComplexFilters) {
      const perPage = Number(params.per_page) || 16;
      const page = Math.max(1, Number(params.page) || 1);
      const start = (page - 1) * perPage;
      const total = filteredProducts.length;
      filteredProducts = filteredProducts.slice(start, start + perPage);
      
      return new Response(JSON.stringify({
        products: filteredProducts,
        hasMore: start + perPage < total,
        total: total,
        page: page,
        perPage: perPage
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // Для простих запитів без складних фільтрів
    const perPage = Number(params.per_page) || 16;
    const page = Math.max(1, Number(params.page) || 1);
    
    // Используем информацию из заголовков WooCommerce для определения hasMore
    const hasMorePages = page < totalPages;
    
    return new Response(JSON.stringify({
      products: filteredProducts,
      hasMore: hasMorePages,
      total: totalProducts,
      page: page,
      perPage: perPage,
      totalPages: totalPages
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error("[Products API] Woo API Error:", {
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      response: err.response?.data || err.response,
      stack: err.stack
    });
    const errorDetails = {
      error: "Failed to fetch",
      message: err.message,
      status: err.status || err.statusCode,
      timestamp: new Date().toISOString()
    };
    return new Response(
      JSON.stringify(errorDetails),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}