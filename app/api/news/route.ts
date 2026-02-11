import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
    
    if (!wpUrl) {
      console.error('WP_URL не налаштований в змінних оточення');
      return NextResponse.json(
        { error: 'WP_URL не налаштований' },
        { status: 500 }
      );
    }

    console.log('Завантаження новостей з:', `${wpUrl}/wp-json/wp/v2/posts`);

    const response = await axios.get(
      `${wpUrl}/wp-json/wp/v2/posts`,
      {
        params: {
          per_page: 10,
          orderby: 'date',
          order: 'desc',
          _embed: true,
        },
      }
    );

    console.log('Отримано новостей:', response.data.length);

    const posts = response.data.map((post: any) => {
      // 1. Достаем URL картинки из _embedded (благодаря параметру _embed: true)
      const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url 
        || post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url
        || '';

      return {
        id: post.id,
        title: post.title.rendered,
        // 2. Если есть короткое описание в ACF — берем его, если нет — чистим стандартный excerpt
        excerpt: post.acf?.short_description 
          ? post.acf.short_description 
          : post.excerpt.rendered.replace(/<[^>]*>/g, ''),
        content: post.content.rendered,
        date: post.date,
        slug: post.slug,
        image: imageUrl, // Передаем нормальную ссылку на картинку
        badge: post.acf?.badge || '', // Пробрасываем нашу плашку
      };
    }); 

    return NextResponse.json(posts, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Помилка отримання новостей:', error);
    return NextResponse.json(
      { error: 'Помилка завантаження новостей', details: error instanceof Error ? error.message : 'Невідома помилка' },
      { status: 500 }
    );
  }
}