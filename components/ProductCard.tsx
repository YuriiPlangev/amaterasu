'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useToastStore } from '../store/toastStore';

export default function ProductCard({ product }: { product: any }) {
  const t = useTranslations('toast');
  const addToCart = useCartStore((state) => state.add);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product?.id));
  const showToast = useToastStore((state) => state.show);
  const locale = useLocale();

  const cleanDescription = product?.short_description
    ? product.short_description.replace(/<[^>]*>/g, '').trim()
    : '';
  
  const isInStock = product?.stock_status === 'instock';
  
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);

  // Обработчик для предотвращения перехода при клике на кнопки
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Обработчик для добавления в корзину
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showToast(t('addedToCart'), 'cart');
  };

  // Обработчик для кнопки "Придбати"
  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showToast(t('addedToCart'), 'cart');
  };
  const productTag = product?.tags?.[0]?.name || '';
  
  return (
    <Link href={`/${locale}/product/${product?.slug || product?.id}`} className="block">
      <article className={`relative border border-[#D8D8D8] px-5 py-4 flex flex-col rounded-2xl items-center gap-4 transition-all duration-300 hover:shadow-[0px_12px_28px_0px_#0000001A] cursor-pointer ${!isInStock ? 'opacity-50' : ''}`}>
      
        {productTag && (
          <span className='absolute top-4 left-4 bg-[#9C0000] text-white font-semibold rounded-[4px] z-10 px-[clamp(8px,1.6vw,16px)] py-[clamp(4px,0.6vw,8px)] text-[clamp(12px,1.2vw,17px)]'>
            {productTag}
          </span>
        )}
      <Image src={product?.images?.[0]?.src || '/images/placeholder.jpg'} alt={product?.name} width={300} height={260} className='w-full h-[260px] object-contain' />
      <div className='flex flex-col items-center w-full gap-[10px]'>
        <div className='flex justify-between items-center w-full gap-2'>
        <p className='text-[#9C0000] font-semibold text-[25px] whitespace-nowrap shrink-0'>
        {product?.price} ₴
      </p>
      <p className={`font-semibold text-[14px] text-right flex-1 min-w-0 ${isInStock ? 'text-[#2E7900]' : 'text-[#9C0000]'}`}>
        {isInStock ? 'В наявності' : 'Немає в наявності'} 
      </p>
        </div>
      
      <div className='self-start w-full'>
      <h3 className='text-black font-medium text-[16px] '>{product?.name}</h3>
      <p className='text-black font-medium text-[15px] truncate'>{cleanDescription}</p>
      </div>
      </div>
      <div className='flex justify-between items-center w-full gap-3'>
        <button 
          onClick={handleBuyClick}
          onMouseEnter={() => setIsCartHovered(true)}
          onMouseLeave={() => setIsCartHovered(false)}
          className='btn-press bg-[#9C0000] flex justify-center items-center gap-2 text-white px-3 py-2 rounded-md flex-1 hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-[14px]'
        >
          Придбати

          <Image 
            src={isCartHovered ? '/svg/shopping-bag-red.svg' : '/svg/shopping-bag.svg'} 
            alt='cart' 
            width={24} 
            height={24} 
            
          /> 
        </button>
        <button 
          onClick={(e) => {
            handleButtonClick(e);
            const wasFavorite = isFavorite;
            toggleFavorite(product);
            showToast(wasFavorite ? t('removedFromFavorites') : t('addedToFavorites'), wasFavorite ? 'favorite_remove' : 'favorite_add');
          }}
          onMouseEnter={() => setIsHeartHovered(true)}
          onMouseLeave={() => setIsHeartHovered(false)}
          className="heart-hover-pulse transition-transform duration-200"
        >
          <Image 
            src={isFavorite ? '/svg/heart-filled.svg' : '/svg/heart.svg'} 
            alt='favorite' 
            width={32} 
            height={32} 
            className="transition-transform duration-200"
          /> 
        </button>
      </div>
      
    </article>
    </Link>
  );
}
