import { woo } from "../../../../lib/woo";
import { NextResponse } from "next/server";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

// Кэшируем результат на 1 час
export const revalidate = 3600; 

function toTermOptions(items: any[]) {
  return items
    .map((item: any) => ({ id: Number(item.id), label: item.name }))
    .filter((item: any) => Number.isFinite(item.id) && item.label)
    .sort((a: any, b: any) => a.label.localeCompare(b.label, 'uk'));
}

/** Загрузка всех терминов атрибута с пагинацией (WooCommerce лимит 100/страница) */
async function fetchAllAttributeTerms(attrId: number): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const res = await woo.get(`products/attributes/${attrId}/terms?per_page=${perPage}&page=${page}`);
    const data = Array.isArray(res.data) ? res.data : [];
    all.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return all;
}

export async function GET() {
  try {
    // 1) Используем старый проверенный способ записи параметров в строку, 
    // чтобы библиотека точно отправила per_page=100 на сервер.
    const [catRes, attrsRes] = await Promise.all([
      woo.get("products/categories?per_page=100&hide_empty=false"),
      woo.get("products/attributes")
    ]);

    const attrIds = {
      character: attrsRes.data.find((a: any) => a.slug === 'pa_character' || a.slug === 'character')?.id,
      genre: attrsRes.data.find((a: any) => a.slug === 'pa_genre' || a.slug === 'genre')?.id,
      title: attrsRes.data.find((a: any) => a.slug === 'pa_title' || a.slug === 'title')?.id,
      games: attrsRes.data.find((a: any) => a.slug === 'pa_game' || a.slug === 'game')?.id,
    };

    // 2) Загружаем термины (с пагинацией — WooCommerce лимит 100/страница) и ACF
    const [charactersData, genresData, titlesData, gamesData, wpRes] = await Promise.all([
      attrIds.character ? fetchAllAttributeTerms(attrIds.character) : [],
      attrIds.genre ? fetchAllAttributeTerms(attrIds.genre) : [],
      attrIds.title ? fetchAllAttributeTerms(attrIds.title) : [],
      attrIds.games ? fetchAllAttributeTerms(attrIds.games) : [],
      fetch(`${WP_URL}/wp-json/wp/v2/product_cat?per_page=100&_fields=id,acf`, {
        next: { revalidate: 3600 }
      }).then(r => r.ok ? r.json() : [])
    ]);

    const wpCategories: Record<number, any> = {};
    wpRes.forEach((item: any) => { 
      if (item?.id) wpCategories[item.id] = item; 
    });

    // 3) Мапим данные
    const allCategories = catRes.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      is_custom_production: wpCategories[c.id]?.acf?.is_custom_production === true,
    }));

    // Разделяем на обычные и кастомные (чашки, брелки, значки, магниты)
    const customProductionCategories = allCategories
      .filter((c: any) => c.is_custom_production && Number(c?.id) !== 15)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    // В "categories" отдаем все категории, кроме avatar и "Без категории" (ID 15)
    const AVATAR_CATEGORY_ID = 7012;
    const UNCATEGORIZED_ID = 15;
    const excludeSlugs = ['avatars', 'avatar', 'uncategorized', 'bez-kategorii'];
    const categories = allCategories
      .filter((c: any) => {
        if (Number(c?.id) === AVATAR_CATEGORY_ID || Number(c?.id) === UNCATEGORIZED_ID) return false;
        const slug = String(c?.slug || '').toLowerCase();
        if (excludeSlugs.includes(slug)) return false;
        const name = String(c?.name || '').toLowerCase();
        if (name === 'без категории' || name === 'uncategorized') return false;
        return true;
      })
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    return NextResponse.json({
        categories,
        customProductionCategories,
        titles: toTermOptions(titlesData),
        characters: toTermOptions(charactersData),
        genres: toTermOptions(genresData),
        games: toTermOptions(gamesData),
      },
      {
        headers: { "Cache-Control": "public, s-maxage=3600" }
      }
    );

  } catch (err: any) {
    console.error("Catalog filters API error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}