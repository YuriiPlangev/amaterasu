'use client';
import React from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';

interface RelatedProductsProps {
  tagId?: number;
  categoryId?: number;
  excludeProductId?: number;
  limit?: number;
  showTitle?: boolean;
}

export default function RelatedProducts({
  tagId,
  categoryId,
  excludeProductId,
  limit = 4,
  showTitle = true,
}: RelatedProductsProps) {
  const params: any = {};
  if (tagId) params.tag = tagId;
  if (categoryId) params.category = categoryId;

  const { data: products, isLoading } = useProducts(params);

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    let filtered = products;

    if (tagId) {
      filtered = filtered.filter((product: any) => {
        return product.tags && product.tags.some((tag: any) => tag.id === tagId);
      });
    }

    if (categoryId) {
      filtered = filtered.filter((product: any) => {
        return product.categories && product.categories.some((cat: any) => cat.id === categoryId);
      });
    }

    if (excludeProductId) {
      filtered = filtered.filter((product: any) => product.id !== excludeProductId);
    }

    return filtered.slice(0, limit);
  }, [products, tagId, categoryId, excludeProductId, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {showTitle && <h2 className="text-2xl font-bold text-[#1C1C1C]">Схожі товари</h2>}
        <div className="text-[#6B7280]">Завантаження...</div>
      </div>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 relative overflow-visible">
      {showTitle && (
        <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold text-[#1C1C1C]">Схожі товари</h2>
      )}
      <div className="relative overflow-visible -mx-2 md:mx-0">
        <button
          className="related-products-prev absolute left-2 md:-left-[60px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md"
          aria-label="Прокрутити вліво"
        >
          <Image src="/svg/arrow-left.svg" alt="" width={24} height={24} />
        </button>
        <button
          className="related-products-next absolute right-2 md:-right-[60px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md"
          aria-label="Прокрутити вправо"
        >
          <Image src="/svg/arrow-right.svg" alt="" width={24} height={24} />
        </button>
        <Swiper
          slidesPerView={2}
          spaceBetween={12}
          breakpoints={{
            1600: { slidesPerView: 4, spaceBetween: 24 },
            1200: { slidesPerView: 3, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 16 },
            0: { slidesPerView: 2, spaceBetween: 12 },
          }}
          loop={filteredProducts.length >= 2}
          navigation={{
            nextEl: '.related-products-next',
            prevEl: '.related-products-prev',
          }}
          modules={[Navigation]}
          className="related-products-swiper pb-12"
        >
          {filteredProducts.map((product: any) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

