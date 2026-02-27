import { woo } from "../../../../lib/woo";
import { NextResponse } from "next/server";

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

// Кэшируем результат на 1 час
export const revalidate = 3600; 

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
    };

    // 2) Загружаем термины (тоже через строку для надежности) и ACF
    const [charactersData, genresData, titlesData, wpRes] = await Promise.all([
      attrIds.character ? woo.get(`products/attributes/${attrIds.character}/terms?per_page=100`) : { data: [] },
      attrIds.genre ? woo.get(`products/attributes/${attrIds.genre}/terms?per_page=100`) : { data: [] },
      attrIds.title ? woo.get(`products/attributes/${attrIds.title}/terms?per_page=100`) : { data: [] },
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

    // Разделяем на обычные и кастомные, но возвращаем ОБА массива
    const customProductionCategories = allCategories
      .filter((c: any) => c.is_custom_production)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    // В "categories" отдаем вообще ВСЕ категории (как было раньше), 
    // чтобы фронтенд точно ничего не потерял
    const categories = allCategories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));

    return NextResponse.json({
        categories,
        customProductionCategories,
        titles: titlesData.data.map((t: any) => t.name).sort(),
        characters: charactersData.data.map((t: any) => t.name).sort(),
        genres: genresData.data.map((t: any) => t.name).sort(),
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