import { woo } from "../../../lib/woo";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const wcParams: any = {};

  // ФИЛЬТРЫ
  // 1) Фильтр по категории - WooCommerce REST API использует параметр category с ID
  if (params.category) {
    const categoryId = Number(params.category);
    wcParams.category = categoryId;
  }

  // 1.1) Фильтр по slug категории (best practice: конвертируем slug -> ID на сервере)
  if (!wcParams.category && params.category_slug) {
    try {
      const catRes = await woo.get("products/categories", {
        params: { slug: params.category_slug, per_page: 1 },
      });
      const category = Array.isArray(catRes.data) ? catRes.data[0] : null;
      if (category?.id) {
        wcParams.category = category.id;
      }
    } catch (e: any) {
      console.error("Woo category_slug lookup error:", e.message);
    }
  }

  // 2) Фильтр по тегам по ID
  if (params.tag) {
    wcParams.tag = Number(params.tag);
  }

  // 2.1) Фильтр по slug тега
  if (!wcParams.tag && params.tag_slug) {
    try {
      const tagRes = await woo.get("products/tags", {
        params: { slug: params.tag_slug, per_page: 1 },
      });
      const tag = Array.isArray(tagRes.data) ? tagRes.data[0] : null;
      if (tag?.id) {
        wcParams.tag = tag.id;
      }
    } catch (e: any) {
      console.error("Woo tag_slug lookup error:", e.message);
    }
  }

  // Дополнительные параметры для пагинации (если нужно)
  if (params.per_page) {
    wcParams.per_page = Number(params.per_page);
  }
  if (params.page) {
    wcParams.page = Number(params.page);
  }

  try {
    const res = await woo.get("products", { params: wcParams });

    // Дополнительная фильтрация на сервере для надежности
    let filteredProducts = res.data;

    if (wcParams.category) {
      const categoryId = Number(wcParams.category);
      filteredProducts = filteredProducts.filter((product: any) => {
        // Проверяем, есть ли категория в массиве categories товара
        return (
          product.categories &&
          product.categories.some((cat: any) => cat.id === categoryId)
        );
      });
    }

    if (wcParams.tag) {
      const tagId = Number(wcParams.tag);
      filteredProducts = filteredProducts.filter((product: any) => {
        // Проверяем, есть ли тег в массиве tags товара
        return product.tags && product.tags.some((tag: any) => tag.id === tagId);
      });
    }

    return new Response(JSON.stringify(filteredProducts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Woo API Error:", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch", details: err.message }),
      { status: 500 }
    );
  }
}

