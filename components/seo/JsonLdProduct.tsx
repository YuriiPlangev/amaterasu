import { absoluteUrl } from '../../lib/seo';

type Product = {
  name: string;
  description?: string;
  short_description?: string;
  price?: string;
  images?: { src: string }[];
  sku?: string;
  slug?: string;
  stock_status?: string;
};

export default function JsonLdProduct({
  product,
  locale,
}: {
  product: Product;
  locale: string;
}) {
  const base = absoluteUrl(`/${locale}`);
  const url = `${base}/product/${product.slug || ''}`;
  const image = product.images?.[0]?.src;
  const description =
    (product.short_description && product.short_description.replace(/<[^>]*>/g, '').trim()) ||
    (product.description && product.description.replace(/<[^>]*>/g, '').trim()) ||
    product.name;

  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: description.slice(0, 500),
    url,
    image: image ? [image] : undefined,
    sku: product.sku || undefined,
    offers: {
      '@type': 'Offer',
      price: product.price ? parseFloat(String(product.price).replace(/[^\d.,]/g, '').replace(',', '.') : undefined,
      priceCurrency: 'UAH',
      availability: product.stock_status === 'instock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
