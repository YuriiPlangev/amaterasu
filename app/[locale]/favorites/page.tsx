'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import ProductCard from '../../../components/ProductCard';
import { useFavoritesStore } from '../../../store/favoritesStore';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const locale = useLocale();
  const basePath = `/${locale}`;
  const items = useFavoritesStore((state) => state.items);

  const products = items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    images: item.image ? [{ src: item.image }] : (item.images && item.images.length > 0 ? item.images : [{ src: '/images/placeholder.jpg' }]),
    short_description: '',
    stock_status: 'instock' as const,
    tags: [],
  }));

  return (
    <main className="max-w-[1920px] w-full mx-auto site-padding-x py-10 mt-20">
      <h1 className="text-[clamp(24px,3vw,40px)] font-bold text-[#1C1C1C] mb-6 md:mb-8">
        {t('title')}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 gap-6 text-center">
          <p className="text-[#6B7280] text-lg">{t('empty')}</p>
          <Link
            href={`${basePath}/catalog`}
            className="bg-[#9C0000] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#7D0000] transition"
          >
            {t('goToCatalog')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
