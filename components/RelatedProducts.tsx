'use client';
import React from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/pagination';

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
  showTitle = true
}: RelatedProductsProps) {
  const params: any = {};
  if (tagId) params.tag = tagId;
  if (categoryId) params.category = categoryId;
  
  const { data: products, isLoading } = useProducts(params);

  // Фильтруем товары, исключая текущий товар
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    let filtered = products;
    
    // Дополнительная фильтрация по тегам на клиенте
    if (tagId) {
      filtered = filtered.filter((product: any) => {
        return product.tags && product.tags.some((tag: any) => tag.id === tagId);
      });
    }
    
    // Дополнительная фильтрация по категориям на клиенте
    if (categoryId) {
      filtered = filtered.filter((product: any) => {
        return product.categories && product.categories.some((cat: any) => cat.id === categoryId);
      });
    }
    
    // Исключаем текущий товар
    if (excludeProductId) {
      filtered = filtered.filter((product: any) => product.id !== excludeProductId);
    }
    
    // Ограничиваем количество
    return filtered.slice(0, limit);
  }, [products, tagId, categoryId, excludeProductId, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {showTitle && <h2 className="text-2xl font-bold">Схожі товари</h2>}
        <div>Завантаження...</div>
      </div>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 relative">
      {showTitle && <h2 className="text-2xl font-bold">Схожі товари</h2>}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="md:hidden relative">
        <Swiper
          slidesPerView={1.5}
          spaceBetween={16}
          pagination={{ clickable: true }}
          navigation={{
            nextEl: '.related-products-next',
            prevEl: '.related-products-prev',
          }}
          modules={[Navigation, Pagination]}
          className="related-products-swiper pb-12"
        >
          {filteredProducts.map((product: any) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="related-products-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md -translate-x-2" aria-label="Назад">
          <Image src="/svg/arrow-left.svg" alt="" width={24} height={24} />
        </button>
        <button className="related-products-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md translate-x-2" aria-label="Вперед">
          <Image src="/svg/arrow-right.svg" alt="" width={24} height={24} />
        </button>
      </div>
    </div>
  );
}

