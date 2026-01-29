'use client';

import React, { useState } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import ProductCard from '../../../components/ProductCard';

export default function CatalogPage() {
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [tagSlug, setTagSlug] = useState<string>('');

  const { data: products, isLoading, error } = useProducts({
    category_slug: categorySlug || undefined,
    tag_slug: tagSlug || undefined,
    per_page: 24,
  });

  return (
    <main className="max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px] py-10">
      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] sm:text-[48px] md:text-[55px] font-bold uppercase text-black">
            Каталог товарів
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Перегляньте всі доступні товари та скористайтесь простим фільтром за категоріями або тегами.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Slug категорії (WooCommerce)
            </label>
            <input
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="px-3 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000] bg-white text-black"
              placeholder="Напр. figures, posters..."
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Slug тега (WooCommerce)
            </label>
            <input
              value={tagSlug}
              onChange={(e) => setTagSlug(e.target.value)}
              className="px-3 py-2 border border-[#D8D8D8] rounded-md focus:outline-none focus:border-[#9C0000] bg-white text-black"
              placeholder="Напр. best-sellers"
            />
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="py-10 text-center text-gray-600">Завантаження товарів...</div>
      )}

      {error && (
        <div className="py-10 text-center text-red-600">
          Не вдалося завантажити товари. Спробуйте пізніше.
        </div>
      )}

      {!isLoading && !error && (
        <>
          {products && products.length > 0 ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <div key={product.id} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </section>
          ) : (
            <div className="py-10 text-center text-gray-600">
              Товари не знайдено. Спробуйте змінити фільтри.
            </div>
          )}
        </>
      )}
    </main>
  );
}


