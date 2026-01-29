'use client';
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import ProductCard from '../ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';

const BestSellers = () => {
  const { data: products, isLoading } = useProducts({ category: 19 });


  if (isLoading) {
    return (
      <section className='max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px] '>
        <h2 className='text-[55px] font-bold uppercase text-black py-14'>Хіти продажів</h2>
        <div>Loading...</div>
      </section>
    );
  }

  return (
    <section className='max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]'>
        <h2 className='text-[55px] font-bold uppercase text-black py-14'>Хіти продажів</h2>
        <div className='relative'>
          <button 
            className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10  cursor-pointer"
            aria-label="Прокрутити вліво"
          >
            <Image src='/svg/left.svg' alt='arrow-left' width={24} height={24} />
          </button>

          <button 
            className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10  cursor-pointer"
            aria-label="Прокрутити вправо"
          >
            <Image src='/svg/right.svg' alt='arrow-right' width={24} height={24} />
          </button>

          {products && products.length > 0 ? (
            <Swiper
              slidesPerView={4}
              spaceBetween={30}
              loop={products.length > 4}
              navigation={{
                nextEl: ".swiper-button-next-custom",
                prevEl: ".swiper-button-prev-custom",
              }}
              modules={[Navigation]}
              className="mySwiper"
            >
              {products.map((product: any) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-8">Товари не знайдено</div>
          )}
        </div>
    </section>
  )
}

export default BestSellers
