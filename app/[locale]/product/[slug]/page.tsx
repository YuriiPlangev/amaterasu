import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { woo } from '../../../../lib/woo';
import { absoluteUrl } from '../../../../lib/seo';
import RelatedProducts from '../../../../components/RelatedProducts';
import ProductGallery from '../../../../components/ProductGallery';
import ProductActions from '../../../../components/ProductActions';
import JsonLdProduct from '../../../../components/seo/JsonLdProduct';
import JsonLdBreadcrumb from '../../../../components/seo/JsonLdBreadcrumb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProductById(productId: number) {
  try {
    const res = await woo.get(`products/${productId}`);
    return res.data || null;
  } catch {
    return null;
  }
}

async function getProductBySlug(slug: string) {
  try {
    const decoded = decodeURIComponent(slug);
    const res = await woo.get('products', { params: { slug: decoded } });
    
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
}

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
  const product = Number.isFinite(requestedId) && requestedId > 0
    ? await getProductById(requestedId)
    : await getProductBySlug(slug);
  if (!product) return { title: 'Товар не знайдено' };
  const name = product.name || 'Product';
  const desc =
    (product.short_description && product.short_description.replace(/<[^>]*>/g, '').trim()) ||
    (product.description && product.description.replace(/<[^>]*>/g, '').trim().slice(0, 160)) ||
    '';
  const image = product.images?.[0]?.src;
  const path = `/${locale}/product/${slug}`;
  return {
    title: name,
    description: desc.slice(0, 160),
    openGraph: {
      title: name,
      description: desc.slice(0, 160),
      url: absoluteUrl(path),
      images: image ? [{ url: image, alt: name }] : undefined,
      locale: locale === 'uk' ? 'uk_UA' : 'en_GB',
    },
    alternates: {
      canonical: absoluteUrl(path),
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

    console.log('[ProductPage] open', {
      locale: resolvedParams.locale,
      rawSlug,
      decodedSlug: productSlug,
      requestedId: Number.isFinite(requestedId) && requestedId > 0 ? requestedId : null,
    });
    const tCard = await getTranslations('productCard');
    const tPage = await getTranslations('productPage');

    let product: any = null;

    if (Number.isFinite(requestedId) && requestedId > 0) {
      product = await getProductById(requestedId);
      console.log('[ProductPage] direct id lookup', {
        productId: requestedId,
        found: Boolean(product),
      });
    }
    
    let res: any = { data: [] };
    if (!product) {
      // Получаем товар по slug через WooCommerce API
      res = await woo.get('products', { params: { slug: productSlug } });
      console.log('[ProductPage] woo candidates', {
        count: Array.isArray(res.data) ? res.data.length : 0,
        requestedSlug: productSlug,
      });
    }
    
    // Нормализуем и сравниваем slug'и
    // Ищем товар с точным совпадением slug (нормализуем оба значения)
    const normalizeSlug = (slug: string): string => {
      try {
        return decodeURIComponent(slug).toLowerCase().trim();
      } catch {
        return slug.toLowerCase().trim();
      }
    };
    
    const normalizedRequestSlug = normalizeSlug(productSlug);

    if (!product) {
      // Сначала пробуем найти по slug
      product = res.data?.find((p: any) => {
        const normalizedProductSlug = normalizeSlug(p.slug || '');
        return normalizedProductSlug === normalizedRequestSlug;
      }) || null;

      console.log('[ProductPage] exact slug match', {
        found: Boolean(product),
        normalizedRequestSlug,
      });
    }

    // Если не найден по slug, пробуем как ID (на случай если slug - это число)
    if (!product && !isNaN(Number(productSlug))) {
      const productId = Number(productSlug);
      product = res.data?.find((p: any) => p.id === productId) || null;
      console.log('[ProductPage] fallback id match', {
        found: Boolean(product),
        productId,
      });
    }

    // Если все еще не найден, пробуем поиск без нормализации (на сдучай если был изменен slug)
    if (!product && res.data && res.data.length > 0) {
      // Ищем по частичному совпадению для товаров с проблемами кодирования
      const searchSlug = productSlug.toLowerCase();
      product = res.data.find((p: any) => 
        (p.slug || '').toLowerCase().includes(searchSlug) ||
        searchSlug.includes((p.slug || '').toLowerCase())
      ) || null;
      console.log('[ProductPage] fallback partial match', {
        found: Boolean(product),
        searchSlug,
      });
    }
    

    
    if (!product) {
      console.error('[ProductPage] not found', {
        rawSlug,
        decodedSlug: productSlug,
        normalizedRequestSlug,
        candidates: (res.data || []).map((p: any) => ({ id: p.id, slug: p.slug })),
      });
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Товар не знайдено</h1>
            <p>Товар з таким slug не існує</p>
          </div>
        </div>
      );
    }

    // Получаем теги товара для поиска похожих товаров
    const productTags = product.tags?.map((tag: any) => tag.id) || [];
    const firstTagId = productTags.length > 0 ? productTags[0] : undefined;
    const productCategories = product.categories?.map((category: any) => category.id) || [];
    const firstCategoryId = productCategories.length > 0 ? productCategories[0] : undefined;

    const locale = resolvedParams.locale || 'uk';
    const isInStock = product?.stock_status === 'instock';
    const productTag = product?.tags?.[0]?.name || '';
    const images = product?.images || [];
    const mainImage = images?.[0]?.src || '/images/placeholder.jpg';

    const shortDescription = product?.short_description
      ? product.short_description.replace(/<[^>]*>/g, '').trim()
      : '';

    const attributes = (product?.attributes || [])
      .filter((attr: any) => attr?.name && (attr?.options?.length || attr?.option))
      .slice(0, 5)
      .map((attr: any) => ({
        name: attr.name,
        value: Array.isArray(attr.options) ? attr.options.join(', ') : attr.option || ''
      }));

    const breadcrumbItems = [
      { name: locale === 'uk' ? 'Головна' : 'Home', path: '' },
      { name: productTag || (locale === 'uk' ? 'Каталог' : 'Catalog'), path: '/catalog' },
      { name: product.name, path: `/product/${product.slug}` },
    ];

    return (
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-6 md:py-8 pt-20 md:pt-24 mt-12">
        <JsonLdProduct product={product} locale={locale} />
        <JsonLdBreadcrumb items={breadcrumbItems} locale={locale} />
        <nav className="text-sm text-[#9C9C9C] mb-4 md:mb-6 flex items-center">
          <Link href={`/${locale}`} className="hover:text-[#1C1C1C]">Головна</Link>
          <span className="mx-1.5">›</span>
          {productTag && (
            <>
              <Link href={`/${locale}/catalog`} className="hover:text-[#1C1C1C]">{productTag}</Link>
              <span className="mx-1.5">›</span>
            </>
          )}
          <span className="text-[#1C1C1C] truncate max-w-[200px] sm:max-w-none inline-block">{product?.name}</span>
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-stretch">
          <ProductGallery
            product={product}
            name={product?.name}
            tag={productTag}
            images={images}
            fallbackSrc={mainImage}
          />

          <aside className="flex flex-col gap-5">
            <h1 className="text-[clamp(20px,2.2vw,28px)] font-semibold text-[#1C1C1C] leading-snug">
              {product?.name}
              {shortDescription && (
                <span className="block mt-1 text-base md:text-lg font-normal text-[#6B7280]">{shortDescription}</span>
              )}
            </h1>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[#9C0000] text-[clamp(24px,2.5vw,32px)] font-bold">{product?.price} ₴</p>
              <span className={`text-sm font-semibold ${isInStock ? 'text-[#2E7900]' : 'text-[#9C0000]'}`}>
                {isInStock ? tCard('inStock') : tCard('outOfStock')}
              </span>
            </div>

            <ProductActions product={product} />

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
          {(firstTagId || firstCategoryId) && (
            <div>
              <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold mb-6 text-[#1C1C1C]">Схожі товари</h2>
              <RelatedProducts
                tagId={firstTagId}
                categoryId={firstCategoryId}
                excludeProductId={product.id}
                limit={6}
                showTitle={false}
              />
            </div>
          )}
          {firstCategoryId && (
            <div>
              <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold mb-6 text-[#1C1C1C]">Схожі товари по категоріям</h2>
              <RelatedProducts
                tagId={firstTagId}
                categoryId={firstCategoryId}
                excludeProductId={product.id}
                limit={6}
                showTitle={false}
              />
            </div>
          )}
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


