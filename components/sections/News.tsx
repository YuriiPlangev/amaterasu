'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
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
  const { data: posts = [], isLoading: loading, error } = useNews(6)
  const errorMessage = error instanceof Error ? error.message : error ? 'Невідома помилка' : null

  if (loading) {
    return (
      <section className='w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x flex justify-between items-center mt-12'>
          <h2 className='text-[clamp(28px,2.2vw,55px)] font-bold uppercase text-black py-[clamp(20px,2.2vw,56px)]'>Новини та акції</h2>
          <button className='bg-[#9C0000] px-6 py-2.5 flex items-center text-white h-auto rounded-lg'>
            Посмотреть все новости и акции
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
          <button className='bg-[#9C0000] px-6 py-2.5 gap-2.5 flex items-center text-white h-auto rounded-lg'>
            Посмотреть все новости и акции
            <Image src={'/svg/right.svg'} alt="" width={20} height={20} />
            </button>
        </div>
        <div className='text-center py-10 text-red-500'>Помилка: {errorMessage}</div>
      </section>
    )
  }

  return (
    <section className='w-full bg-white'>
      <div className='max-w-[1920px] mx-auto site-padding-x flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-4 md:py-[clamp(20px,2.2vw,56px)]'>Новини та акції</h2>
        <Link href={`/${locale}/news`} className='hidden sm:flex bg-[#9C0000] px-6 py-2.5 gap-2 items-center text-white h-auto rounded-lg shrink-0'>
          Посмотреть все новости и акции
          <Image src={'/svg/right.svg'} alt="" width={20} height={20} />
        </Link>
      </div>
      
      {posts.length > 0 ? (
        <>
          {/* Grid для больших экранов (lg+) */}
          <div className='hidden lg:block'>
            <div className='max-w-[1920px] mx-auto site-padding-x pb-6'>
              <div className='grid grid-cols-3 gap-[clamp(12px,1vw,24px)]'>
                {posts.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>

          {/* Grid для средних экранов (sm-lg) */}
          <div className='hidden sm:block lg:hidden'>
            <div className='max-w-[1920px] mx-auto site-padding-x pb-6'>
              <div className='grid grid-cols-2 gap-[clamp(12px,1vw,24px)]'>
                {posts.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>

          {/* Swiper для мобильных с arrows и pagination */}
          <div className='block sm:hidden relative site-padding-x pb-12'>
            <Swiper
              slidesPerView={1}
              spaceBetween={16}
              loop={true}
              pagination={{ clickable: true }}
              navigation={{
                nextEl: '.news-swiper-next',
                prevEl: '.news-swiper-prev',
              }}
              modules={[Navigation, Pagination]}
              className='news-swiper'
            >
              {posts.map((post) => (
                <SwiperSlide key={post.id}>
                  <NewsCard post={post} />
                </SwiperSlide>
              ))}
            </Swiper>
            <button className='news-swiper-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#1C1C1C] flex items-center justify-center shadow-md' aria-label='Назад'>
              <Image src='/svg/arrow-left.svg' alt='' width={24} height={24} />
            </button>
            <button className='news-swiper-next absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#1C1C1C] flex items-center justify-center shadow-md' aria-label='Вперёд'>
              <Image src='/svg/arrow-right.svg' alt='' width={24} height={24} />
            </button>
          </div>
        </>
      ) : (
        <div className='text-center py-10 text-gray-500'>Новостей не знайдено</div>
      )}
    </section>
  )
}

export default News
