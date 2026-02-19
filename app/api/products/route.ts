import { woo } from "../../../lib/woo";

function normalizeAttrKey(val: string): string {
  return String(val || "").toLowerCase().replace(/^pa_/, "").trim();
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
  const attr = attrs.find((a: any) => {
    const n = normalizeAttrKey(a?.name || "");
    const s = normalizeAttrKey(a?.slug || "");
    return n === targetNorm || s === targetNorm;
  });
  if (!attr) return false;
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

  const wcParams: any = { per_page: params.per_page ? Number(params.per_page) : 50 };
  if (params.page) wcParams.page = Number(params.page);

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

  const hasComplexFilters =
    categoryIds.length > 1 ||
    params.attribute_title ||
    params.attribute_character ||
    params.attribute_genre ||
    params.price_min ||
    params.price_max;
  if (hasComplexFilters) {
    wcParams.per_page = 500;
    wcParams.page = 1;
  }

  try {
    const res = await woo.get("products", { params: wcParams });
    let filteredProducts = res.data || [];

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

    // Атрибуты title, character, genre
    const titleVals = params.attribute_title
      ? String(params.attribute_title).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const characterVals = params.attribute_character
      ? String(params.attribute_character).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const genreVals = params.attribute_genre
      ? String(params.attribute_genre).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    if (titleVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "title", titleVals)
      );
    }
    if (characterVals.length) {
      filteredProducts = filteredProducts.filter((p: any) =>
        productMatchesAttribute(p, "character", characterVals)
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

    // Пагинация при complex-фильтрах
    if (hasComplexFilters) {
      const perPage = Number(params.per_page) || 24;
      const page = Math.max(1, Number(params.page) || 1);
      const start = (page - 1) * perPage;
      filteredProducts = filteredProducts.slice(start, start + perPage);
    }

    return new Response(JSON.stringify(filteredProducts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error("Woo API Error:", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch", details: err.message }),
      { status: 500 }
    );
  }
}