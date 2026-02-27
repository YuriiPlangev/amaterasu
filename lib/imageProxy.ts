/**
 * Преобразует внешнюю URL изображения в прокси через локальное API
 * чтобы избежать SSL сертифікатних проблем
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/images/placeholder.jpg';
  }

  // Якщо це зовнішня URL (HTTP/HTTPS), прокси через API
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const encodedUrl = encodeURIComponent(imageUrl);
    return `/api/proxy-image?url=${encodedUrl}`;
  }

  // Якщо це локальна URL, повертаємо як є
  return imageUrl;
}
