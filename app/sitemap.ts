import type { MetadataRoute } from 'next';
import { woo } from '../lib/woo';
import { getBaseUrl } from '../lib/seo';
import { locales } from '../i18n';
import axios from 'axios';

const STATIC_PATHS = ['', '/catalog', '/delivery', '/contacts', '/news', '/cart', '/favorites', '/account', '/auth/login', '/auth/register'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      const url = path ? `${base}/${locale}${path}` : `${base}/${locale}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : (path === '/news' ? 'daily' : 'weekly') as const,
        priority: path === '' ? 1 : 0.8,
      });
    }
  }

  try {
    const productsRes = await woo.get('products', { params: { per_page: 500, status: 'publish' } });
    const products = productsRes.data || [];
    for (const product of products) {
      const slug = product.slug;
      if (!slug) continue;
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/product/${encodeURIComponent(slug)}`,
          lastModified: product.date_modified ? new Date(product.date_modified) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.warn('Sitemap: could not fetch products', e);
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
            url: `${base}/${locale}/news/${encodeURIComponent(slug)}`,
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
