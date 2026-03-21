import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Amaterasu';
  const price = searchParams.get('price') || '';
  const imageUrl = searchParams.get('image') || '';

  const priceText = price ? `${price} ₴` : '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1C1C1C',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Amaterasu
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
            width: '100%',
            marginTop: 32,
            marginBottom: 32,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={280}
              height={280}
              style={{
                objectFit: 'contain',
                borderRadius: 12,
                flexShrink: 0,
              }}
            />
          ) : null}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.2,
                marginBottom: 16,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
              }}
            >
              {name}
            </div>
            {priceText ? (
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#9C0000',
                }}
              >
                {priceText}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          amaterasu.shop — аніме мерч
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
