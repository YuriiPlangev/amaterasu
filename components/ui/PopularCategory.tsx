'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProxiedImageUrl } from '../../lib/imageProxy';

const PopularCategory = ({ category, locale = 'uk' }: { category: any; locale?: string }) => {
  const name = category.name ? encodeURIComponent(category.name) : '';
  const href = `/${locale}/catalog?category=${category.id}${name ? `&category_name=${name}` : ''}`;
  
  // Обработка различных форматов изображений
  const getImageUrl = () => {
    let imageUrl = '';
    
    // WooCommerce REST API format: category.image.src
    if (category.image?.src) {
      imageUrl = category.image.src;
    }
    // Direct image URL
    else if (typeof category.image === 'string' && category.image) {
      imageUrl = category.image;
    }
    // ACF image field (может быть объектом или строкой)
    else if (category.acf?.image) {
      if (typeof category.acf.image === 'string') {
        imageUrl = category.acf.image;
      } else if (category.acf.image.url) {
        imageUrl = category.acf.image.url;
      } else if (category.acf.image.sizes?.large) {
        imageUrl = category.acf.image.sizes.large;
      }
    }
    
    if (!imageUrl) {
      return null;
    }
    
    return imageUrl;
  };
  
  const imageUrl = getProxiedImageUrl(getImageUrl());
  
  return (
    <Link href={href} className="block">
      <article className='group card-lift p-2 rounded-2xl border border-[#9C0000] relative w-full overflow-hidden hover:border-[#7D0000] transition-all duration-300'>
        <div className='relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100'>
          <Image
            src={imageUrl}
            alt={category.name || 'Category'}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            unoptimized={false}
          />
        </div>

        <div className='bg-[#1C1C1CB2] absolute bottom-2 left-2 right-2 rounded-b-2xl text-center py-2'>
          <h3 className='text-white font-medium text-[20px] truncate'>{category.name}</h3>
        </div>
      </article>
    </Link>
  );
};

export default PopularCategory