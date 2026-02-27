'use client';

import React, { useEffect } from 'react';
import { useLocale } from 'next-intl';
import PopularCategory from '../ui/PopularCategory';
import { SquareSkeleton } from '../ui/Skeletons';
import { useCategories } from '../../hooks/useCategories';

const PopularCategories = () => {
  const locale = useLocale();
  const { data: categories = [], isLoading: loading } = useCategories();
  const visibleCategories = categories.slice(0, 6);
  const showPlaceholders = loading || visibleCategories.length === 0;

  // Debug: выводим данные категорий в консоль
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log('Popular categories loaded:', categories.length);
      console.log('First category example:', categories[0]);
    }
  }, [categories]);

  return (
    <section className='w-full bg-white'>
      <div className='max-w-[1920px] mx-auto site-padding-x'>
        <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-6 md:py-[clamp(20px,2.2vw,56px)]'>Популярні категорії</h2>
      </div>

      <div className='w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x'>
          <div className='grid grid-cols-2 sm:grid-cols-3 grid-rows-2 gap-4 md:gap-6 lg:grid-cols-6 lg:grid-rows-1 pb-6'>
            {showPlaceholders
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={i <= 2 ? '' : i <= 4 ? 'hidden sm:block' : 'hidden lg:block'}>
                    <SquareSkeleton />
                  </div>
                ))
              : visibleCategories.map((category: { id: number; [key: string]: unknown }) => (
                <PopularCategory key={category.id} category={category} locale={locale} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularCategories