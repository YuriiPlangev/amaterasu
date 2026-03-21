import type { MetadataRoute } from 'next';
import { woo } from '../lib/woo';
import { getBaseUrl } from '../lib/seo';
import { locales } from '../i18n';
import axios from 'axios';

// Сервисные страницы (/cart, /favorites, /account, /auth/*) не включаем в sitemap
const STATIC_PATHS = ['', '/catalog', '/delivery', '/contacts', '/news'];

function buildUrl(base: string, locale: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}/${locale}${cleanPath}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/+$/, '');
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      const url = path ? buildUrl(base, locale, path) : `${base}/${locale}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : (path === '/news' ? 'daily' : 'weekly'),
        priority: path === '' ? 1 : 0.8,
      });
    }
  }

  const MAX_PRODUCT_URLS = 2000; // limit for sitemap size
  try {
    const allProducts: any[] = [];
    const perPage = 100;
    const maxPages = 100;
    let page = 1;

    while (page <= maxPages) {
      const productsRes = await woo.get('products', {
        params: { per_page: perPage, page, status: 'publish' },
      });
      const chunk = productsRes.data || [];
      allProducts.push(...chunk);
      const totalHeader = productsRes.headers?.['x-wp-total'] ?? productsRes.headers?.['X-WP-Total'];
      const total = Number(totalHeader) || 0;
      if (chunk.length < perPage || (total > 0 && page * perPage >= total) || allProducts.length >= MAX_PRODUCT_URLS) break;
      page += 1;
    }
    // truncate to limit
    if (allProducts.length > MAX_PRODUCT_URLS) allProducts.length = MAX_PRODUCT_URLS;

    const categoriesRes = await woo.get('products/categories', {
      params: { per_page: 100, exclude: [1] },
    });
    const categories = categoriesRes.data || [];
    for (const product of allProducts) {
      const slug = product.slug;
      if (!slug) continue;
      for (const locale of locales) {
        entries.push({
          url: buildUrl(base, locale, `/product/${encodeURIComponent(slug)}`),
          lastModified: product.date_modified ? new Date(product.date_modified) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        });
      }
    }
    for (const cat of categories as { slug?: string; id?: number }[]) {
      if (!cat?.slug) continue;
      for (const locale of locales) {
        entries.push({
          url: buildUrl(base, locale, `/catalog?categories=${cat.id}`),
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.warn('Sitemap: could not fetch products/categories', e);
  }

  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  if (wpUrl) {
    try {
      const { data: posts } = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
        params: { per_page: 100, status: 'publish' },
      });
      for (const post of posts || []) {
        const slug = post.slug;
        if (!slug) continue;
        for (const locale of locales) {
          entries.push({
            url: buildUrl(base, locale, `/news/${encodeURIComponent(slug)}`),
            lastModified: post.modified ? new Date(post.modified) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          });
        }
      }
    } catch (e) {
      console.warn('Sitemap: could not fetch news', e);
    }
  }

  return entries;
}
