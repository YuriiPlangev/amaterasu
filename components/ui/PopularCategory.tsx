'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PopularCategory = ({ category, locale = 'uk' }: { category: any; locale?: string }) => {
  const name = category.name ? encodeURIComponent(category.name) : '';
  const href = `/${locale}/catalog?category=${category.id}${name ? `&category_name=${name}` : ''}`;
  return (
    <Link href={href} className="block">
      <article className='group card-lift p-2 rounded-2xl border border-[#9C0000] relative w-full overflow-hidden hover:border-[#7D0000] transition-all duration-300'>
        <div className='relative w-full aspect-square rounded-2xl overflow-hidden'>
          <Image
            src={category.image || category.acf?.image || '/images/placeholder.jpg'}
            alt={category.name}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
        </div>

        <div className='bg-[#1C1C1CB2] absolute bottom-2 left-2 right-2 rounded-b-2xl text-center py-2'>
          <h3 className='text-white font-bold text-[20px] truncate'>{category.name}</h3>
        </div>
      </article>
    </Link>
  );
};

export default PopularCategory