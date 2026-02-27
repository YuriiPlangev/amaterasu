import { NextResponse } from 'next/server';
import { woo } from '../../../lib/woo';

export async function GET() {
  try {
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      return NextResponse.json({ error: 'WP_URL не налаштований' }, { status: 500 });
    }

    // Получаем категории из WooCommerce (для изображений и базовой информации)
    const wooRes = await woo.get('products/categories', {
      per_page: 100,
    });
    
    const wooCategories = wooRes.data || [];
    
    // Получаем ACF данные из WordPress REST API
    const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/product_cat?per_page=100&_fields=id,acf`);
    const wpCategories = await wpRes.json();
    
    // Создаем карту ACF данных по ID
    const acfMap: Record<number, any> = {};
    if (Array.isArray(wpCategories)) {
      wpCategories.forEach((cat: any) => {
        if (cat?.id && cat?.acf) {
          acfMap[cat.id] = cat.acf;
        }
      });
    }
    
    // Объединяем данные: берем из WooCommerce + добавляем ACF из WordPress
    const categoriesWithAcf = wooCategories.map((cat: any) => ({
      ...cat,
      acf: acfMap[cat.id] || {}
    }));
    
    // Фильтруем популярные категории
    const popular = categoriesWithAcf.filter((cat: any) => cat.acf?.is_popular === true);

    console.log('Популярні категорії:', popular.length, 'з', categoriesWithAcf.length);
    console.log('Приклад категорії:', popular[0]);

    return NextResponse.json(popular, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Помилка завантаження категорій:', error);
    return NextResponse.json(
      { error: 'Помилка завантаження категорій' },
      { status: 500 }
    );
  }
}
