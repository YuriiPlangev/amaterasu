import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { decodeHtmlEntities } from '../../../../lib/html';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

    if (!wpUrl) {
      return NextResponse.json(
        { error: 'WP_URL не налаштований' },
        { status: 500 }
      );
    }

    const response = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
      params: { slug, _embed: true },
    });

    if (!response.data || response.data.length === 0) {
      return NextResponse.json({ error: 'Новину не знайдено' }, { status: 404 });
    }

    const post = response.data[0];
    const imageUrl =
      post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
      post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url ||
      '';

    const mapped = {
      id: post.id,
      title: decodeHtmlEntities(post.title.rendered),
      excerpt: decodeHtmlEntities(
        post.acf?.short_description
          ? post.acf.short_description
          : post.excerpt.rendered.replace(/<[^>]*>/g, '')
      ),
      content: post.content.rendered,
      date: post.date,
      slug: post.slug,
      image: imageUrl,
      badge: decodeHtmlEntities(post.acf?.badge || ''),
    };

    return NextResponse.json(mapped, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Помилка отримання новини:', error);
    return NextResponse.json(
      {
        error: 'Помилка завантаження',
        details: error instanceof Error ? error.message : 'Невідома помилка',
      },
      { status: 500 }
    );
  }
}
