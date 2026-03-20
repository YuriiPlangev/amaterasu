'use client';
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useTranslations } from 'next-intl';

import ProductCard from '../ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css/pagination';
import Image from 'next/image';
import { ProductSkeleton, SquareSkeleton } from '../ui/Skeletons';

const BestSellers = () => {
  const t = useTranslations('a11y');
  const { data: products, isLoading } = useProducts({ bestseller: true });


  if (isLoading) {
    return (
      <section className='w-full bg-white'>
        <div className='max-w-[1920px] w-full mx-auto site-padding-x'>
          <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-6 md:py-[clamp(20px,2.2vw,56px)]'>Хіти продажів</h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={i === 3 ? 'hidden sm:block' : i === 4 ? 'hidden lg:block' : ''}>
                <ProductSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='w-full relative overflow-x-hidden overflow-y-visible bg-white'>
      <div className='max-w-[1920px] w-full mx-auto site-padding-x overflow-x-hidden'>
        <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-6 md:py-[clamp(20px,2.2vw,56px)]'>Хіти продажів</h2>
        <div className='relative overflow-x-hidden overflow-y-visible'>
          <button 
            className="swiper-button-prev-custom absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer border border-[#1C1C1C] rounded-full p-2.5 shadow-md bg-white hidden md:flex items-center justify-center -left-[60px]"
            aria-label={t('scrollLeft')}
          >
            <Image src='/svg/arrow-left.svg' alt="" width={24} height={24} />
          </button>

          <button 
            className="swiper-button-next-custom absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer border border-[#1C1C1C] rounded-full p-2.5 shadow-md bg-white hidden md:flex items-center justify-center -right-[60px]"
            aria-label={t('scrollRight')}
          >
            <Image src='/svg/arrow-right.svg' alt="" width={24} height={24} />
          </button>

          {products && products.length > 0 ? (
            <Swiper
              slidesPerView={2}
              spaceBetween={12}
              breakpoints={{
                1600: { slidesPerView: 4, spaceBetween: 30 },
                1200: { slidesPerView: 3, spaceBetween: 18 },
                768: { slidesPerView: 2, spaceBetween: 12 },
                0: { slidesPerView: 2, spaceBetween: 12 }
              }}
              loop={true}
              navigation={{
                nextEl: ".swiper-button-next-custom",
                prevEl: ".swiper-button-prev-custom",
              }}
              modules={[Navigation]}
              className="best-sellers-swiper pb-12"
            >
              {products.map((product: any) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-8 text-black">Товари не знайдено</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default BestSellers
