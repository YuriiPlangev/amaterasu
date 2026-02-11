import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { woo } from '../../../../lib/woo';
import RelatedProducts from '../../../../components/RelatedProducts';
import ProductGallery from '../../../../components/ProductGallery';

// Отключаем кэширование для динамических страниц
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ slug: string; locale: string }> | { slug: string; locale: string } }) {
  try {
    // В Next.js 15 params может быть промисом
    const resolvedParams = await Promise.resolve(params);
    // Нормализуем slug - декодируем если он в URL-encoded формате
    let productSlug = resolvedParams.slug;
    try {
      // Пробуем декодировать, если не получается - используем как есть
      productSlug = decodeURIComponent(resolvedParams.slug);
    } catch (e) {
      // Если уже декодирован, используем как есть
      productSlug = resolvedParams.slug;
    }
    
 
    
    // Получаем товар по slug через WooCommerce API
    const res = await woo.get('products', { params: { slug: productSlug } });
    
    
    
    // Нормализуем и сравниваем slug'и
    // Ищем товар с точным совпадением slug (нормализуем оба значения)
    const normalizeSlug = (slug: string): string => {
      try {
        return decodeURIComponent(slug).toLowerCase();
      } catch {
        return slug.toLowerCase();
      }
    };
    
    const normalizedRequestSlug = normalizeSlug(productSlug);
    
    const product = res.data?.find((p: any) => {
      const normalizedProductSlug = normalizeSlug(p.slug || '');
      return normalizedProductSlug === normalizedRequestSlug;
    }) || null;
    

    
    if (!product) {
      return (
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Товар не знайдено</h1>
            <p>Товар з таким slug не існує</p>
          </div>
        </main>
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

    return (
      <main className="max-w-[1920px] w-full mx-auto site-padding-x py-6 md:py-8 pt-20 md:pt-24 mt-12">
        <nav className="text-sm text-[#9C9C9C] mb-4 md:mb-6">
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

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start">
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
                {isInStock ? 'В наявності' : 'Немає в наявності'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-[#9C0000] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#7D0000] transition flex items-center justify-center gap-2 text-sm uppercase">
                <Image src="/svg/shopping-bag.svg" alt="" width={20} height={20} className="brightness-0 invert" />
                Купити
              </button>
              <button className="flex-1 border-2 border-[#9C0000] text-[#9C0000] font-bold py-4 px-6 rounded-xl hover:bg-[#9C0000] hover:text-white transition text-sm uppercase">
                В кошик
              </button>
            </div>

            <div className="border border-[#E6E6E6] rounded-xl p-4 md:p-5">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-3">Характеристики</h2>
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
                    <div className="flex justify-between"><span className="text-[#6B7280]">Матеріал</span><span className="text-[#1C1C1C]">—</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Стан</span><span className="text-[#1C1C1C]">—</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="border border-[#E6E6E6] rounded-xl p-4 md:p-5">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-4">Доставка</h2>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-dashed border-[#E5E7EB]">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-[#9C0000]/10 flex items-center justify-center shrink-0 text-[#9C0000]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    </span>
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">Нова Пошта</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">Доставка по всій Україні, оплата при отриманні</p>
                    </div>
                  </div>
                  <span className="text-[#9C0000] font-semibold shrink-0">45–70 грн.</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </span>
                    <div>
                      <p className="font-semibold text-[#1C1C1C]">Укрпошта</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">Доставка по всій Україні, оплата при отриманні</p>
                    </div>
                  </div>
                  <span className="text-[#9C0000] font-semibold shrink-0">45–70 грн.</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12 md:mt-16">
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
              <h2 className="text-2xl font-bold mb-4 text-black">Схожі товари по категоріям</h2>
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
      </main>
    );
  } catch (error: any) {
    console.error('Error fetching product:', error.message);
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Помилка завантаження</h1>
          <p>{error.message || 'Не вдалося завантажити товар'}</p>
        </div>
      </main>
    );
  }
}


