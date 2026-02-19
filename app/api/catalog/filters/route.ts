import { woo } from "../../../../lib/woo";
import { NextResponse } from "next/server";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

// Кэшируем результат на 1 час, чтобы не дергать базу при каждом обновлении страницы
export const revalidate = 3600; 

export async function GET() {
  try {
    // 1) Первый уровень параллелизма: получаем категории и список атрибутов
    // Используем прямой запрос для категорий, чтобы избежать лимита в 10 штук
    const [catRes, attrsRes] = await Promise.all([
      woo.get("products/categories", { params: { per_page: 100, hide_empty: false } }),
      woo.get("products/attributes")
    ]);

    const attrIds = {
      character: attrsRes.data.find((a: any) => a.slug === 'pa_character' || a.slug === 'character')?.id,
      genre: attrsRes.data.find((a: any) => a.slug === 'pa_genre' || a.slug === 'genre')?.id,
      title: attrsRes.data.find((a: any) => a.slug === 'pa_title' || a.slug === 'title')?.id,
    };

    // 2) Второй уровень параллелизма: загружаем термины и ACF одновременно
    // Если ID нет, возвращаем пустой массив сразу, не делая запрос
    const [charactersData, genresData, titlesData, wpRes] = await Promise.all([
      attrIds.character ? woo.get(`products/attributes/${attrIds.character}/terms`, { params: { per_page: 100 } }) : { data: [] },
      attrIds.genre ? woo.get(`products/attributes/${attrIds.genre}/terms`, { params: { per_page: 100 } }) : { data: [] },
      attrIds.title ? woo.get(`products/attributes/${attrIds.title}/terms`, { params: { per_page: 100 } }) : { data: [] },
      fetch(`${WP_URL}/wp-json/wp/v2/product_cat?per_page=100&_fields=id,acf`, {
        next: { revalidate: 3600 } // Кэшируем fetch запрос отдельно
      }).then(r => r.ok ? r.json() : [])
    ]);

    // Быстрый маппинг ACF
    const wpCategories: Record<number, any> = {};
    wpRes.forEach((item: any) => { 
      if (item?.id) wpCategories[item.id] = item; 
    });

    // Формируем основной массив категорий
    const allCategories = catRes.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      is_custom_production: wpCategories[c.id]?.acf?.is_custom_production === true,
    }));

    // Сохраняем структуру, которую ждет твой компонент
    const customProductionCategories = allCategories
      .filter((c: any) => c.is_custom_production)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    const categories = allCategories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    // Извлекаем имена из данных терминов
    const titles = titlesData.data.map((t: any) => t.name).sort();
    const characters = charactersData.data.map((t: any) => t.name).sort();
    const genres = genresData.data.map((t: any) => t.name).sort();

    return NextResponse.json(
      {
        categories,
        customProductionCategories,
        titles,
        characters,
        genres,
      },
      {
        headers: {
          // Дополнительная защита на уровне браузера
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );

  } catch (err: any) {
    console.error("Catalog filters API error:", err.message);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}