/**
 * SEO helpers: base URL and default metadata.
 * Set NEXT_PUBLIC_SITE_URL in .env (e.g. https://amaterasu-shop.com) for production.
 */
export const SITE_NAME = 'Amaterasu';
export const DEFAULT_DESCRIPTION_UK =
  'Інтернет-магазин аніме атрибутики. Плакати, наклейки, мерч з улюблених аніме та можливість замовити індивідуальний дизайн. Доставка по Україні.';
export const DEFAULT_DESCRIPTION_EN =
  'Anime merchandise shop. Posters, stickers, merch from your favorite anime and custom design orders. Delivery across Ukraine.';

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (env) return env.startsWith('http') ? env : `https://${env}`;
  return 'https://amaterasu-shop.com';
}

/** Build full URL for canonical / openGraph. path: e.g. "/uk" or "/uk/catalog" */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
