'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Navigation, Pagination } from 'swiper/modules'
import NewsCard from '../NewsCard'
import Image from 'next/image'
import { CardSkeleton } from '../ui/Skeletons'
import { useNews } from '../../hooks/useNews'

const News = () => {
  const locale = useLocale()
  const tNews = useTranslations('news')
  const tA11y = useTranslations('a11y')
  const { data: posts = [], isLoading: loading, error } = useNews(6)
  const errorMessage = error instanceof Error ? error.message : error ? 'Невідома помилка' : null

  if (loading) {
    return (
      <section className='w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x flex justify-between items-center mt-12'>
          <h2 className='text-[clamp(28px,2.2vw,55px)] font-bold uppercase text-black py-[clamp(20px,2.2vw,56px)]'>Новини та акції</h2>
          <button className='bg-[#9C0000] hover:bg-[#b91c1c] px-6 py-2.5 flex items-center gap-2 text-white h-auto rounded-lg uppercase transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'>
            {tNews('viewAll')}
            <Image src={'/svg/right.svg'} alt="" width={24} height={24} />
            </button>
        </div>
        <div className='text-center py-10'>
          <div className='max-w-[1920px] mx-auto site-padding-x'>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={i === 1 ? '' : i === 2 ? 'hidden sm:block' : 'hidden lg:block'}>
                  <CardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className='w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x flex justify-between items-center'>
          <h2 className='text-[clamp(28px,2.2vw,55px)] font-bold uppercase text-black py-[clamp(20px,2.2vw,56px)]'>Новини та акції</h2>
          <button className='bg-[#9C0000] hover:bg-[#b91c1c] px-6 py-2.5 gap-2.5 flex items-center text-white h-auto rounded-lg uppercase transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'>
            {tNews('viewAll')}
            <Image src={'/svg/right.svg'} alt="" width={20} height={20} />
            </button>
        </div>
        <div className='text-center py-10 text-red-500'>Помилка: {errorMessage}</div>
      </section>
    )
  }

  return (
    <section className='w-full relative overflow-visible bg-white'>
      <div className='max-w-[1920px] mx-auto site-padding-x flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-4 md:py-[clamp(20px,2.2vw,56px)]'>Новини та акції</h2>
        <Link href={`/${locale}/news`} className='hidden sm:flex group bg-[#9C0000] hover:bg-[#b91c1c] px-6 py-2.5 gap-2 items-center text-white h-auto rounded-lg shrink-0 uppercase transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'>
          {tNews('viewAll')}
          <Image src={'/svg/right.svg'} alt="" width={20} height={20} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
      
      {posts.length > 0 ? (
        <>
          {/* Swiper: 1 на мобилці, 3 на десктопі */}
          <div className='max-w-[1920px] mx-auto site-padding-x pb-12'>
            <div className='relative overflow-visible'>
              <button
                type="button"
                className="news-swiper-prev absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer border border-[#1C1C1C] rounded-full p-2.5 shadow-md bg-white hidden md:flex items-center justify-center -left-[60px]"
                aria-label={tA11y('scrollLeft')}
              >
                <Image src='/svg/arrow-left.svg' alt='' width={24} height={24} />
              </button>

              <button
                type="button"
                className="news-swiper-next absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer border border-[#1C1C1C] rounded-full p-2.5 shadow-md bg-white hidden md:flex items-center justify-center -right-[60px]"
                aria-label={tA11y('scrollRight')}
              >
                <Image src='/svg/arrow-right.svg' alt='' width={24} height={24} />
              </button>

              <Swiper
                slidesPerView={1}
                spaceBetween={16}
                breakpoints={{
                  0: { slidesPerView: 1, spaceBetween: 16 },
                  768: { slidesPerView: 2, spaceBetween: 20 },
                  1600: { slidesPerView: 3, spaceBetween: 24 },
                }}
                loop={true}
                pagination={{ el: '.news-pagination', clickable: true }}
                navigation={{
                  nextEl: '.news-swiper-next',
                  prevEl: '.news-swiper-prev',
                }}
                modules={[Navigation, Pagination]}
                className='news-swiper [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:h-auto [&_.swiper-slide]:flex'
              >
                {posts.map((post) => (
                  <SwiperSlide key={post.id} className="h-auto flex">
                    <NewsCard post={post} />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="news-pagination flex justify-center gap-1 mt-4 md:hidden" />
            </div>
          </div>
        </>
      ) : (
        <div className='text-center py-10 text-gray-500'>Новостей не знайдено</div>
      )}
    </section>
  )
}

export default News
