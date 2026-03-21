import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { woo } from '../../../../lib/woo';
import { absoluteUrl } from '../../../../lib/seo';
import { cleanDescription } from '../../../../lib/html';
import dynamic from 'next/dynamic';

const RelatedProducts = dynamic(
  () => import('../../../../components/RelatedProducts'),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-gray-100" /> }
);
import ProductGallery from '../../../../components/ProductGallery';
import ProductActions from '../../../../components/ProductActions';
import JsonLdProduct from '../../../../components/seo/JsonLdProduct';
import JsonLdBreadcrumb from '../../../../components/seo/JsonLdBreadcrumb';

export const revalidate = 300; // ISR: 5 min

const PRODUCT_FIELDS =
  'id,name,slug,description,short_description,price,regular_price,sale_price,stock_status,' +
  'images,categories,tags,attributes,meta_data,brands,brand,sku,virtual,permalink';

const ATTR_TERM_ID_CACHE_TTL_MS = 10 * 60 * 1000;
const attrTermIdCache = new Map<string, { id: number | null; expiresAt: number }>();

function toBooleanFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }
  return false;
}

function readMetaValue(metaData: any[] | undefined, key: string): unknown {
  if (!Array.isArray(metaData)) return undefined;
  const entry = metaData.find((m: any) => m?.key === key);
  return entry?.value;
}

function normalizeTermLabel(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

async function resolveAttributeTermId(attribute: any): Promise<number | null> {
  const attrId = Number(attribute?.id);
  const rawValue = Array.isArray(attribute?.options) ? attribute.options[0] : attribute?.option;
  const normalizedValue = normalizeTermLabel(rawValue);

  if (!Number.isInteger(attrId) || attrId <= 0 || !normalizedValue) {
    return null;
  }

  const cacheKey = `${attrId}:${normalizedValue}`;
  const cached = attrTermIdCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.id;
  }

  try {
    const res = await woo.get(
      `products/attributes/${attrId}/terms?search=${encodeURIComponent(String(rawValue))}&per_page=20`
    );
    const terms = Array.isArray(res.data) ? res.data : [];
    const match = terms.find((term: any) => {
      const termName = normalizeTermLabel(term?.name);
      const termSlug = normalizeTermLabel(term?.slug);
      return termName === normalizedValue || termSlug === normalizedValue;
    });

    const id = match?.id ? Number(match.id) : null;
    attrTermIdCache.set(cacheKey, { id, expiresAt: now + ATTR_TERM_ID_CACHE_TTL_MS });
    return id;
  } catch {
    attrTermIdCache.set(cacheKey, { id: null, expiresAt: now + ATTR_TERM_ID_CACHE_TTL_MS });
    return null;
  }
}

