import { woo } from "../../../lib/woo";

function normalizeAttrKey(val: string): string {
  return String(val || "").toLowerCase().replace(/^pa_/, "").trim();
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

/** Проверяет, подходит ли товар по атрибуту (title, character, genre) */
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
  if (!attr && attrName === "character") {
    attr = attrs.find((a: any) => {
      const n = (a?.name || "").toLowerCase();
      const s = (a?.slug || "").toLowerCase();
      return n.includes("character") || s.includes("character");
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

  const hasComplexFilters =
    categoryIds.length > 1 ||
    titleVals.length > 0 ||
    characterVals.length > 0 ||
    genreVals.length > 0 ||
    params.price_min ||
    params.price_max ||
    (params.search && String(params.search).trim());
  
  if (hasComplexFilters) {
    wcParams.per_page = 100;  // WooCommerce max is 100
    wcParams.page = 1;
  }

  try {
    const res = await woo.get("products", wcParams);
    let filteredProducts = res.data || [];
    
    // Получаем информацию о пагинации из заголовков WooCommerce
    const totalProducts = res.headers?.['x-wp-total'] ? parseInt(res.headers['x-wp-total']) : filteredProducts.length;
    const totalPages = res.headers?.['x-wp-totalpages'] ? parseInt(res.headers['x-wp-totalpages']) : 1;
    
    console.log('WooCommerce response:', {
      received_products: filteredProducts.length,
      total_products: totalProducts,
      total_pages: totalPages
    });

    // Поиск по названию и описанию (гарантированная фильтрация на нашей стороне)
    const searchTerm = params.search ? String(params.search).trim() : "";
    if (searchTerm) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesSearch(p, searchTerm)
      );
    }

    // Убедиться что все товары имеют slug (если нет - использовать ID как fallback)
    filteredProducts = filteredProducts.map((p: any) => ({
      ...p,
      slug: p.slug || String(p.id)
    }));

    // Категории: несколько ID — фильтруем вручную
    if (categoryIds.length > 0) {
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

    // Бестселлеры
    if (params.bestseller === "true") {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.acf?.is_bestseller === true
      );
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
    
    console.log('Simple request result:', {
      page,
      perPage,
      hasMore: hasMorePages,
      totalPages,
      products_count: filteredProducts.length
    });
    
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