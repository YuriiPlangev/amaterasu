'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PopularCategory = ({ category, locale = 'uk' }: { category: any; locale?: string }) => {
  const name = category.name ? encodeURIComponent(category.name) : '';
  const href = `/${locale}/catalog?category=${category.id}${name ? `&category_name=${name}` : ''}`;
  
  // Обработка различных форматов изображений
  const getImageUrl = () => {
    // WooCommerce REST API format: category.image.src
    if (category.image?.src) {
      return category.image.src;
    }
    // Direct image URL
    if (typeof category.image === 'string' && category.image) {
      return category.image;
    }
    // ACF image field (может быть объектом или строкой)
    if (category.acf?.image) {
      if (typeof category.acf.image === 'string') {
        return category.acf.image;
      }
      if (category.acf.image.url) {
        return category.acf.image.url;
      }
      if (category.acf.image.sizes?.large) {
        return category.acf.image.sizes.large;
      }
    }
    
    // Debug: показываем что пришло в консоли
    if (typeof window !== 'undefined') {
      console.log('Category image data:', {
        name: category.name,
        image: category.image,
        acf: category.acf
      });
    }
    
    // Fallback to placeholder
    return '/images/placeholder.jpg';
  };
  
  const imageUrl = getImageUrl();
  
  return (
    <Link href={href} className="block">
      <article className='group card-lift p-2 rounded-2xl border border-[#9C0000] relative w-full overflow-hidden hover:border-[#7D0000] transition-all duration-300'>
        <div className='relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100'>
          <Image
            src={imageUrl}
            alt={category.name || 'Category'}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            unoptimized={imageUrl.startsWith('http')}
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