async function mergeWpAcfForProduct(product: any): Promise<any> {
  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  const productId = Number(product?.id);
  if (!wpUrl || !Number.isFinite(productId)) return product;

  try {
    const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/product/${productId}?_fields=id,acf`, {
      next: { revalidate: 300 },
    });
    if (!wpRes.ok) return product;

    const data = await wpRes.json();
    if (!data?.acf) return product;

    return {
      ...product,
      acf: {
        ...(product?.acf || {}),
        ...data.acf,
      },
    };
  } catch {
    return product;
  }
}

const getProductById = React.cache(async function getProductById(productId: number) {
  try {
    const res = await woo.get(`products/${productId}`, {
      params: { _fields: PRODUCT_FIELDS },
    });
    return res.data || null;
  } catch {
    return null;
  }
});

const getProductBySlug = React.cache(async function getProductBySlug(slug: string) {
  try {
    const decoded = decodeURIComponent(slug);
    const res = await woo.get('products', {
      params: { slug: decoded, _fields: PRODUCT_FIELDS, per_page: 1 },
    });
    
    const normalizeSlug = (s: string): string => {
      try {
        return decodeURIComponent(s).toLowerCase().trim();
      } catch {
        return s.toLowerCase().trim();
      }
    };
    
    const normalizedWant = normalizeSlug(decoded);
    
    // Сначала пробуем найти по совпадению slug
    let product = res.data?.find((p: any) => {
      const normalizedProduct = normalizeSlug(p.slug || '');
      return normalizedProduct === normalizedWant;
    });
    
    if (product) {
      return product;
    }
    
    // Если не найден, пробуем по ID
    if (!isNaN(Number(decoded))) {
      product = res.data?.find((p: any) => p.id === Number(decoded));
      if (product) {
        return product;
      }
    }
    
    // Если все еще не найден, ищем по частичному совпадению
    if (res.data) {
      const searchSlug = decoded.toLowerCase();
      product = res.data.find((p: any) => {
        const match = (p.slug || '').toLowerCase().includes(searchSlug) ||
          searchSlug.includes((p.slug || '').toLowerCase());
        return match;
      });
      if (product) {
        return product;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
});

/** Единая точка получения товара — React.cache дедуплицирует вызовы из generateMetadata и ProductPage */
const getProduct = React.cache(async function getProduct(
  slug: string,
  requestedId: number | undefined
) {
  if (Number.isFinite(requestedId) && requestedId! > 0) {
    const byId = await getProductById(requestedId!);
    if (byId) return byId;
  }

  const product = await getProductBySlug(slug);
  if (product) return product;

  if (Number.isFinite(requestedId) && requestedId! > 0) {
    return await getProductById(requestedId!);
  }
  return null;
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }> | { slug: string; locale: string };
  searchParams?: Promise<{ id?: string }> | { id?: string };
}): Promise<Metadata> {
  const { slug, locale } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const requestedId = Number(resolvedSearchParams?.id);
  const product = await getProduct(slug, Number.isFinite(requestedId) && requestedId > 0 ? requestedId : undefined);
  if (!product) return { title: 'Товар не знайдено' };
  const name = product.name || 'Product';
  const desc = cleanDescription(
    product.short_description || product.description || ''
  ).slice(0, 160);
  const path = `/${locale}/product/${slug}`;
  const baseUrl = absoluteUrl('');
  const ogImageUrl = `${baseUrl}/api/og?` + new URLSearchParams({
    name: name.slice(0, 80),
    price: String(product.price || ''),
    image: (product.images?.[0]?.src || '').slice(0, 500),
  }).toString();
  return {
    title: `${name} | Купити аніме мерч в Amaterasu`,
    description: desc,
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      title: `${name} | Amaterasu`,
      description: desc,
      url: absoluteUrl(path),
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
      locale: locale === 'uk' ? 'uk_UA' : 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Amaterasu`,
      description: desc,
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }> | { slug: string; locale: string };
  searchParams?: Promise<{ id?: string }> | { id?: string };
}) {
  try {
    // В Next.js 15 params может быть промисом
    const resolvedParams = await Promise.resolve(params);
    const resolvedSearchParams = await Promise.resolve(searchParams || {});
    const requestedId = Number(resolvedSearchParams?.id);
    const rawSlug = resolvedParams.slug;
    // Нормализуем slug - декодируем если он в URL-encoded формате
    let productSlug = resolvedParams.slug;
    try {
      // Пробуем декодировать, если не получается - используем как есть
      productSlug = decodeURIComponent(resolvedParams.slug);
    } catch (e) {
      // Если уже декодирован, используем как есть
      productSlug = resolvedParams.slug;
    }

    const tCard = await getTranslations('productCard');
    const tPage = await getTranslations('productPage');

    const product = await getProduct(
      productSlug,
      Number.isFinite(requestedId) && requestedId > 0 ? requestedId : undefined
    );

    if (!product) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[ProductPage] not found', {
          rawSlug,
          decodedSlug: productSlug,
          requestedId,
        });
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Товар не знайдено</h1>
            <p>Товар з таким slug не існує</p>
          </div>
        </div>
      );
    }

    const titleAttr = product?.attributes?.find((attr: any) =>
      attr?.name?.toLowerCase() === 'тайтл' || attr?.name?.toLowerCase() === 'title'
    );
    const characterAttr = product?.attributes?.find((attr: any) =>
      attr?.name?.toLowerCase() === 'персонаж' || attr?.name?.toLowerCase() === 'character'
    );
    const gamesAttr = product?.attributes?.find((attr: any) =>
      attr?.name?.toLowerCase() === 'гра' || attr?.name?.toLowerCase() === 'game' || attr?.name?.toLowerCase() === 'games'
    );

    const [productWithAcf, productTitleId, productCharacterId, productGameId] = await Promise.all([
      product?.acf ? Promise.resolve(product) : mergeWpAcfForProduct(product),
      resolveAttributeTermId(titleAttr),
      resolveAttributeTermId(characterAttr),
      resolveAttributeTermId(gamesAttr),
    ]);
    let productResolved = productWithAcf;

    // Получаем теги товара для поиска похожих товаров
    const productTags = productResolved.tags?.map((tag: any) => tag.id) || [];
    const firstTagId = productTags.length > 0 ? productTags[0] : undefined;
    const productCategories = productResolved.categories?.map((category: any) => category.id) || [];
    const firstCategoryId = productCategories.length > 0 ? productCategories[0] : undefined;

    const locale = resolvedParams.locale || 'uk';
    const isInStock = productResolved?.stock_status === 'instock';
    const hasLongDelivery =
      toBooleanFlag(productResolved?.acf?.delivery_status) ||
      toBooleanFlag(readMetaValue(productResolved?.meta_data, 'delivery_status')) ||
      toBooleanFlag(readMetaValue(productResolved?.meta_data, '_delivery_status')) ||
      toBooleanFlag(readMetaValue(productResolved?.meta_data, 'acf_delivery_status'));
    const productTag = productResolved?.tags?.[0]?.name || '';
    const productCategory = productResolved?.categories?.[0]?.name || '';
    const productCategoryId = productResolved?.categories?.[0]?.id || null;
    // Берем бренд так же, как в карточке товара
    const brandFromList = Array.isArray(productResolved?.brands)
      ? productResolved.brands.find((b: any) => {
          if (!b) return false;
          if (typeof b === 'string') return Boolean(b.trim());
          return Boolean(String(b?.name || '').trim());
        })
      : null;

    const productBrand =
      (typeof brandFromList === 'string' ? brandFromList : brandFromList?.name) ||
      (typeof productResolved?.brand === 'string' ? productResolved.brand : productResolved?.brand?.name) ||
      (Array.isArray(productResolved?.attributes)
        ? productResolved.attributes.find((attr: any) => {
            const attrName = String(attr?.name || '').toLowerCase();
            const attrSlug = String(attr?.slug || '').toLowerCase();
            return attrName.includes('brand') || attrName.includes('бренд') || attrSlug.includes('brand');
          })?.options?.[0]
        : '') ||
      '';
    const images = productResolved?.images || [];
    const mainImage = images?.[0]?.src || '/images/placeholder.jpg';

    const shortDescription = cleanDescription(productResolved?.short_description || '');
    const productTitle = titleAttr?.options?.[0] || titleAttr?.option || '';
    const productCharacter = characterAttr?.options?.[0] || characterAttr?.option || '';

    const attributes = (productResolved?.attributes || [])
      .filter((attr: any) => attr?.name && (attr?.options?.length || attr?.option))
      .slice(0, 5)
      .map((attr: any) => ({
        name: attr.name,
        value: Array.isArray(attr.options) ? attr.options.join(', ') : attr.option || ''
      }));

    // Build breadcrumbs: Home - Catalog - Category - Title - Character - Product Name (skip if not available)
    const breadcrumbItems = [];
    breadcrumbItems.push({ name: locale === 'uk' ? 'Головна' : 'Home', path: '' });
    breadcrumbItems.push({ name: locale === 'uk' ? 'Каталог' : 'Catalog', path: '/catalog' });
    
    if (productCategory && productCategoryId) {
      breadcrumbItems.push({ 
        name: productCategory, 
        path: `/catalog?categories=${productCategoryId}` 
      });
    }
    
    if (productTitle) {
      breadcrumbItems.push({ 
        name: productTitle, 
        path: `/catalog?attribute_title=${productTitleId || encodeURIComponent(productTitle)}` 
      });
    }
    
    if (productCharacter) {
      breadcrumbItems.push({ 
        name: productCharacter, 
        path: `/catalog?attribute_character=${productCharacterId || encodeURIComponent(productCharacter)}` 
      });
    }
    
    breadcrumbItems.push({ name: productResolved.name, path: '' });

    return (
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-6 md:py-8 pt-20 md:pt-24 mt-12">
        <JsonLdProduct product={productResolved} locale={locale} />
        <JsonLdBreadcrumb items={breadcrumbItems} locale={locale} />
        <nav className="text-sm text-[#9C9C9C] mb-4 md:mb-6 flex items-center flex-wrap gap-1 overflow-x-hidden">
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 min-w-0 max-w-full">
              {index > 0 && <span className="text-[#9C9C9C] flex-shrink-0">›</span>}
              {index < breadcrumbItems.length - 1 ? (
                <Link href={`/${locale}${item.path || ''}`} className="hover:text-[#1C1C1C] truncate min-w-0">
                  {item.name}
                </Link>
              ) : (
                <span className="text-[#1C1C1C] truncate min-w-0 block" title={item.name}>{item.name}</span>
              )}
            </div>
          ))}
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 lg:items-stretch">
          <ProductGallery
            product={productResolved}
            name={productResolved?.name}
            tag={productBrand}
            images={images}
            fallbackSrc={mainImage}
          />

          <aside className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {productBrand && (
                <span className="inline-flex w-fit items-center rounded-md bg-[#9C0000] px-4 py-2 text-xs md:text-sm font-semibold leading-none text-white">
                  {productBrand}
                </span>
              )}
              <h1 className="text-[clamp(20px,2.2vw,28px)] font-semibold text-[#1C1C1C] leading-snug">
                {productResolved?.name}
                {shortDescription && (
                  <span className="block mt-1 text-base md:text-lg font-normal text-[#6B7280]">
                    {shortDescription}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col items-start gap-1">
                <p className="text-[#9C0000] text-[clamp(24px,2.5vw,32px)] font-bold">{productResolved?.price} ₴</p>
                {productResolved?.regular_price && parseFloat(productResolved?.regular_price) > parseFloat(productResolved?.price || '0') && (
                  <p className="text-[#9C9C9C] text-[clamp(16px,1.8vw,20px)] font-semibold line-through">{productResolved?.regular_price} ₴</p>
                )}
              </div>
              <span className={`text-sm font-semibold ${isInStock ? 'text-[#2E7900]' : 'text-[#9C0000]'}`}>
                {isInStock ? tCard('inStock') : tCard('outOfStock')}
              </span>
            </div>

            <ProductActions product={productResolved} />

            <div className="border border-[#E6E6E6] rounded-xl p-4 md:p-5">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-3">{tPage('characteristics')}</h2>
              <div className="space-y-3 text-sm">
                {attributes.length > 0 ? (
                  attributes.map((attr: any) => (
                    <div key={attr.name} className="flex justify-between gap-4">
                      <span className="text-[#6B7280] shrink-0">{attr.name}</span>
                      <span className="text-[#1C1C1C] text-right">{attr.value}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-[#6B7280]">{tPage('material')}</span><span className="text-[#1C1C1C]">—</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">{tPage('condition')}</span><span className="text-[#1C1C1C]">—</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-xl p-4 md:p-5">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-4">{tPage('delivery')}</h2>
              <div className="space-y-4">
                {hasLongDelivery && (
                  <div className="rounded-xl border border-[#E9E1D3] bg-[#FAF7F2] px-3 py-3">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white border border-[#E9E1D3] flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C0000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1C1C1C]">
                          {locale === 'uk' ? 'Термін доставки: від 14 днів' : 'Delivery time: from 14 days'}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {locale === 'uk'
                            ? 'Для цього товару потрібно більше часу на виготовлення та відправку.'
                            : 'This item needs additional time for production and dispatch.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#BCBCBC33]">
                  <div className="flex items-start items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[#9C0000]">
                      <Image src="/svg/novapost.svg" alt="Nova Poshta" width={36} height={36} />
                    </span>
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">Нова Пошта</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{tPage('deliveryNovaDesc')}</p>
                    </div>
                  </div>
                  <span className="text-[#9C0000] font-semibold shrink-0">45–70 грн.</span>
                </div>
                <div className="flex items-center items-start justify-between gap-4">
                  <div className="flex items-start items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-amber-600">
                      <Image src="/svg/ukrpost.svg" alt="Ukrpost" width={36} height={36} />
                    </span>
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">Укрпошта</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{tPage('deliveryUkrDesc')}</p>
                    </div>
                  </div>
                  <span className="text-[#9C0000] font-semibold shrink-0">45–70 грн.</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12 md:mt-16 space-y-12 md:space-y-16">
          <RelatedProducts
            attributeTitleId={productTitleId}
            attributeGamesId={productGameId}
            tagId={firstTagId}
            excludeProductId={productResolved.id}
            limit={8}
            showTitle={true}
            titleKey="similarFromTitle"
          />
          <RelatedProducts
            categoryId={firstCategoryId}
            excludeProductId={productResolved.id}
            limit={8}
            showTitle={true}
            titleKey="similarFromCategory"
          />
        </section>
      </div>
    );
  } catch (error: any) {
    console.error('Error fetching product:', error.message);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Помилка завантаження</h1>
          <p>{error.message || 'Не вдалося завантажити товар'}</p>
        </div>
      </div>
    );
  }
}


