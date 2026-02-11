import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      return NextResponse.json({ error: 'WP_URL не налаштований' }, { status: 500 });
    }

    const res = await fetch(`${wpUrl}/wp-json/wp/v2/product_cat?per_page=100`);
    const categories = await res.json();
    const popular = Array.isArray(categories)
      ? categories.filter((cat: any) => cat.acf && cat.acf.is_popular === true)
      : [];

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
