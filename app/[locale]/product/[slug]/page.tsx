import React from 'react';
import { woo } from '../../../../lib/woo';
import ProductCard from '../../../../components/ProductCard';
import RelatedProducts from '../../../../components/RelatedProducts';

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

    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-[400px] mb-8">
          <ProductCard product={product} />
        </div>
        
        {/* Схожие товары по тегам */}
        {firstTagId && (<div>
          <h2 className="text-2xl font-bold mb-4 text-black">Похожие товары по тегам</h2>
          <RelatedProducts 
            tagId={firstTagId} 
            excludeProductId={product.id}
            limit={4}
          />
        </div>)}
        {firstCategoryId && (<div>
          <h2 className="text-2xl font-bold mb-4 text-black">Похожие товары по категории</h2>
          <RelatedProducts 
            categoryId={firstCategoryId} 
            excludeProductId={product.id}
            limit={4}
          />
        </div>)}
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


