import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

export async function GET(req: NextRequest) {
  try {
    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL is not configured' }, { status: 500 });
    }

    const requestUrl = new URL(req.url);
    const rawQ = requestUrl.searchParams.get('q') || requestUrl.searchParams.get('search') || '';
    const q = rawQ.trim();
    const page = requestUrl.searchParams.get('page') || '1';
    const perPage = requestUrl.searchParams.get('per_page') || '8';

    if (!q) {
      return NextResponse.json(
        {
          products: [],
          total: 0,
          page: 1,
          perPage: Number(perPage),
          totalPages: 0,
        },
        { status: 200 },
      );
    }

    const wpUrl = new URL(`${WP_URL.replace(/\/+$/, '')}/wp-json/amaterasu/v1/search`);
    wpUrl.searchParams.set('q', q);
    wpUrl.searchParams.set('page', page);
    wpUrl.searchParams.set('per_page', perPage);

    const res = await fetch(wpUrl.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        {
          error: 'Search failed',
          details: text || res.statusText,
        },
        { status: 500 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: 'Search failed',
        message: e?.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}

