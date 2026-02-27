import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL параметр обов\'язковий' },
      { status: 400 }
    );
  }

  try {
    // Декодируем URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Для HTTPS создаем agent, который игнорирует проблемы сертификата
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    // Добавляем агент для обработки HTTPS
    if (decodedUrl.startsWith('https://')) {
      (fetchOptions as any).agent = httpsAgent;
    }

    const response = await fetch(decodedUrl, fetchOptions);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Помилка завантаження: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Помилка прокси зображення:', error);
    return NextResponse.json(
      { error: 'Помилка завантаження зображення' },
      { status: 500 }
    );
  }
}
