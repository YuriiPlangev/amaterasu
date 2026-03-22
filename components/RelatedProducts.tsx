'use client';
import React, { useId } from 'react';
import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';

interface RelatedProductsProps {
  tagId?: number;
  categoryId?: number;
  attributeTitleId?: number | null;
  attributeGamesId?: number | null;
  excludeProductId?: number;
  limit?: number;
  showTitle?: boolean;
  titleKey?: 'similarProducts' | 'similarFromTitle' | 'similarFromCategory';
}

export default function RelatedProducts({
  tagId,
  categoryId,
  attributeTitleId,
  attributeGamesId,
  excludeProductId,
  limit = 4,
  showTitle = true,
  titleKey = 'similarProducts',
}: RelatedProductsProps) {
  const t = useTranslations('productPage');
  const tCommon = useTranslations('common');
  const tA11y = useTranslations('a11y');
  const uniqueId = useId().replace(/:/g, '');
  const prevSel = `.related-prev-${uniqueId}`;
  const nextSel = `.related-next-${uniqueId}`;

  const getProductsArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.products || [];
  };

  // Один запрос: attribute_title → attribute_games → tag → category → last 100
  const primaryParams: any = attributeTitleId
    ? { attribute_title: String(attributeTitleId) }
    : attributeGamesId
      ? { attribute_games: String(attributeGamesId) }
      : tagId
        ? { tag: tagId }
        : categoryId
          ? { category: categoryId }
          : { per_page: 100 };

  const { data: products, isLoading } = useProducts({ ...primaryParams, per_page: 12 });

  const filteredProducts = React.useMemo(() => {
    let filtered = getProductsArray(products);
    if (excludeProductId) {
      filtered = filtered.filter((product: any) => product.id !== excludeProductId);
    }
    return filtered.slice(0, limit);
  }, [products, excludeProductId, limit]);

  const isLoadingState = isLoading;

  const titleText = t(titleKey);
  // Стрілки тільки коли товарів більше ніж вміщається на екрані (max 4 у breakpoints)
  const showArrows = filteredProducts.length > 4;

  if (isLoadingState) {
    return (
      <div className="flex flex-col gap-6">
        {showTitle && <h2 className="text-2xl font-bold text-[#1C1C1C]">{titleText}</h2>}
        <div className="text-[#6B7280]">{tCommon('loading')}</div>
      </div>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 relative overflow-visible">
      {showTitle && (
        <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold text-[#1C1C1C]">{titleText}</h2>
      )}
      <div className="relative overflow-visible -mx-2 md:mx-0 touch-pan-x">
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
          navigation={showArrows ? { nextEl: nextSel, prevEl: prevSel } : false}
          modules={[Navigation]}
          passiveListeners={false}
          touchReleaseOnEdges={true}
          className="related-products-swiper pb-12"
        >
          {filteredProducts.map((product: any) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
        {showArrows && (
          <div className="flex justify-between items-center mt-3 px-2 md:mt-0 md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2 md:pointer-events-none">
            <button
              className={`related-prev-${uniqueId} z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md md:absolute md:-left-[60px] pointer-events-auto`}
              aria-label={tA11y('scrollLeft')}
            >
              <Image src="/svg/arrow-left.svg" alt="" width={24} height={24} />
            </button>
            <button
              className={`related-next-${uniqueId} z-10 w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md md:absolute md:-right-[60px] pointer-events-auto`}
              aria-label={tA11y('scrollRight')}
            >
              <Image src="/svg/arrow-right.svg" alt="" width={24} height={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

